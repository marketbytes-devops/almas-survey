from rest_framework import serializers
from .models import Quotation
from survey.models import Survey
from additional_settings.models import Currency


class QuotationSerializer(serializers.ModelSerializer):
    survey_id = serializers.CharField(source='survey.survey_id', read_only=True)
    survey = serializers.PrimaryKeyRelatedField(
        queryset=Survey.objects.all(), write_only=True, required=False, allow_null=True
    )
    currency = serializers.PrimaryKeyRelatedField(
        queryset=Currency.objects.all(), allow_null=True, required=False
    )
    currency_code = serializers.CharField(source='currency.name', read_only=True, allow_null=True)

    included_services = serializers.ListField(
        child=serializers.CharField(max_length=200),
        required=False,
        allow_empty=True
    )
    excluded_services = serializers.ListField(
        child=serializers.CharField(max_length=200),
        required=False,
        allow_empty=True
    )

    class Meta:
        model = Quotation
        fields = [
            'id', 'survey', 'survey_id', 'quotation_id',
            'serial_no', 'date', 'amount', 'advance',
            'currency', 'currency_code', 'notes',
            'included_services', 'excluded_services',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'quotation_id', 'created_at', 'updated_at', 'survey_id']

    def validate(self, attrs):
        amount = attrs.get('amount')
        advance = attrs.get('advance', 0)
        if amount is not None and advance and advance > amount:
            raise serializers.ValidationError({
                "advance": "Advance cannot exceed total amount."
            })
        return attrs

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['included_services'] = instance.included_services or []
        ret['excluded_services'] = instance.excluded_services or []
        return ret