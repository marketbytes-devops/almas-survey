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
from django.conf import settings
from urllib.parse import quote
import traceback

from .pdf_generator import generate_quotation_pdf

logger = logging.getLogger(__name__)

@method_decorator(csrf_exempt, name="dispatch")
class QuotationViewSet(viewsets.ModelViewSet):
    queryset = Quotation.objects.select_related("survey", "currency").all()
    serializer_class = QuotationSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset())
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        assert lookup_url_kwarg in self.kwargs, (
            'Expected view %s to be called with a URL keyword argument '
            'named "%s". Fix your URL conf, or set the `.lookup_field` '
            'attribute on the view correctly.' %
            (self.__class__.__name__, lookup_url_kwarg)
        )

        lookup_value = self.kwargs[lookup_url_kwarg]
        
        if str(lookup_value).isdigit():
            obj = queryset.filter(pk=lookup_value).first()
            if obj:
                return obj
        
        from django.shortcuts import get_object_or_404
        return get_object_or_404(queryset, quotation_id=lookup_value)

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
        
        
    @action(detail=True, methods=["post"], url_path="send-whatsapp")
    def send_whatsapp(self, request, pk=None):
        """Generate quotation PDF and return WhatsApp URL with direct attachment"""
        try:
            quotation = self.get_object()
            
            logger.info(f"Generating PDF for quotation {quotation.quotation_id}")
            
            # Get customer details
            customer_name = "Sir/Madam"
            phone_number = None
            
            if quotation.survey:
                survey = quotation.survey
                customer_name = getattr(survey, 'full_name', 'Sir/Madam') or 'Sir/Madam'
                phone_number = getattr(survey, 'phone_number', None)
            
            if not phone_number:
                return Response(
                    {"error": "Customer phone number not found in survey."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            
            # Clean phone (India/Qatar support)
            clean_phone = ''.join(filter(str.isdigit, str(phone_number)))
            clean_phone = clean_phone.lstrip('0')
            if len(clean_phone) == 10:
                clean_phone = '91' + clean_phone       # India
            elif len(clean_phone) == 8:
                clean_phone = '974' + clean_phone      # Qatar
            elif len(clean_phone) == 9:
                clean_phone = '91' + clean_phone
            
            if len(clean_phone) < 10:
                return Response(
                    {"error": f"Invalid phone number format: {phone_number}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            
            # Generate PDF
            try:
                filepath, filename = generate_quotation_pdf(quotation)
                pdf_url = request.build_absolute_uri(
                    f"{settings.MEDIA_URL}quotation_pdfs/{filename}"
                )
            except Exception as pdf_error:
                logger.error(f"PDF Generation Error: {str(pdf_error)}", exc_info=True)
                return Response(
                    {"error": f"Failed to generate PDF: {str(pdf_error)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
            
            # Calculate pricing
            amount = float(quotation.amount or 0)
            discount = float(quotation.discount or 0)
            advance = float(quotation.advance or 0)
            final_amount = max(0, amount - discount)
            balance = max(0, final_amount - advance)
            
            # Move details
            service_type = "Not specified"
            origin = "Not specified"
            destination = "Not specified"
            
            if quotation.survey:
                survey = quotation.survey
                service_type = getattr(survey, 'service_type', 'Not specified') or 'Not specified'
                origin = getattr(survey, 'origin_city', None) or getattr(survey, 'origin_address', 'Not specified')
                
                if hasattr(survey, 'destination_addresses') and survey.destination_addresses.exists():
                    dest_qs = survey.destination_addresses.first()
                    destination = getattr(dest_qs, 'city', None) or getattr(dest_qs, 'address', 'Not specified')
            
            # ★★★ NEW PROFESSIONAL MESSAGE FORMAT ★★★
            message = f"""Dear Sir/Madam

    Greetings from Almas Movers Intl.
    Many thanks for the enquiry, please find the attached quotation for your kind perusal.
    Hope the above meets your requirement, please let us know if any assistance / clarification required.
    Kindly acknowledge the receipt by return.
    I welcome your kind feedback.

    Quotation - Almas Movers

        � Quotation ID: {quotation.quotation_id}
        � Client: {customer_name}

        � Service: {service_type}
        � From: {origin}
        � To: {destination}

        � Pricing Summary:
        - Total Amount: {amount:.2f} QAR
        - Discount: {discount:.2f} QAR
        - Final Amount: {final_amount:.2f} QAR
        - Advance Payment: {advance:.2f} QAR
        - Balance Due: {balance:.2f} QAR

        ━━━━━━━━━━━━━━━━━━
        � DOWNLOAD COMPLETE QUOTATION:
        {pdf_url}

        Click the link above to view full quotation details.

        Thank you for choosing Almas Movers! �
        - Almas Movers Management"""
            
            # Create WhatsApp URL with direct attachment
            encoded_message = quote(message)
            encoded_pdf_url = quote(pdf_url)
            
            whatsapp_url = f"https://wa.me/{clean_phone}?text={encoded_message}&attach={encoded_pdf_url}"
            
            return Response({
                'success': True,
                'whatsapp_url': whatsapp_url,
                'pdf_url': pdf_url,
                'customer_name': customer_name,
                'phone_number': phone_number,
                'clean_phone': clean_phone,
            }, status=status.HTTP_200_OK)
            
        except Quotation.DoesNotExist:
            return Response({'error': 'Quotation not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error in send_whatsapp: {str(e)}", exc_info=True)
            return Response({"error": f"Unexpected error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)