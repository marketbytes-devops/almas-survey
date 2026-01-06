from rest_framework import serializers
from .models import Booking, BookingLabour, BookingTruck, BookingMaterial
from quotation.serializers import QuotationSerializer
from additional_settings.serializers import LabourSerializer, TruckSerializer, MaterialSerializer, ManpowerSerializer

class BookingLabourSerializer(serializers.ModelSerializer):
    labour_type_name = serializers.CharField(source='labour_type.name', read_only=True)
    
    class Meta:
        model = BookingLabour
        fields = ['id', 'booking', 'labour_type', 'labour_type_name', 'quantity']

class BookingTruckSerializer(serializers.ModelSerializer):
    truck_type_name = serializers.CharField(source='truck_type.name', read_only=True)
    
    class Meta:
        model = BookingTruck
        fields = ['id', 'booking', 'truck_type', 'truck_type_name', 'quantity']

class BookingMaterialSerializer(serializers.ModelSerializer):
    material_name = serializers.CharField(source='material.name', read_only=True)
    
    class Meta:
        model = BookingMaterial
        fields = ['id', 'booking', 'material', 'material_name', 'quantity']

class BookingSerializer(serializers.ModelSerializer):
    labours = BookingLabourSerializer(many=True, read_only=True)
    trucks = BookingTruckSerializer(many=True, read_only=True)
    materials = BookingMaterialSerializer(many=True, read_only=True)
    
    # Pre-fetching some quotation/survey info for the list table
    client_name = serializers.CharField(source='quotation.survey.full_name', read_only=True)
    move_type = serializers.CharField(source='quotation.survey.service_type', read_only=True)
    contact_number = serializers.CharField(source='quotation.survey.phone_number', read_only=True)
    origin_location = serializers.CharField(source='quotation.survey.origin_city', read_only=True)
    destination_location = serializers.SerializerMethodField()
    supervisor_name = serializers.CharField(source='supervisor.name', read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id', 'quotation', 'booking_id', 'move_date', 'start_date', 
            'estimated_end_time', 'supervisor', 'supervisor_name', 'notes', 'status',
            'labours', 'trucks', 'materials',
            'client_name', 'move_type', 'contact_number', 'origin_location', 'destination_location',
            'created_at', 'updated_at'
        ]

    def get_destination_location(self, obj):
        # Taking the first destination address if exists
        dest = obj.quotation.survey.destination_addresses.first()
        return dest.city if dest else None
