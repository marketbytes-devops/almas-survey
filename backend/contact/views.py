import logging
from django.core.mail import send_mail, EmailMultiAlternatives
from django.conf import settings
import requests
from authapp.models import CustomUser
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from .models import Enquiry
from .serializers import EnquirySerializer
from .tasks import send_enquiry_emails_task, send_survey_email_task

logger = logging.getLogger(__name__)

SERVICE_TYPE_DISPLAY = {
    "localMove": "Local Move",
    "internationalMove": "International Move",
    "carExport": "Car Import and Export",
    "storageServices": "Storage Services",
    "logistics": "Logistics",
}


class EnquiryListCreate(generics.ListCreateAPIView):
    queryset = Enquiry.objects.all()
    serializer_class = EnquirySerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [IsAuthenticated()]
        return [AllowAny()]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if not user.is_authenticated:
            return queryset.none()

        if user.is_superuser or (
            hasattr(user, "role") and user.role.name == "Superadmin"
        ):
            return queryset

        has_survey = self.request.query_params.get("has_survey")
        contact_status = self.request.query_params.get("contact_status")
        unassigned = self.request.query_params.get("unassigned")
        assigned_user_email = self.request.query_params.get("assigned_user_email")

        if assigned_user_email:
            queryset = queryset.filter(assigned_user__email__iexact=assigned_user_email)
        else:
            queryset = queryset.filter(assigned_user=user)

        if contact_status:
            queryset = queryset.filter(contact_status=contact_status)
        if unassigned == "true":
            queryset = queryset.filter(assigned_user__isnull=True)
        if has_survey == "true":
            queryset = queryset.filter(survey_date__isnull=False)
        elif has_survey == "false":
            queryset = queryset.filter(survey_date__isnull=True)

        return queryset

    def create(self, request, *args, **kwargs):
        try:
            recaptcha_token = request.data.get("recaptchaToken")
            if not recaptcha_token:
                return Response(
                    {"error": "reCAPTCHA token is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            recaptcha_response = requests.post(
                "https://www.google.com/recaptcha/api/siteverify",
                data={
                    "secret": settings.RECAPTCHA_SECRET_KEY,
                    "response": recaptcha_token,
                },
            )
            recaptcha_result = recaptcha_response.json()

            if (
                not recaptcha_result.get("success")
                or recaptcha_result.get("score", 0) < 0.5
            ):
                return Response(
                    {"error": "Invalid reCAPTCHA. Please try again."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            enquiry = serializer.save()

            full_data = self.get_serializer(enquiry).data

            print(f"Sending enquiry email for: {enquiry.fullName}")
            send_enquiry_emails_task.delay(full_data)

            logger.info(f"Enquiry email task queued for {enquiry.fullName}")

            return Response(
                full_data, 
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            logger.error(f"Failed to create enquiry: {str(e)}", exc_info=True)
            return Response(
                {"error": "Something went wrong. Please try again."},
                status=status.HTTP_400_BAD_REQUEST,
            )


class EnquiryRetrieveUpdateDestroy(generics.RetrieveUpdateDestroyAPIView):
    queryset = Enquiry.objects.all()
    serializer_class = EnquirySerializer
    permission_classes = [IsAuthenticated]

    def patch(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        
        previous_assigned_user_email = (
            instance.assigned_user.email if instance.assigned_user else None
        )
        previous_contact_status = instance.contact_status

        serializer.save()

        full_data = self.get_serializer(instance).data

        current_assigned_email = full_data.get("assigned_user_email")
        
        if current_assigned_email != previous_assigned_user_email:
            print(f"ASSIGNMENT DETECTED: {previous_assigned_user_email} → {current_assigned_email}")

            print(f"Queuing assignment email to: {current_assigned_email}")
            send_survey_email_task.delay(full_data, "assign")
            
            logger.info(f"Assignment email queued for enquiry {instance.id}")

        if (
            "contact_status" in request.data
            and request.data["contact_status"] != previous_contact_status
        ):
            print(f"Queuing contact status update email")
            send_survey_email_task.delay(full_data, "contact_status_update")

            logger.info(f"Contact status email queued for enquiry {instance.id}")

        return Response(full_data)


class EnquiryDelete(generics.DestroyAPIView):
    queryset = Enquiry.objects.all()
    serializer_class = EnquirySerializer

    def perform_destroy(self, instance):
        instance.delete()

    def delete(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(
            {"message": "Enquiry deleted successfully"},
            status=status.HTTP_204_NO_CONTENT,
        )


class EnquiryDeleteAll(generics.GenericAPIView):
    def delete(self, request, *args, **kwargs):
        count, _ = Enquiry.objects.all().delete()
        return Response(
            {"message": f"Successfully deleted {count} enquiries"},
            status=status.HTTP_204_NO_CONTENT,
        )


class EnquirySchedule(generics.GenericAPIView):
    queryset = Enquiry.objects.all()
    serializer_class = EnquirySerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, pk, *args, **kwargs):
        try:
            enquiry = self.get_queryset().get(pk=pk)
            survey_date_str = request.data.get("survey_date")
            
            if not survey_date_str:
                return Response(
                    {"error": "Survey date is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            action = "schedule" if enquiry.survey_date is None else "reschedule"
            
            serializer = self.get_serializer(
                enquiry, data={"survey_date": survey_date_str}, partial=True
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()

            full_data = self.get_serializer(enquiry).data

            survey_date_for_task = enquiry.survey_date.isoformat() if enquiry.survey_date else None

            print(f"Queuing survey {action} email for enquiry {pk}")
            send_survey_email_task.delay(full_data, action, survey_date=survey_date_for_task)

            logger.info(f"Survey {action} email queued for enquiry {pk}")
            return Response(full_data, status=status.HTTP_200_OK)

        except Enquiry.DoesNotExist:
            return Response(
                {"error": "Enquiry not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Failed to schedule survey: {e}", exc_info=True)
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )


class EnquiryCancelSurvey(generics.GenericAPIView):
    queryset = Enquiry.objects.all()
    serializer_class = EnquirySerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, pk, *args, **kwargs):
        try:
            enquiry = self.get_queryset().get(pk=pk)
            reason = request.data.get("reason")
            
            if not reason:
                return Response(
                    {"error": "Reason for cancellation is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            previous_survey_date_str = enquiry.survey_date.isoformat() if enquiry.survey_date else None

            serializer = self.get_serializer(
                enquiry, data={"survey_date": None}, partial=True
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()

            full_data = self.get_serializer(enquiry).data
            full_data['previous_survey_date'] = previous_survey_date_str

            print(f"Queuing survey cancellation email for enquiry {pk}")
            send_survey_email_task.delay(full_data, "cancel", reason=reason)

            logger.info(f"Survey cancel email queued for enquiry {pk}")
            return Response(full_data, status=status.HTTP_200_OK)

        except Enquiry.DoesNotExist:
            return Response(
                {"error": "Enquiry not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Failed to cancel survey: {e}", exc_info=True)
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )