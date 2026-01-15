from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Booking, BookingLabour, BookingTruck, BookingMaterial
from .serializers import (
    BookingSerializer,
    BookingLabourSerializer,
    BookingTruckSerializer,
    BookingMaterialSerializer,
)
from .pdf_generator import generate_booking_pdf  
from urllib.parse import quote
from django.conf import settings
import traceback


class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.all().order_by("-created_at")
    serializer_class = BookingSerializer
    permission_classes = [permissions.AllowAny]

    @action(detail=False, methods=["get"], url_path="by-quotation/(?P<quotation_id>[^/.]+)")
    def by_quotation(self, request, quotation_id=None):
        try:
            booking = Booking.objects.get(quotation__quotation_id=quotation_id)
            serializer = self.get_serializer(booking)
            return Response(serializer.data)
        except Booking.DoesNotExist:
            return Response(None, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="share-supervisor-whatsapp")
    def share_supervisor_whatsapp(self, request, pk=None):
        """Share booking PDF to supervisor via WhatsApp with GPS link"""
        try:
            booking = self.get_object()
            
            print(f"DEBUG: Booking ID: {booking.id}")
            
            # Check supervisor
            if not booking.supervisor:
                return Response({"error": "No supervisor assigned."}, status=400)
            
            supervisor_phone = booking.supervisor.phone_number
            if not supervisor_phone or supervisor_phone.strip() == '':
                return Response(
                    {"error": f"Supervisor '{booking.supervisor.name}' has no phone number."},
                    status=400
                )
            
            # Clean phone (India/Qatar support)
            clean_phone = ''.join(filter(str.isdigit, supervisor_phone))
            if clean_phone.startswith('0'):
                clean_phone = clean_phone[1:]
            if len(clean_phone) == 10:
                clean_phone = '91' + clean_phone
            elif len(clean_phone) == 8:
                clean_phone = '974' + clean_phone
            
            # Generate PDF
            try:
                filepath, filename = generate_booking_pdf(booking)
                pdf_url = request.build_absolute_uri(f"{settings.MEDIA_URL}booking_pdfs/{filename}")
            except Exception as pdf_error:
                print(f"PDF Generation Error: {str(pdf_error)}")
                return Response({"error": f"Failed to generate PDF: {str(pdf_error)}"}, status=500)

            # Client & Move Info
            client_name = "Customer"
            contact_number = "N/A"
            move_type = "N/A"
            origin = "N/A"
            destination = "N/A"
            
            if booking.quotation and hasattr(booking.quotation, 'survey') and booking.quotation.survey:
                survey = booking.quotation.survey
                client_name = getattr(survey, 'full_name', 'Customer') or 'Customer'
                contact_number = getattr(survey, 'phone_number', 'N/A') or 'N/A'
                move_type = getattr(survey, 'service_type', 'N/A') or 'N/A'
                origin = getattr(survey, 'origin_city', 'N/A') or 'N/A'
                
                if hasattr(survey, 'destination_addresses') and survey.destination_addresses.exists():
                    dest = survey.destination_addresses.first()
                    destination = getattr(dest, 'city', 'N/A') or 'N/A'

            # Get GPS link (if exists)
            gps_link_text = ""
            if booking.quotation and booking.quotation.survey and hasattr(booking.quotation.survey, 'origin_gps'):
                gps_link = booking.quotation.survey.origin_gps.strip()
                if gps_link:
                    gps_link_text = f"""
    ━━━━━━━━━━━━━━━━━━
    � Origin GPS Location:
    {gps_link}

    Click above link to view exact pickup location on Google Maps!
    """

            # Final WhatsApp message
            message = f"""Booking Confirmation - Almas Movers

    Booking ID: {booking.booking_id}
    Client: {client_name}
    Contact: {contact_number}

    Move Date: {booking.move_date if booking.move_date else 'TBA'}
    Start Time: {booking.start_time.strftime('%I:%M %p') if booking.start_time else 'TBA'}
    Est. End: {booking.estimated_end_time.strftime('%I:%M %p') if booking.estimated_end_time else 'TBA'}

    Move Type: {move_type}
    From: {origin}
    To: {destination}

    ━━━━━━━━━━━━━━━━━━
    📄 Download Complete PDF:
    {pdf_url}

    {gps_link_text}

    Please review all details before the move.

    Thank you for your service!
    - Almas Movers Management"""
            
            whatsapp_url = f"https://wa.me/{clean_phone}?text={quote(message)}"
            
            return Response({
                'success': True,
                'whatsapp_url': whatsapp_url,
                'pdf_url': pdf_url,
                'supervisor_name': booking.supervisor.name,
                'supervisor_phone': supervisor_phone,
            })
            
        except Exception as e:
            print(f"ERROR: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({"error": f"Unexpected error: {str(e)}"}, status=500)


class BookingLabourViewSet(viewsets.ModelViewSet):
    queryset = BookingLabour.objects.all()
    serializer_class = BookingLabourSerializer
    permission_classes = [permissions.AllowAny]


class BookingTruckViewSet(viewsets.ModelViewSet):
    queryset = BookingTruck.objects.all()
    serializer_class = BookingTruckSerializer
    permission_classes = [permissions.AllowAny]


class BookingMaterialViewSet(viewsets.ModelViewSet):
    queryset = BookingMaterial.objects.all()
    serializer_class = BookingMaterialSerializer
    permission_classes = [permissions.AllowAny]