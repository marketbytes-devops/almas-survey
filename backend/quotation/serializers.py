from rest_framework import serializers
from django.utils import timezone
from .models import Quotation
from survey.models import Survey
from additional_settings.models import Currency


class QuotationSerializer(serializers.ModelSerializer):
    survey_id = serializers.CharField(source="survey.survey_id", read_only=True)
    survey_id_int = serializers.IntegerField(source="survey.id", read_only=True)
    full_name = serializers.CharField(source="survey.full_name", read_only=True)
    service_type = serializers.CharField(source="survey.service_type", read_only=True)
    currency_code = serializers.CharField(source="currency.name", read_only=True, allow_null=True)

    final_amount = serializers.SerializerMethodField(read_only=True)
    balance = serializers.SerializerMethodField(read_only=True)
    signature_url = serializers.SerializerMethodField(read_only=True)

    survey = serializers.PrimaryKeyRelatedField(
        queryset=Survey.objects.all(),
        write_only=True,
        required=True,
        allow_null=False
    )
    currency = serializers.PrimaryKeyRelatedField(
        queryset=Currency.objects.all(),
        required=False,
        allow_null=True
    )

    included_services = serializers.ListField(
        child=serializers.IntegerField(min_value=0),
        required=False,
        allow_empty=True,
        default=list
    )
    excluded_services = serializers.ListField(
        child=serializers.IntegerField(min_value=0),
        required=False,
        allow_empty=True,
        default=list
    )
    selected_services = serializers.ListField(
        child=serializers.IntegerField(min_value=0),
        required=False,
        allow_empty=True,
        default=list
    )
    additional_charges = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        allow_empty=True,
        default=list
    )

    class Meta:
        model = Quotation
        fields = [
            "id",
            "survey", "survey_id", "survey_id_int",
            "quotation_id",
            "full_name", "service_type",
            "date", "amount", "discount", "final_amount", "advance", "balance",
            "currency", "currency_code", "notes",
            "included_services", "excluded_services", "selected_services", "additional_charges",
            "created_at", "updated_at",
            "signature", "signature_uploaded", "signature_url",
        ]
        read_only_fields = [
            "id", "quotation_id", "created_at", "updated_at",
            "survey_id", "survey_id_int", "full_name", "service_type",
            "final_amount", "balance", "signature_url", "signature_uploaded"
        ]

    def get_final_amount(self, obj):
        amount = obj.amount or 0
        discount = obj.discount or 0
        return max(0, amount - discount)

    def get_balance(self, obj):
        final = self.get_final_amount(obj)
        advance = obj.advance or 0
        return max(0, final - advance)

    def get_signature_url(self, obj):
        if obj.signature:
            request = self.context.get("request")
            return request.build_absolute_uri(obj.signature.url) if request else obj.signature.url
        return None

    def validate(self, attrs):
        """
        Main validation - runs on both create & update
        """
        if self.instance is None: 
            survey = attrs.get("survey")
            if not survey:
                raise serializers.ValidationError({"survey": "This field is required."})

            if Quotation.objects.filter(survey=survey).exists():
                raise serializers.ValidationError({
                    "survey": "A quotation already exists for this survey.",
                    "status": "duplicate",
                    "existing_quotation_id": Quotation.objects.get(survey=survey).quotation_id
                })

        amount = attrs.get("amount")
        advance = attrs.get("advance", 0)
        discount = attrs.get("discount", 0)

        if amount is not None:
            if amount < 0:
                raise serializers.ValidationError({"amount": "Amount cannot be negative."})
            if discount > amount:
                raise serializers.ValidationError({"discount": "Discount cannot exceed total amount."})
            if advance > (amount - discount):
                raise serializers.ValidationError({"advance": "Advance cannot exceed final amount (after discount)."})

        if self.instance and advance is not None:
            current_amount = attrs.get("amount", self.instance.amount or 0)
            current_discount = attrs.get("discount", self.instance.discount or 0)
            if advance > (current_amount - current_discount):
                raise serializers.ValidationError({"advance": "Advance cannot exceed final amount."})

        return attrs

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        for field in ["included_services", "excluded_services", "selected_services", "additional_charges"]:
            ret[field] = ret[field] or []
        return ret

    def create(self, validated_data):
        if "date" not in validated_data:
            validated_data["date"] = timezone.now().date()
        return super().create(validated_data)