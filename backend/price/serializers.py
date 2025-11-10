# price/serializers.py
from rest_framework import serializers
from .models import Price

class PriceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Price
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']