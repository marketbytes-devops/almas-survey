from rest_framework import viewsets, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import Job, StatusUpdate
from .serializers import JobSerializer, StatusUpdateSerializer
from django.core.mail import send_mail
from django.conf import settings

class JobViewSet(viewsets.ModelViewSet):
    queryset = Job.objects.all()
    serializer_class = JobSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = super().get_queryset()
        tracking_id = self.request.query_params.get('tracking_id', None)
        if tracking_id:
            queryset = queryset.filter(tracking_id=tracking_id)
        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        job = Job.objects.get(id=serializer.data['id'])
        customer = job.customer
        tracking_id = job.tracking_id
        tracking_link = job.get_tracking_link()

        subject = 'Shipment Confirmed with Almas Movers International : Track Your Cargo with Ease'
        message = (
            f"Dear {customer.name},\n\n"
            f"Thank you for choosing Almas Movers International for your moving and logistics needs.\n"
            f"We are pleased to inform you that your cargo has been successfully booked and is now on its way.\n\n"
            f"To help you stay updated every step of the journey, we’ve assigned a unique tracking ID to your shipment.\n"
            f"📦 Tracking ID: {tracking_id}\n\n"
            f"You can view the real-time status of your cargo by clicking the link below:\n"
            f"👉 {tracking_link}\n\n"
            f"If you have any questions or require assistance, feel free to reach out to us anytime through one of the following contact points:\n\n"
            f"📧 Email Contacts\n"
            f"movers@almasintl.com\n"
            f"freight@almasintl.com\n"
            f"sales@almasintl.com\n"
            f"info@almasintl.com\n\n"
            f"📞 Phone Numbers\n"
            f"+974 44355663\n"
            f"+974 40172179\n"
            f"+974 66404688\n"
            f"+974 50136999\n"
            f"+974 50826999\n"
            f"+974 50276999\n\n"
            f"Thank you once again for trusting Almas Movers International. We’re committed to delivering your cargo safely, securely, and on time.\n\n"
            f"Warm regards,\n"
            f"Customer Support Team\n"
            f"Almas Movers International\n"
            f"www.almasintl.com"
        )
        recipient_email = customer.email

        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [recipient_email],
                fail_silently=False,
            )
        except Exception as e:
            print(f"Failed to send email: {e}")

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

class StatusUpdateViewSet(viewsets.ModelViewSet):
    queryset = StatusUpdate.objects.all()
    serializer_class = StatusUpdateSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = super().get_queryset()
        job_id = self.request.query_params.get('job_id', None)
        if job_id is not None:
            queryset = queryset.filter(job_id=job_id)
        return queryset