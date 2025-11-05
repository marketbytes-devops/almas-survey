from rest_framework import serializers
from .models import CustomerType, ServiceType, VolumeUnit, WeightUnit, PackingType, Manpower, Handyman, VehicleType, PetType, Room, Item, Currency, Tax, Hub, Type, Tariff, TariffRange, Team

class CustomerTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerType
        fields = ['id', 'name', 'description']

class ServiceTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceType
        fields = ['id', 'name', 'description']

class VolumeUnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = VolumeUnit
        fields = ['id', 'name', 'description']

class WeightUnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = WeightUnit
        fields = ['id', 'name', 'description']

class PackingTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PackingType
        fields = ['id', 'name', 'description']

class ManpowerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Manpower
        fields = ['id', 'name', 'description']

class HandymanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Handyman
        fields = ['id', 'type_name', 'description']

class VehicleTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = VehicleType
        fields = ['id', 'name', 'description']

class PetTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PetType
        fields = ['id', 'name', 'description']

class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ['id', 'name', 'description']

class ItemSerializer(serializers.ModelSerializer):
    room = serializers.PrimaryKeyRelatedField(queryset=Room.objects.all())
    room_name = serializers.CharField(source='room.name', read_only=True)

    class Meta:
        model = Item
        fields = ['id', 'name', 'room', 'room_name', 'description']

class CurrencySerializer(serializers.ModelSerializer):
    class Meta:
        model = Currency
        fields = ['id', 'name', 'description'] 

class TaxSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tax
        fields = ['id', 'tax_name', 'description']

# NEW SERIALIZERS FOR ADDITIONAL SETTINGS

class HubSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hub
        fields = ['id', 'name', 'code', 'description', 'is_active', 'created_at', 'updated_at']

class TypeSerializer(serializers.ModelSerializer):
    hub_name = serializers.CharField(source='hub.name', read_only=True)
    
    class Meta:
        model = Type
        fields = ['id', 'name', 'category', 'hub', 'hub_name', 'description', 'is_active', 'created_at', 'updated_at']

class TariffRangeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TariffRange
        fields = ['id', 'range_number', 'min_value', 'max_value', 'rate', 'flat_rate', 'adjustment_rate', 'created_at']

class TariffSerializer(serializers.ModelSerializer):
    hub_name = serializers.CharField(source='hub.name', read_only=True)
    type_name = serializers.CharField(source='type.name', read_only=True)
    currency_name = serializers.CharField(source='currency.name', read_only=True)
    ranges = TariffRangeSerializer(many=True, read_only=True)
    
    class Meta:
        model = Tariff
        fields = [
            'id', 'name', 'hub', 'hub_name', 'type', 'type_name', 'tariff_type', 
            'rate_type', 'base_rate', 'currency', 'currency_name', 'unit', 
            'description', 'is_active', 'valid_from', 'valid_to', 'ranges',
            'created_at', 'updated_at'
        ]

class TeamSerializer(serializers.ModelSerializer):
    hub_name = serializers.CharField(source='hub.name', read_only=True)
    
    class Meta:
        model = Team
        fields = ['id', 'name', 'email', 'hub', 'hub_name', 'role', 'phone', 'is_active', 'created_at', 'updated_at']