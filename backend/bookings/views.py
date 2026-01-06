from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Booking, BookingLabour, BookingTruck, BookingMaterial
from .serializers import (
    BookingSerializer, 
    BookingLabourSerializer, 
    BookingTruckSerializer, 
    BookingMaterialSerializer
)

class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.all().order_by('-created_at')
    serializer_class = BookingSerializer
    permission_classes = [permissions.AllowAny]

    @action(detail=False, methods=['get'], url_path='by-quotation/(?P<quotation_id>[^/.]+)')
    def by_quotation(self, request, quotation_id=None):
        try:
            booking = Booking.objects.get(quotation__quotation_id=quotation_id)
            serializer = self.get_serializer(booking)
            return Response(serializer.data)
        except Booking.DoesNotExist:
            return Response(None, status=status.HTTP_200_OK)

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
