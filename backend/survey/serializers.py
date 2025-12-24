from rest_framework import serializers
from .models import Survey, DestinationAddress, Article, Vehicle, Pet
from additional_settings.models import (
    CustomerType, Room, VolumeUnit, WeightUnit, 
    PackingType, Handyman, Currency, VehicleType, PetType, Item, SurveyAdditionalService
)
from contact.models import Enquiry
from django.db import transaction

STATUS_CHOICES = (
    ('pending', 'Pending'),
    ('in_progress', 'In Progress'),
    ('completed', 'Completed'),
    ('cancelled', 'Cancelled'),
)

STORAGE_FREQUENCY_CHOICES = (
    ('short_term', 'Short Term'),
    ('long_term', 'Long Term'),
)

STORAGE_MODE_CHOICES = (
    ('ac', 'AC'),
    ('non_ac', 'Non-AC'),
    ('self_storage', 'Self Storage'),
)

TRANSPORT_MODE_CHOICES = (
    ('road', 'Road'),
    ('air', 'Air'),
    ('sea', 'Sea'),
    ('rail', 'Rail'),
)

SERVICE_TYPE_DISPLAY = {
    "localMove": "Local Move",
    "internationalMove": "International Move",
    "carExport": "Car Import and Export",
    "storageServices": "Storage Services",
    "logistics": "Logistics",
}

class DestinationAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = DestinationAddress
        fields = ['id', 'address', 'city', 'country', 'state', 'zip', 'poe']
        read_only_fields = ['id']

class ArticleSerializer(serializers.ModelSerializer):
    room = serializers.PrimaryKeyRelatedField(queryset=Room.objects.all(), allow_null=True)
    room_name = serializers.CharField(source='room.name', read_only=True, allow_null=True)
    volume_unit = serializers.PrimaryKeyRelatedField(queryset=VolumeUnit.objects.all(), allow_null=True)
    volume_unit_name = serializers.CharField(source='volume_unit.name', read_only=True, allow_null=True)
    weight_unit = serializers.PrimaryKeyRelatedField(queryset=WeightUnit.objects.all(), allow_null=True)
    weight_unit_name = serializers.CharField(source='weight_unit.name', read_only=True, allow_null=True)
    handyman = serializers.PrimaryKeyRelatedField(queryset=Handyman.objects.all(), allow_null=True)
    handyman_name = serializers.CharField(source='handyman.type_name', read_only=True, allow_null=True)
    packing_option = serializers.PrimaryKeyRelatedField(queryset=PackingType.objects.all(), allow_null=True)
    packing_option_name = serializers.CharField(source='packing_option.name', read_only=True, allow_null=True)
    is_flagged_display = serializers.SerializerMethodField()
    move_status_display = serializers.SerializerMethodField()
    crate_required_display = serializers.SerializerMethodField()  # Add this
    
    class Meta:
        model = Article
        fields = [
            'id', 'room', 'room_name', 'item_name', 'quantity',
            'volume', 'volume_unit', 'volume_unit_name',
            'weight', 'weight_unit', 'weight_unit_name',
            'handyman', 'handyman_name', 'packing_option', 'packing_option_name',
            'move_status', 'move_status_display', 'remarks', 'length', 'width', 'height', 
            'calculated_volume', 'created_at', 'is_flagged', 'is_flagged_display',
            'crate_required', 'crate_required_display'  # Add crate_required here
        ]
        read_only_fields = ['id', 'created_at', 'calculated_volume']
    
    def get_move_status_display(self, obj):
        """Get human-readable moving status"""
        if obj.move_status == 'not_moving':
            return 'Not Moving'
        return 'Moving'
    
    def get_is_flagged_display(self, obj):
        """Get human-readable flagged status"""
        return 'Flagged' if obj.is_flagged else 'Not Flagged'
    
    def get_crate_required_display(self, obj):  # Add this method
        """Get human-readable crate required status"""
        return 'Yes' if obj.crate_required else 'No'

class VehicleSerializer(serializers.ModelSerializer):
    vehicle_type = serializers.PrimaryKeyRelatedField(queryset=VehicleType.objects.all(), allow_null=True)
    vehicle_type_name = serializers.CharField(source='vehicle_type.name', read_only=True, allow_null=True)

    class Meta:
        model = Vehicle
        fields = ['id', 'vehicle_type', 'vehicle_type_name', 'make', 'model', 'insurance', 'remark', 'created_at']
        read_only_fields = ['id', 'created_at']

