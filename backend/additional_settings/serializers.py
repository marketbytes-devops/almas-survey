from rest_framework import serializers
from .models import CustomerType, ServiceType, VolumeUnit, WeightUnit, PackingType, Manpower, Handyman, VehicleType, PetType, Room, Item, Currency, Tax

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