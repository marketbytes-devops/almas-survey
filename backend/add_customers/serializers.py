from rest_framework import serializers
from .models import AddCustomer

class AddCustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = AddCustomer
        fields = ['id', 'name', 'phone_number', 'email', 'address', 'country']