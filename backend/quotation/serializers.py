from rest_framework import serializers
from .models import Quotation
from survey.models import Survey
from additional_settings.models import Currency


class QuotationSerializer(serializers.ModelSerializer):
    survey_id = serializers.CharField(source="survey.survey_id", read_only=True)
    survey = serializers.PrimaryKeyRelatedField(
        queryset=Survey.objects.all(), write_only=True, required=False, allow_null=True
    )
    currency = serializers.PrimaryKeyRelatedField(
        queryset=Currency.objects.all(), allow_null=True, required=False
    )
    currency_code = serializers.CharField(
        source="currency.name", read_only=True, allow_null=True, default=None
    )
    full_name = serializers.CharField(source="survey.full_name", read_only=True)
    service_type = serializers.CharField(source="survey.service_type", read_only=True)
    survey_id_int = serializers.IntegerField(source="survey.id", read_only=True)

    included_services = serializers.ListField(
        child=serializers.IntegerField(), required=False, allow_empty=True
    )
    excluded_services = serializers.ListField(
        child=serializers.IntegerField(), required=False, allow_empty=True
    )
    selected_services = serializers.ListField(
        child=serializers.IntegerField(), required=False, allow_empty=True
    )

    signature_url = serializers.SerializerMethodField()
    final_amount = serializers.SerializerMethodField(read_only=True)
    balance = serializers.SerializerMethodField(read_only=True)

    def get_final_amount(self, obj):
        amount = obj.amount or 0
        discount = obj.discount or 0
        return max(0, amount - discount)

    def get_balance(self, obj):
        final = self.get_final_amount(obj)
        advance = obj.advance or 0
        return max(0, final - advance)

    class Meta:
        model = Quotation
        fields = [
            "id", "survey", "survey_id", "survey_id_int", "quotation_id",
            "full_name", "service_type",
            "date", "amount", "discount", "final_amount", "advance", "balance",
            "currency", "currency_code", "notes",
            "included_services", "excluded_services", "additional_charges",
            "created_at", "updated_at", "selected_services",
            "signature", "signature_uploaded", "signature_url",
        ]
        read_only_fields = [
            "id", "quotation_id", "created_at", "updated_at", "survey_id", "survey_id_int",
            "full_name", "service_type",
            "signature_url", "final_amount", "balance"
        ]

    def get_signature_url(self, obj):
        if obj.signature:
            request = self.context.get("request")
            return request.build_absolute_uri(obj.signature.url) if request else obj.signature.url
        return None

    def validate(self, attrs):
        # For partial updates (PATCH), only validate if advance is being changed
        # and we can get the current amount from instance
        advance = attrs.get("advance")
        if advance is not None:  # Only check if advance is being updated
            # Get current amount: from attrs if sent, else from existing instance
            amount = attrs.get("amount")
            if amount is None and self.instance is not None:
                amount = self.instance.amount or 0
            if amount is not None and advance > amount:
                raise serializers.ValidationError(
                    {"advance": "Advance cannot exceed total amount."}
                )
        return attrs

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret["included_services"] = instance.included_services or []
        ret["excluded_services"] = instance.excluded_services or []
        ret["selected_services"] = instance.selected_services or []
        ret["additional_charges"] = instance.additional_charges or []
        return ret
