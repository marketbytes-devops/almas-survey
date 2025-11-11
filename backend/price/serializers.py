from rest_framework import serializers
from .models import Price

class PriceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Price
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
        
    def validate(self, attrs):
        min_vol = attrs.get('min_volume')
        max_vol = attrs.get('max_volume')
        
        if min_vol and max_vol and min_vol >= max_vol:
            raise serializers.ValidationError({
                "max_volume": "Max volume must be greater than min volume"
            })
        
        return attrs