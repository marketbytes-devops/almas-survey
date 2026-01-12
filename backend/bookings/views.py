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
        """Share booking PDF to supervisor via WhatsApp"""
        try:
            booking = self.get_object()
            
            print(f"DEBUG: Booking ID: {booking.id}")
            
            # Check if supervisor exists
            if not booking.supervisor:
                return Response(
                    {"error": "No supervisor assigned to this booking."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            
            # Get supervisor phone
            supervisor_phone = booking.supervisor.phone_number
            
            if not supervisor_phone or supervisor_phone.strip() == '':
                return Response(
                    {"error": f"Supervisor '{booking.supervisor.name}' does not have a phone number."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            
            # Clean phone number
            clean_phone = ''.join(filter(str.isdigit, supervisor_phone))
            if len(clean_phone) == 10:
                clean_phone = '91' + clean_phone
            
            # GENERATE PDF
            try:
                filepath, filename = generate_booking_pdf(booking)
                print(f"DEBUG: PDF generated at: {filepath}")
                
                # Build PDF URL
                pdf_url = request.build_absolute_uri(
                    f"{settings.MEDIA_URL}booking_pdfs/{filename}"
                )
                print(f"DEBUG: PDF URL: {pdf_url}")
                
            except Exception as pdf_error:
                print(f"PDF Generation Error: {str(pdf_error)}")
                print(traceback.format_exc())
                return Response(
                    {"error": f"Failed to generate PDF: {str(pdf_error)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

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
                
                if hasattr(survey, 'destination_addresses'):
                    dest_qs = survey.destination_addresses.first()
                    if dest_qs and hasattr(dest_qs, 'city'):
                        destination = dest_qs.city or 'N/A'
            
            # Build WhatsApp message with PDF link
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
📄Download Complete PDF:
{pdf_url}

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
            print(traceback.format_exc())
            
            return Response(
                {"error": f"Unexpected error: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


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