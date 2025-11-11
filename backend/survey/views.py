import logging
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from django.http import Http404
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Survey, DestinationAddress, Article, Vehicle, Pet
from .serializers import SurveySerializer, DestinationAddressSerializer, ArticleSerializer, VehicleSerializer, PetSerializer
from contact.models import Enquiry
from additional_settings.models import Item
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework_simplejwt.authentication import JWTAuthentication

logger = logging.getLogger(__name__)

SERVICE_TYPE_DISPLAY = {
    "localMove": "Local Move",
    "internationalMove": "International Move",
    "carExport": "Car Import and Export",
    "storageServices": "Storage Services",
    "logistics": "Logistics",
}

def send_survey_submission_email(survey):
    from_email = settings.DEFAULT_FROM_EMAIL
    service_type_display = "Unknown Service Type"  

    if survey.enquiry and hasattr(survey.enquiry, 'serviceType'):
        service_type_display = SERVICE_TYPE_DISPLAY.get(
            survey.enquiry.serviceType, survey.enquiry.serviceType
        )

    superadmin_email = settings.CONTACT_EMAIL
    recipients = [superadmin_email]

    if (
        survey.enquiry and survey.enquiry.assigned_user
        and survey.enquiry.assigned_user.email != superadmin_email
    ):
        recipients.append(survey.enquiry.assigned_user.email)

    assigned_name = (
        "Team"
        if superadmin_email in recipients
        else (
            f"{survey.enquiry.assigned_user.name} ({survey.enquiry.assigned_user.role.name})"
            if survey.enquiry and survey.enquiry.assigned_user
            and survey.enquiry.assigned_user.name
            and survey.enquiry.assigned_user.role
            else "Team"
        )
    )

    subject = f"Survey Submitted: {survey.enquiry.fullName if survey.enquiry else 'Unknown Customer'}"
    message = f"""
Dear {assigned_name},
The survey for {survey.enquiry.fullName if survey.enquiry else 'Unknown Customer'} has been submitted.

Survey Details:
- Name: {survey.enquiry.fullName if survey.enquiry else 'Unknown Customer'}
- Service Type: {service_type_display}
- Email: {survey.enquiry.email if survey.enquiry else 'N/A'}
- Phone: {survey.enquiry.phoneNumber if survey.enquiry else 'N/A'}
- Survey Date: {survey.enquiry.survey_date.strftime('%Y-%m-%d %H:%M') if survey.enquiry and survey.enquiry.survey_date else 'N/A'}
- Customer Type: {survey.customer_type or 'N/A'}
- Goods Type: {survey.goods_type or 'N/A'}
- Status: {survey.status or 'N/A'}
- Work Description: {survey.work_description or 'N/A'}

Please contact the customer at {settings.CONTACT_EMAIL} for any queries.

Best regards,
Almas Movers International
Email: {settings.CONTACT_EMAIL}
Website: www.almasintl.com
"""

    html_content = f"""
<html>
    <body>
        <h2>Survey Submission Notification</h2>
        <p>Dear {assigned_name},</p>
        <p>The survey for {survey.enquiry.fullName if survey.enquiry else 'Unknown Customer'} has been submitted.</p>
        <h3>Survey Details:</h3>
        <p><strong>Name:</strong> {survey.enquiry.fullName if survey.enquiry else 'Unknown Customer'}</p>
        <p><strong>Service Type:</strong> {service_type_display}</p>
        <p><strong>Email:</strong> {survey.enquiry.email if survey.enquiry else 'N/A'}</p>
        <p><strong>Phone:</strong> {survey.enquiry.phoneNumber if survey.enquiry else 'N/A'}</p>
        <p><strong>Survey Date:</strong> {survey.enquiry.survey_date.strftime('%Y-%m-%d %H:%M') if survey.enquiry and survey.enquiry.survey_date else 'N/A'}</p>
        <p><strong>Customer Type:</strong> {survey.customer_type or 'N/A'}</p>
        <p><strong>Goods Type:</strong> {survey.goods_type or 'N/A'}</p>
        <p><strong>Status:</strong> {survey.status or 'N/A'}</p>
        <p><strong>Work Description:</strong> {survey.work_description or 'N/A'}</p>
        <p>Please contact the customer at <a href="mailto:{settings.CONTACT_EMAIL}">{settings.CONTACT_EMAIL}</a> for any queries.</p>
        <p>Best regards,<br>Almas Movers International<br>Email: <a href="mailto:{settings.CONTACT_EMAIL}">{settings.CONTACT_EMAIL}</a><br>Website: <a href="https://www.almasintl.com">www.almasintl.com</a></p>
    </body>
</html>
"""

    try:
        email = EmailMultiAlternatives(
            subject=subject,
            body=message,
            from_email=from_email,
            to=recipients,
            reply_to=[survey.enquiry.email] if survey.enquiry and survey.enquiry.email else [],
        )
        email.attach_alternative(html_content, "text/html")
        email.send(fail_silently=False)
        logger.info(f"Survey submission email sent to {', '.join(recipient for recipient in recipients)}")
    except Exception as e:
        logger.error(f"Failed to send survey submission email: {str(e)}", exc_info=True)


