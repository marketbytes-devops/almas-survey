import logging
import os
from urllib.parse import quote

from django.conf import settings
from django.db import transaction
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework import serializers

from survey.models import Survey
from .models import Quotation
from .serializers import QuotationSerializer
from .pdf_generator import generate_quotation_pdf

logger = logging.getLogger(__name__)


class QuotationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing quotations.
    - One quotation per survey (enforced)
    - JWT + IsAuthenticated protection
    """
    queryset = Quotation.objects.select_related("survey", "currency").all()
    serializer_class = QuotationSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset())
        lookup_value = self.kwargs.get(self.lookup_url_kwarg or self.lookup_field)

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
        survey = serializer.validated_data.get("survey")

        if not survey:
            raise serializers.ValidationError(
                {"survey": "This field is required when creating a quotation."}
            )

        if Quotation.objects.filter(survey=survey).exists():
            existing = Quotation.objects.select_related("survey").get(survey=survey)
            raise serializers.ValidationError(
                {
                    "detail": "A quotation already exists for this survey.",
                    "status": "already_exists",
                    "existing_quotation_id": existing.quotation_id,
                    "quotation_created_at": existing.created_at,
                }
            )

        with transaction.atomic():
            quotation = serializer.save()
            logger.info(
                f"Quotation {quotation.quotation_id} created for survey {survey.survey_id}"
            )

    def perform_update(self, serializer):
        with transaction.atomic():
            quotation = serializer.save()
            logger.info(f"Quotation {quotation.quotation_id} updated.")

    def perform_destroy(self, instance):
        survey_id = instance.survey.survey_id if instance.survey else "unknown"
        instance.delete()
        logger.info(f"Quotation deleted for survey {survey_id}")

    @action(detail=False, methods=["get"], url_path="exists")
    def exists(self, request):
        survey_id = request.query_params.get("survey_id")
        if not survey_id:
            return Response({"detail": "survey_id is required"}, status=400)

        try:
            survey = Survey.objects.get(survey_id=survey_id)
            quotation = Quotation.objects.filter(survey=survey).first()
            if quotation:
                return Response({
                    "exists": True,
                    "quotation_id": quotation.quotation_id,
                    "created_at": quotation.created_at
                })
            return Response({"exists": False})
        except Survey.DoesNotExist:
            return Response({"exists": False})

    @action(detail=False, methods=["post"], url_path="create-draft")
    def create_draft(self, request):
        survey_id = request.data.get("survey_id")
        if not survey_id:
            return Response({"detail": "survey_id is required"}, status=400)

        try:
            survey = Survey.objects.get(survey_id=survey_id)
        except Survey.DoesNotExist:
            return Response({"detail": "Survey not found"}, status=404)

        if Quotation.objects.filter(survey=survey).exists():
            quotation = Quotation.objects.get(survey=survey)
            return Response({
                "detail": "Quotation already exists",
                "quotation_id": quotation.quotation_id,
            }, status=200)

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
            return Response({
                "detail": "Quotation deleted",
                "survey_id": survey_id
            }, status=200)
        except Quotation.DoesNotExist:
            return Response({"detail": "Quotation not found"}, status=404)

    @action(detail=True, methods=["post"], url_path="upload-signature")
    def upload_signature(self, request, pk=None):
        try:
            quotation = self.get_object()

            if "signature" not in request.FILES:
                return Response({"error": "No signature file provided"}, status=400)

            signature_file = request.FILES["signature"]
            quotation.signature = signature_file
            quotation.signature_uploaded = True
            quotation.save()

            logger.info(f"Signature uploaded for quotation {quotation.quotation_id}")

            return Response({
                "message": "Signature uploaded successfully",
                "signature_url": request.build_absolute_uri(quotation.signature.url)
            }, status=200)
        except Quotation.DoesNotExist:
            return Response({"error": "Quotation not found"}, status=404)
        except Exception as e:
            logger.error(f"Error uploading signature: {str(e)}", exc_info=True)
            return Response({"error": f"Failed to upload signature: {str(e)}"}, status=500)

    @action(detail=True, methods=["get", "delete"], url_path="signature")
    def signature_action(self, request, pk=None):
        try:
            quotation = self.get_object()

            if request.method == "DELETE":
                if quotation.signature and os.path.isfile(quotation.signature.path):
                    os.remove(quotation.signature.path)
                quotation.signature = None
                quotation.signature_uploaded = False
                quotation.save()
                return Response({"message": "Signature deleted successfully"}, status=200)

            if quotation.signature:
                return Response({
                    "has_signature": True,
                    "signature_url": request.build_absolute_uri(quotation.signature.url)
                }, status=200)
            return Response({"has_signature": False}, status=200)

        except Quotation.DoesNotExist:
            return Response({"error": "Quotation not found"}, status=404)
        except Exception as e:
            logger.error(f"Error handling signature: {str(e)}", exc_info=True)
            return Response({"error": f"Failed to handle signature: {str(e)}"}, status=500)

    @action(detail=True, methods=["post"], url_path="send-whatsapp")
    def send_whatsapp(self, request, pk=None):
        try:
            quotation = self.get_object()

            if not quotation.survey:
                return Response({"error": "No associated survey found"}, status=400)

            survey = quotation.survey
            customer_name = getattr(survey, "full_name", "Sir/Madam") or "Sir/Madam"
            phone_number = getattr(survey, "phone_number", None)

            if not phone_number:
                return Response({"error": "Customer phone number not found"}, status=400)

            digits = ''.join(filter(str.isdigit, str(phone_number)))
            digits = digits.lstrip('0')

            if not digits:
                return Response({"error": "Invalid phone number"}, status=400)

            if len(digits) == 10:
                clean_phone = "91" + digits
            elif len(digits) == 8:
                clean_phone = "974" + digits
            elif len(digits) == 9:
                clean_phone = "91" + digits
            elif len(digits) >= 10 and digits.startswith(('91', '974')):
                clean_phone = digits
            else:
                return Response({"error": f"Unsupported phone number format: {phone_number}"}, status=400)

            try:
                filepath, filename = generate_quotation_pdf(quotation)
                pdf_url = request.build_absolute_uri(f"{settings.MEDIA_URL}quotation_pdfs/{filename}")
            except Exception as pdf_error:
                logger.error(f"PDF generation failed: {str(pdf_error)}", exc_info=True)
                return Response({"error": "Failed to generate PDF"}, status=500)

            amount = float(quotation.amount or 0)
            discount = float(quotation.discount or 0)
            final_amount = float(quotation.final_amount or (amount - discount))
            advance = float(quotation.advance or 0)
            balance = float(quotation.balance or (final_amount - advance))
            currency_code = quotation.currency.code if quotation.currency else "QAR"

            service_type = getattr(survey, "service_type", "Not specified") or "Not specified"
            origin = getattr(survey, "origin_city", None) or getattr(survey, "origin_address", "Not specified")
            destination = "Not specified"
            if hasattr(survey, "destination_addresses") and survey.destination_addresses.exists():
                dest = survey.destination_addresses.first()
                destination = getattr(dest, "city", None) or getattr(dest, "address", "Not specified")

            service_type_map = {
                "localMove": "Local Move",
                "internationalMove": "International Move",
                "carExport": "Car Import and Export",
                "storageServices": "Storage Services",
                "logistics": "Logistics",
            }
            service_type_display = service_type_map.get(service_type, service_type)

            message = f"""Dear {customer_name},

