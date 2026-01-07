from rest_framework import serializers
from .models import (
    CustomerType,
    ServiceType,
    VolumeUnit,
    WeightUnit,
    PackingType,
    Manpower,
    Handyman,
    VehicleType,
    PetType,
    Room,
    Item,
    Currency,
    Tax,
    Hub,
    MoveType,
    TariffType,
    SurveyAdditionalService,
    Labour,
    Truck,
    Material,
    MaterialPurchase,
    InventoryLog,
)


class CustomerTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerType
        fields = ["id", "name", "description"]


class ServiceTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceType
        fields = ["id", "name", "description"]


class VolumeUnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = VolumeUnit
        fields = ["id", "name", "description"]


class WeightUnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = WeightUnit
        fields = ["id", "name", "description"]


class PackingTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PackingType
        fields = ["id", "name", "description"]


class ManpowerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Manpower
        fields = ["id", "name", "category", "employer", "phone_number", "is_active"]


class HandymanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Handyman
        fields = ["id", "type_name", "description"]


class VehicleTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = VehicleType
        fields = ["id", "name", "description"]


class PetTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PetType
        fields = ["id", "name", "description"]


class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ["id", "name", "description"]


class ItemSerializer(serializers.ModelSerializer):
    room = serializers.PrimaryKeyRelatedField(queryset=Room.objects.all())
    room_name = serializers.CharField(source="room.name", read_only=True)

    class Meta:
        model = Item
        fields = [
            "id", "name", "room", "room_name", "description",
            "length", "width", "height", "volume", "weight"
        ]
        extra_kwargs = {
            'volume': {'required': False},
            'weight': {'required': False},
        }


class CurrencySerializer(serializers.ModelSerializer):
    class Meta:
        model = Currency
        fields = ["id", "name", "description"]


class TaxSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tax
        fields = ["id", "tax_name", "description"]


class HubSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hub
        fields = ["id", "name", "description", "is_active", "created_at", "updated_at"]


class MoveTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = MoveType
        fields = ["id", "name", "description"]


class TariffTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TariffType
        fields = ["id", "name", "description"]


class SurveyAdditionalServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = SurveyAdditionalService
        fields = ["id", "name"]

class LabourSerializer(serializers.ModelSerializer):
    class Meta:
        model = Labour
        fields = ["id", "name", "description"]

class TruckSerializer(serializers.ModelSerializer):
    class Meta:
        model = Truck
        fields = ["id", "name", "description"]

class MaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Material
        fields = ["id", "name", "description", "stock_in_hand", "unit", "purchase_price"]

class MaterialPurchaseSerializer(serializers.ModelSerializer):
    material_name = serializers.CharField(source="material.name", read_only=True)
    class Meta:
        model = MaterialPurchase
        fields = ["id", "material", "material_name", "quantity", "unit_price", "total_price", "purchase_date", "supplier", "notes"]
        read_only_fields = ["total_price", "purchase_date"]

class InventoryLogSerializer(serializers.ModelSerializer):
    material_name = serializers.CharField(source="material.name", read_only=True)
    class Meta:
        model = InventoryLog
        fields = ["id", "material", "material_name", "transaction_type", "quantity", "date", "reference_id", "notes"]

