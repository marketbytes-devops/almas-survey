from rest_framework import serializers
from .models import Survey, DestinationAddress, Article, Vehicle, Pet, SurveyAdditionalServiceSelection
from additional_settings.models import (
    CustomerType, Room, VolumeUnit, WeightUnit, 
    PackingType, Handyman, Currency, VehicleType, PetType, Item, SurveyAdditionalService
)
from contact.models import Enquiry
from django.db import transaction
import base64
import uuid
from django.core.files.base import ContentFile

class Base64ImageField(serializers.ImageField):
    def to_internal_value(self, data):
        if isinstance(data, str) and data.startswith('data:image'):
            format, imgstr = data.split(';base64,') 
            ext = format.split('/')[-1] 
            id = uuid.uuid4()
            data = ContentFile(base64.b64decode(imgstr), name=id.hex + "." + ext)
        return super().to_internal_value(data)

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
    crate_required_display = serializers.SerializerMethodField()
    photo = Base64ImageField(max_length=None, use_url=True, required=False, allow_null=True)
    length = serializers.DecimalField(max_digits=20, decimal_places=10, required=False, allow_null=True)
    width = serializers.DecimalField(max_digits=20, decimal_places=10, required=False, allow_null=True)
    height = serializers.DecimalField(max_digits=20, decimal_places=10, required=False, allow_null=True)
    created_at = serializers.DateTimeField(read_only=True)
    
    id = serializers.IntegerField(required=False)
    
    class Meta:
        model = Article
        fields = [
            'id', 'room', 'room_name', 'item_name', 'quantity',
            'volume', 'volume_unit', 'volume_unit_name',
            'weight', 'weight_unit', 'weight_unit_name',
            'handyman', 'handyman_name', 'packing_option', 'packing_option_name',
            'move_status', 'move_status_display', 'remarks', 'length', 'width', 'height', 
            'calculated_volume', 'created_at', 'is_flagged', 'is_flagged_display',
            'crate_required', 'crate_required_display', 'photo'
        ]
        read_only_fields = ['created_at', 'calculated_volume']

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if instance.photo and hasattr(instance.photo, 'url'):
            request = self.context.get('request')
            if request:
                ret['photo'] = request.build_absolute_uri(instance.photo.url)
            else:
                # Fallback if no request in context (e.g. background task)
                ret['photo'] = instance.photo.url
        return ret

    def get_move_status_display(self, obj):
        """Get human-readable moving status"""
        if obj.move_status == 'not_moving':
            return 'Not Moving'
        return 'Moving'
    
    def get_is_flagged_display(self, obj):
        """Get human-readable flagged status"""
        return 'Flagged' if obj.is_flagged else 'Not Flagged'
    
    def get_crate_required_display(self, obj): 
        """Get human-readable crate required status"""
        return 'Yes' if obj.crate_required else 'No'

class VehicleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = ['id', 'vehicle_type', 'make', 'model', 'insurance', 'remark', 'created_at']
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
        
class SurveyAdditionalServiceSelectionSerializer(serializers.ModelSerializer):
    service_id = serializers.PrimaryKeyRelatedField(
        queryset=SurveyAdditionalService.objects.all(),
        source='service'
    )
    name = serializers.CharField(source='service.name', read_only=True)

    class Meta:
        model = SurveyAdditionalServiceSelection
        fields = ['service_id', 'name', 'quantity', 'remarks']
        