class PetSerializer(serializers.ModelSerializer):
    pet_type = serializers.PrimaryKeyRelatedField(queryset=PetType.objects.all(), allow_null=True)
    pet_type_name = serializers.CharField(source='pet_type.name', read_only=True, allow_null=True)

    class Meta:
        model = Pet
        fields = [
            'id', 'pet_name', 'pet_type', 'pet_type_name', 'breed', 'age', 'weight',
            'special_care', 'transport_requirements', 'feeding_instructions',
            'medication', 'vaccination_status', 'behavior_notes', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
        
class SurveyAdditionalServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = SurveyAdditionalService
        fields = ['id', 'name']
        
class SurveySerializer(serializers.ModelSerializer):
    destination_addresses = DestinationAddressSerializer(many=True, required=False)
    articles = ArticleSerializer(many=True, required=False)
    vehicles = VehicleSerializer(many=True, required=False)

    customer_type = serializers.PrimaryKeyRelatedField(queryset=CustomerType.objects.all(), allow_null=True, required=False)
    customer_type_name = serializers.CharField(source='customer_type.name', read_only=True, allow_null=True)

    service_type_display = serializers.SerializerMethodField()
    signature_url = serializers.SerializerMethodField()
    signature_uploaded = serializers.SerializerMethodField()
    
    additional_services = SurveyAdditionalServiceSerializer(many=True, read_only=True)
    additional_service_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Survey
        fields = [
            'id', 'enquiry', 'customer_type', 'customer_type_name', 'is_military', 'salutation',
            'full_name', 'phone_number', 'email', 'address', 'company', 'survey_id',
            'service_type', 'service_type_display', 'goods_type', 'status', 'survey_date',
            'survey_start_time', 'survey_end_time', 'work_description',
            'same_as_customer_address', 'origin_address', 'origin_city', 'origin_country',
            'origin_state', 'origin_zip', 'pod_pol', 'multiple_addresses', 'destination_addresses',
            'packing_date_from', 'packing_date_to', 'loading_date', 'eta', 'etd', 'est_delivery_date',
            'storage_start_date', 'storage_frequency', 'storage_duration', 'storage_mode', 'transport_mode',
            'general_owner_packed', 'general_owner_packed_notes', 'general_restriction', 'general_restriction_notes',
            'general_handyman', 'general_handyman_notes', 'general_insurance', 'general_insurance_notes',
            'origin_floor', 'origin_floor_notes', 'origin_lift', 'origin_lift_notes',
            'origin_parking', 'origin_parking_notes', 'origin_storage', 'origin_storage_notes',
            'destination_floor', 'destination_floor_notes', 'destination_lift', 'destination_lift_notes',
            'destination_parking', 'destination_parking_notes',
            'articles', 'vehicles', 'created_at', 'updated_at', 'signature', 'signature_url', 'signature_uploaded',
            'additional_services', 'additional_service_ids'  
        ]
        read_only_fields = ['id', 'survey_id', 'created_at', 'updated_at', 'service_type_display', 'signature_url', 'signature_uploaded', 'additional_services']

    def get_service_type_display(self, obj):
        if obj.service_type:
            return SERVICE_TYPE_DISPLAY.get(obj.service_type, obj.service_type)
        if obj.enquiry and obj.enquiry.serviceType:
            return SERVICE_TYPE_DISPLAY.get(obj.enquiry.serviceType, obj.enquiry.serviceType)
        return "N/A"

    def get_signature_url(self, obj):
        if obj.signature and hasattr(obj.signature, 'url'):
            request = self.context.get('request')
            return request.build_absolute_uri(obj.signature.url) if request else obj.signature.url
        return None

    def get_signature_uploaded(self, obj):
        return bool(obj.signature)

    def create(self, validated_data):
        additional_service_ids = validated_data.pop('additional_service_ids', [])
        destination_addresses_data = validated_data.pop("destination_addresses", [])
        articles_data = validated_data.pop("articles", [])
        vehicles_data = validated_data.pop("vehicles", [])

        with transaction.atomic():
            survey = Survey.objects.create(**validated_data)
            
            if additional_service_ids:
                survey.additional_services.set(additional_service_ids)
                
            for addr in destination_addresses_data:
                DestinationAddress.objects.create(survey=survey, **addr)
            
            for article in articles_data:
                # Ensure crate_required is included with default False if not provided
                article_data = article.copy()
                if 'crate_required' not in article_data:
                    article_data['crate_required'] = False
                Article.objects.create(survey=survey, **article_data)
            
            for vehicle in vehicles_data:
                Vehicle.objects.create(survey=survey, **vehicle)

        return survey

    def update(self, instance, validated_data):
        additional_service_ids = validated_data.pop('additional_service_ids', [])
        destination_addresses_data = validated_data.pop("destination_addresses", None)
        articles_data = validated_data.pop("articles", None)
        vehicles_data = validated_data.pop("vehicles", None)

        with transaction.atomic():
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()
            
            if additional_service_ids is not None:
                instance.additional_services.set(additional_service_ids)

            if destination_addresses_data is not None:
                instance.destination_addresses.all().delete()
                for addr in destination_addresses_data:
                    DestinationAddress.objects.create(survey=instance, **addr)

            if articles_data is not None:
                instance.articles.all().delete()
                for article in articles_data:
                    # Ensure crate_required is included with default False if not provided
                    article_data = article.copy()
                    if 'crate_required' not in article_data:
                        article_data['crate_required'] = False
                    Article.objects.create(survey=instance, **article_data)

            if vehicles_data is not None:
                instance.vehicles.all().delete()
                for vehicle in vehicles_data:
                    Vehicle.objects.create(survey=instance, **vehicle)

        return instance