Greetings from Almas Movers Intl.
Many thanks for the enquiry, please find the quotation for your kind perusal.

Quotation Link: {pdf_url}

Hope the above meets your requirement, please let us know if any assistance / clarification required.
Kindly acknowledge the receipt by return.
I welcome your kind feedback.

Quotation - Almas Movers

Quotation ID: {quotation.quotation_id}
Client: {customer_name}

Service: {service_type_display}
From: {origin}
To: {destination}

Pricing Summary:

- Total Amount: {amount:.2f} {currency_code}
- Discount: {discount:.2f} {currency_code}
- Final Amount: {final_amount:.2f} {currency_code}
- Advance Payment: {advance:.2f} {currency_code}
- Balance Due: {balance:.2f} {currency_code}

Thank you for choosing Almas Movers!

- Almas Movers Management"""

            encoded_message = quote(message)
            whatsapp_url = f"https://wa.me/{clean_phone}?text={encoded_message}"

            return Response({
                "success": True,
                "whatsapp_url": whatsapp_url,
                "customer_name": customer_name,
            }, status=200)

        except Quotation.DoesNotExist:
            return Response({"error": "Quotation not found"}, status=404)
        except Exception as e:
            logger.error(f"WhatsApp action failed: {str(e)}", exc_info=True)
            return Response({"error": "Unexpected error occurred"}, status=500)