class SurveySerializer(serializers.ModelSerializer):
    destination_addresses = DestinationAddressSerializer(many=True, required=False)
    articles = ArticleSerializer(many=True, required=False)
    vehicles = VehicleSerializer(many=True, required=False)

    customer_type = serializers.PrimaryKeyRelatedField(queryset=CustomerType.objects.all(), allow_null=True, required=False)
    customer_type_name = serializers.CharField(source='customer_type.name', read_only=True, allow_null=True)

    service_type_display = serializers.SerializerMethodField()
    signature_url = serializers.SerializerMethodField()
    signature_uploaded = serializers.SerializerMethodField()
    has_quotation = serializers.SerializerMethodField()
    quotation_id = serializers.SerializerMethodField()
    quotation_created_at = serializers.SerializerMethodField()
    quotation_signature_uploaded = serializers.SerializerMethodField()
    
    additional_services = SurveyAdditionalServiceSelectionSerializer(many=True, source='additional_service_selections', required=False)
    
    class Meta:
        model = Survey
        fields = [
            'id', 'enquiry', 'customer_type', 'customer_type_name', 'is_military', 'salutation',
            'full_name', 'phone_number', 'email', 'address', 'company', 'survey_id',
            'service_type', 'service_type_display', 'goods_type', 'status', 'survey_date',
            'survey_start_time', 'survey_end_time', 'work_description',
            'same_as_customer_address', 'origin_address', 'origin_city', 'origin_country',
            'origin_state', 'origin_zip', 'origin_gps', 'pod_pol', 'multiple_addresses', 'destination_addresses',
            'packing_date_from', 'packing_date_to', 'loading_date', 'eta', 'etd', 'est_delivery_date',
            'storage_start_date', 'storage_frequency', 'storage_duration', 'storage_mode', 'transport_mode',
            'general_owner_packed', 'general_owner_packed_notes', 'general_restriction', 'general_restriction_notes',
            'general_handyman', 'general_handyman_notes', 'general_insurance', 'general_insurance_notes',
            'origin_floor', 'origin_floor_notes', 'origin_lift', 'origin_lift_notes',
            'origin_parking', 'origin_parking_notes', 'origin_storage', 'origin_storage_notes',
            'destination_floor', 'destination_floor_notes', 'destination_lift', 'destination_lift_notes',
            'destination_parking', 'destination_parking_notes',
            'articles', 'vehicles', 'created_at', 'updated_at', 'signature', 'signature_url', 'signature_uploaded',
            'additional_services', 'has_quotation', 'quotation_id', 'quotation_created_at', 'quotation_signature_uploaded'
        ]
        read_only_fields = ['id', 'survey_id', 'created_at', 'updated_at', 'service_type_display', 'signature_url', 'signature_uploaded', 'has_quotation', 'quotation_id', 'quotation_created_at', 'quotation_signature_uploaded']

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

    def get_has_quotation(self, obj):
        from quotation.models import Quotation
        return Quotation.objects.filter(survey=obj).exists()

    def get_quotation_id(self, obj):
        from quotation.models import Quotation
        quot = Quotation.objects.filter(survey=obj).first()
        return quot.quotation_id if quot else None

    def get_quotation_created_at(self, obj):
        from quotation.models import Quotation
        quot = Quotation.objects.filter(survey=obj).first()
        return quot.created_at if quot else None

    def get_quotation_signature_uploaded(self, obj):
        from quotation.models import Quotation
        quot = Quotation.objects.filter(survey=obj).first()
        return quot.signature_uploaded if quot else False

    def create(self, validated_data):
        additional_services_data = validated_data.pop('additional_service_selections', [])
        destination_addresses_data = validated_data.pop("destination_addresses", [])
        articles_data = validated_data.pop("articles", [])
        vehicles_data = validated_data.pop("vehicles", [])

        with transaction.atomic():
            survey = Survey.objects.create(**validated_data)
            
            for service_data in additional_services_data:
                SurveyAdditionalServiceSelection.objects.create(
                    survey=survey,
                    service=service_data.get('service'),
                    quantity=service_data.get('quantity', 1),
                    remarks=service_data.get('remarks', "")
                )
                
            for addr in destination_addresses_data:
                DestinationAddress.objects.create(survey=survey, **addr)
            
            for article in articles_data:
                article_data = article.copy()
                if 'crate_required' not in article_data:
                    article_data['crate_required'] = False
                Article.objects.create(survey=survey, **article_data)
            
            for vehicle in vehicles_data:
                Vehicle.objects.create(survey=survey, **vehicle)

        return survey

    def update(self, instance, validated_data):
        additional_services_data = validated_data.pop('additional_service_selections', None)
        destination_addresses_data = validated_data.pop("destination_addresses", None)
        articles_data = validated_data.pop("articles", None)
        vehicles_data = validated_data.pop("vehicles", None)

        with transaction.atomic():
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()
            
            if additional_services_data is not None:
                instance.additional_service_selections.all().delete()
                for service_data in additional_services_data:
                    SurveyAdditionalServiceSelection.objects.create(
                        survey=instance,
                        service=service_data.get('service'),
                        quantity=service_data.get('quantity', 1),
                        remarks=service_data.get('remarks', "")
                    )

            if destination_addresses_data is not None:
                instance.destination_addresses.all().delete()
                for addr in destination_addresses_data:
                    DestinationAddress.objects.create(survey=instance, **addr)

            if articles_data is not None:
                incoming_ids = set()
                for article in articles_data:
                    article_id = article.get('id')
                    if article_id and Article.objects.filter(id=article_id, survey=instance).exists():
                        incoming_ids.add(article_id)
                        article_obj = Article.objects.get(id=article_id, survey=instance)
                        for attr, value in article.items():
                            setattr(article_obj, attr, value)
                        article_obj.save()
                    else:
                        if 'id' in article:
                            del article['id']
                        if 'crate_required' not in article:
                            article['crate_required'] = False
                        new_art = Article.objects.create(survey=instance, **article)
                        incoming_ids.add(new_art.id)
                
                instance.articles.exclude(id__in=incoming_ids).delete()

            if vehicles_data is not None:
                instance.vehicles.all().delete()
                for vehicle in vehicles_data:
                    Vehicle.objects.create(survey=instance, **vehicle)

        return instance