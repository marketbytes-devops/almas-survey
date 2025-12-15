import logging
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