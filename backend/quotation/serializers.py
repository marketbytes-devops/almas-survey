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
        child=serializers.IntegerField(), 
        required=False,
        allow_empty=True
    )
    excluded_services = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        allow_empty=True
    )
    selected_services = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        allow_empty=True,
        write_only=False  
    )

    signature_url = serializers.SerializerMethodField()

    class Meta:
        model = Quotation
        fields = [
            'id', 'survey', 'survey_id', 'quotation_id',
            'date', 'amount', 'discount', 'final_amount', 'advance', 'balance',
            'currency', 'currency_code', 'notes',
            'included_services', 'excluded_services', 'additional_charges',
            'created_at', 'updated_at','selected_services',
            'signature', 'signature_uploaded', 'signature_url',
        ]
        read_only_fields = ['id', 'quotation_id', 'created_at', 'updated_at', 'survey_id', 'signature_url']

    def get_signature_url(self, obj):
        if obj.signature:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.signature.url)
            return obj.signature.url
        return None

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
        ret['selected_services'] = instance.selected_services or []
        ret['additional_charges'] = instance.additional_charges or []
        return ret