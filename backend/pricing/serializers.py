from rest_framework import serializers
from .models import (
    Price,
    AdditionalService,
    QuotationAdditionalCharge,
    InclusionExclusion,
    InsurancePlan,
    PaymentTerm,
    QuoteNote,
    TruckType,
    Service,
)
from survey.models import SurveyAdditionalService


class PriceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Price
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at"]

    def validate(self, attrs):
        min_vol = attrs.get("min_volume")
        max_vol = attrs.get("max_volume")

        if min_vol and max_vol and min_vol >= max_vol:
            raise serializers.ValidationError(
                {"max_volume": "Max volume must be greater than min volume"}
            )

        return attrs


class AdditionalServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdditionalService
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at"]


class SurveyAdditionalServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = SurveyAdditionalService
        fields = ["id", "name"]


class QuotationAdditionalChargeSerializer(serializers.ModelSerializer):
    service = SurveyAdditionalServiceSerializer(read_only=True)
    service_id = serializers.PrimaryKeyRelatedField(
        queryset=SurveyAdditionalService.objects.all(),
        source="service",
        write_only=True,
        required=True,
    )
    currency_name = serializers.CharField(
        source="currency.name", read_only=True, default="QAR"
    )

    class Meta:
        model = QuotationAdditionalCharge
        fields = [
            "id",
            "service",
            "service_id",
            "currency",
            "currency_name",
            "price_per_unit",
            "per_unit_quantity",
            "rate_type",
        ]


class InclusionExclusionSerializer(serializers.ModelSerializer):
    class Meta:
        model = InclusionExclusion
        fields = ["id", "text", "type", "city", "country", "is_active", "created_at"]
        read_only_fields = ["created_at", "country"]

    def create(self, validated_data):
        validated_data.setdefault("country", "Qatar")
        return super().create(validated_data)


class InsurancePlanSerializer(serializers.ModelSerializer):
    calculation_type_display = serializers.CharField(
        source="get_calculation_type_display", read_only=True
    )

    class Meta:
        model = InsurancePlan
        fields = [
            "id",
            "name",
            "description",
            "calculation_type",
            "calculation_type_display",
            "rate",
            "minimum_premium",
            "maximum_coverage",
            "is_default",
            "is_mandatory",
            "is_active",
            "order",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class PaymentTermSerializer(serializers.ModelSerializer):
    advance_due_display = serializers.CharField(
        source="get_advance_due_on_display", read_only=True
    )
    balance_due_display = serializers.CharField(
        source="get_balance_due_on_display", read_only=True
    )

    class Meta:
        model = PaymentTerm
        fields = [
            "id",
            "name",
            "description",
            "advance_percentage",
            "advance_due_on",
            "advance_due_display",
            "balance_due_on",
            "balance_due_display",
            "is_default",
            "is_active",
            "order",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class QuoteNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuoteNote
        fields = [
            "id",
            "content",
            "is_active",
            "order",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class TruckTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TruckType
        fields = [
            "id",
            "name",
            "capacity_cbm",
            "capacity_kg",
            "price_per_trip",
            "is_default",
            "is_active",
            "order",
            "created_at",
            "updated_at",
        ]


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ["id", "name", "is_active", "created_at", "updated_at"]
        read_only_fields = ["created_at", "updated_at"]

    def validate_name(self, value):
        if not value.strip():
            raise serializers.ValidationError("Service name cannot be empty.")
        return value.strip().title()