@method_decorator(csrf_exempt, name='dispatch')
class SurveyViewSet(viewsets.ModelViewSet):
    queryset = Survey.objects.all()
    serializer_class = SurveySerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication] 
    lookup_field = "survey_id"

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        survey_id = self.request.query_params.get('enquiry_id')
        if survey_id:
            queryset = queryset.filter(survey_id=survey_id)
        return queryset.select_related('enquiry').prefetch_related(
            'destination_addresses', 'articles', 'vehicles', 'pets'
        )

    def get_object(self):
        survey_id = self.kwargs.get(self.lookup_field)
        try:
            return Survey.objects.get(survey_id=survey_id)
        except Survey.DoesNotExist:
            logger.error(f"Survey with survey_id {survey_id} not found")
            raise Http404("Survey not found")

    def perform_create(self, serializer):
        survey = serializer.save()
        send_survey_submission_email(survey)

    def perform_update(self, serializer):
        survey = serializer.save()
        send_survey_submission_email(survey)

class DestinationAddressViewSet(viewsets.ModelViewSet):
    queryset = DestinationAddress.objects.all()
    serializer_class = DestinationAddressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        survey_id = self.request.query_params.get('survey_id')
        if survey_id:
            queryset = queryset.filter(survey_id=survey_id)
        return queryset

class ArticleViewSet(viewsets.ModelViewSet):
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        survey_id = self.request.query_params.get('survey_id')
        room_id = self.request.query_params.get('room_id')
        if survey_id:
            queryset = queryset.filter(survey_id=survey_id)
        if room_id:
            queryset = queryset.filter(room_id=room_id)
        return queryset.select_related('room', 'volume_unit', 'weight_unit', 'handyman', 'packing_option', 'currency')

    @action(detail=False, methods=['get'], url_path='items-by-room')
    def items_by_room(self, request):
        """Fetch available items for a given room."""
        room_id = request.query_params.get('room_id')
        if not room_id:
            return Response({'error': 'Room ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            items = Item.objects.filter(room_id=room_id).values('id', 'name', 'description')
            items_list = [
                {'value': item['name'], 'label': item['name'], 'description': item['description'] or ''}
                for item in items
            ]
            return Response({'items': items_list}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Failed to fetch items for room {room_id}: {str(e)}")
            return Response({'error': f'Failed to fetch items for room: {room_id}'}, status=status.HTTP_400_BAD_REQUEST)

class VehicleViewSet(viewsets.ModelViewSet):
    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        survey_id = self.request.query_params.get('survey_id')
        if survey_id:
            queryset = queryset.filter(survey_id=survey_id)
        return queryset.select_related('vehicle_type')

class PetViewSet(viewsets.ModelViewSet):
    queryset = Pet.objects.all()
    serializer_class = PetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        survey_id = self.request.query_params.get('survey_id')
        if survey_id:
            queryset = queryset.filter(survey_id=survey_id)
        return queryset