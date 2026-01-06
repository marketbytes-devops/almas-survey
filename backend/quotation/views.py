import logging
import os
from django.db import transaction
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework_simplejwt.authentication import JWTAuthentication
from .models import Quotation
from .serializers import QuotationSerializer
from survey.models import Survey
from django.utils import timezone

logger = logging.getLogger(__name__)

@method_decorator(csrf_exempt, name="dispatch")
class QuotationViewSet(viewsets.ModelViewSet):
    queryset = Quotation.objects.select_related("survey", "currency").all()
    serializer_class = QuotationSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    lookup_field = "quotation_id"

    def get_queryset(self):
        qs = super().get_queryset()
        survey_id = self.request.query_params.get("survey_id")
        if survey_id:
            qs = qs.filter(survey__survey_id=survey_id)
        return qs

    def perform_create(self, serializer):
        with transaction.atomic():
            quotation = serializer.save()
            logger.info(
                f"Quotation {quotation.quotation_id} created for survey {quotation.survey.survey_id}"
            )

    def perform_update(self, serializer):
        with transaction.atomic():
            quotation = serializer.save()
            logger.info(f"Quotation {quotation.quotation_id} updated.")

    def perform_destroy(self, instance):
        survey_id = instance.survey.survey_id if instance.survey else "unknown"
        instance.delete()
        logger.info(f"Quotation deleted for survey {survey_id}")

    @action(detail=False, methods=["get"], url_path="check")
    def check_quotation(self, request):
        survey_id = request.query_params.get("survey_id")
        if not survey_id:
            return Response({"detail": "survey_id is required"}, status=400)
        try:
            survey = Survey.objects.get(survey_id=survey_id)
            quotation = Quotation.objects.get(survey=survey)
            return Response({"exists": True, "quotation_id": quotation.quotation_id})
        except (Survey.DoesNotExist, Quotation.DoesNotExist):
            return Response({"exists": False})

    @action(detail=False, methods=["post"], url_path="create-draft")
    def create_draft(self, request):
        survey_id = request.data.get("survey_id")
        if not survey_id:
            return Response({"detail": "survey_id is required"}, status=400)

        try:
            survey = Survey.objects.get(id=survey_id)
        except Survey.DoesNotExist:
            return Response({"detail": "Survey not found"}, status=404)

        if Quotation.objects.filter(survey=survey).exists():
            quotation = Quotation.objects.get(survey=survey)
            return Response(
                {
                    "detail": "Quotation already exists",
                    "quotation_id": quotation.quotation_id,
                },
                status=200,
            )

        with transaction.atomic():
            quotation = Quotation.objects.create(
                survey=survey,
                date=timezone.now().date(),
                amount=0,
                advance=0,
            )

        return Response(self.get_serializer(quotation).data, status=201)

    @action(detail=False, methods=["delete"], url_path="delete")
    def delete_quotation(self, request):
        quotation_id = request.data.get("quotation_id")
        if not quotation_id:
            return Response({"detail": "quotation_id is required"}, status=400)

        try:
            quotation = Quotation.objects.get(quotation_id=quotation_id)
            survey_id = quotation.survey.survey_id
            quotation.delete()
            return Response(
                {"detail": "Quotation deleted", "survey_id": survey_id}, status=200
            )
        except Quotation.DoesNotExist:
            return Response({"detail": "Quotation not found"}, status=404)

    @action(detail=True, methods=["post"], url_path="upload-signature")
    def upload_signature(self, request, quotation_id=None):
        """Upload customer signature for a quotation"""
        try:
            quotation = self.get_object()
            
            if 'signature' not in request.FILES:
                return Response({'error': 'No signature file provided'}, status=status.HTTP_400_BAD_REQUEST)
            
            signature_file = request.FILES['signature']
            
            quotation.signature = signature_file
            quotation.signature_uploaded = True
            quotation.save()
            
            logger.info(f"Signature uploaded for quotation {quotation.quotation_id}")
            
            return Response(
                {
                    'message': 'Signature uploaded successfully',
                    'signature_url': request.build_absolute_uri(quotation.signature.url)
                },
                status=status.HTTP_200_OK
            )
        except Quotation.DoesNotExist:
            return Response({'error': 'Quotation not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error uploading quotation signature: {str(e)}", exc_info=True)
            return Response({'error': f'Failed to upload signature: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=["get", "delete"], url_path="signature")
    def signature_action(self, request, quotation_id=None):
        """Get or delete signature for a quotation"""
        try:
            quotation = self.get_object()
            
            if request.method == "DELETE":
                if quotation.signature:
                    if os.path.isfile(quotation.signature.path):
                        os.remove(quotation.signature.path)
                    quotation.signature = None
                    quotation.signature_uploaded = False
                    quotation.save()
                    return Response({'message': 'Signature deleted successfully'}, status=status.HTTP_200_OK)
                return Response({'error': 'No signature found'}, status=status.HTTP_404_NOT_FOUND)

            if quotation.signature:
                return Response(
                    {
                        'has_signature': True,
                        'signature_url': request.build_absolute_uri(quotation.signature.url)
                    },
                    status=status.HTTP_200_OK
                )
            return Response({'has_signature': False, 'signature_url': None}, status=status.HTTP_200_OK)
        except Quotation.DoesNotExist:
            return Response({'error': 'Quotation not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error handling quotation signature: {str(e)}", exc_info=True)
            return Response({'error': f'Failed to handle signature: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)