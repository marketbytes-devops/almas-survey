from rest_framework import serializers
from .models import Booking, BookingLabour, BookingTruck, BookingMaterial
from quotation.serializers import QuotationSerializer
from pricing.serializers import TruckTypeSerializer
from additional_settings.serializers import MaterialSerializer, ManpowerSerializer

class BookingLabourSerializer(serializers.ModelSerializer):
    staff_member_name = serializers.CharField(source='staff_member.name', read_only=True, allow_null=True)
    staff_member_phone = serializers.CharField(source='staff_member.phone_number', read_only=True, allow_null=True)
    
    class Meta:
        model = BookingLabour
        fields = ['id', 'booking', 'staff_member', 'staff_member_name', 'staff_member_phone', 'quantity']

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
    
    client_name = serializers.CharField(source='quotation.survey.full_name', read_only=True)
    move_type = serializers.CharField(source='quotation.survey.service_type', read_only=True)
    contact_number = serializers.CharField(source='quotation.survey.phone_number', read_only=True)
    origin_location = serializers.CharField(source='quotation.survey.origin_city', read_only=True)
    destination_location = serializers.SerializerMethodField()
    
    supervisor_name = serializers.CharField(source='supervisor.name', read_only=True)
    supervisor_phone = serializers.CharField(source='supervisor.phone_number', read_only=True)

    survey_id = serializers.IntegerField(source='quotation.survey.id', read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id', 'quotation', 'booking_id', 'survey_id', 'move_date', 'start_time', 
            'estimated_end_time', 'supervisor', 'supervisor_name', 'supervisor_phone',
            'notes', 'status',
            'labours', 'trucks', 'materials',
            'client_name', 'move_type', 'contact_number', 'origin_location', 'destination_location',
            'created_at', 'updated_at',
        ]

    def get_destination_location(self, obj):
        dest = obj.quotation.survey.destination_addresses.first()
        return dest.city if dest else None