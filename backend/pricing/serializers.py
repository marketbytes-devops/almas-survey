from rest_framework import serializers
from .models import (
    Price,
    AdditionalService,
    QuotationAdditionalCharge,
    InclusionExclusion,
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
        required=True,  # Make it required for both create and update
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
        # Default to Qatar if not provided
        validated_data.setdefault("country", "Qatar")
        return super().create(validated_data)
