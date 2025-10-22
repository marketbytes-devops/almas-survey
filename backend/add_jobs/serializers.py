from rest_framework import serializers
from .models import Job, StatusUpdate
from add_customers.models import AddCustomer

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = AddCustomer
        fields = ['id', 'name']

class StatusUpdateSerializer(serializers.ModelSerializer):
    job = serializers.PrimaryKeyRelatedField(queryset=Job.objects.all())

    def validate_job(self, value):
        if not Job.objects.filter(id=value.id).exists():
            raise serializers.ValidationError(f"Job with ID {value.id} does not exist.")
        return value

    class Meta:
        model = StatusUpdate
        fields = ['id', 'job', 'status_content', 'status_date', 'status_time', 'created_at']

class JobSerializer(serializers.ModelSerializer):
    status_updates = StatusUpdateSerializer(many=True, read_only=True)
    customer = CustomerSerializer(read_only=True)
    customer_id = serializers.PrimaryKeyRelatedField(
        queryset=AddCustomer.objects.all(),
        source='customer',
        write_only=True,
        required=True
    )

    class Meta:
        model = Job
        fields = [
            'id', 'cargo_type', 'customer', 'customer_id', 'receiver_name', 'contact_number', 'email',
            'recipient_address', 'recipient_country', 'commodity', 'number_of_packages',
            'weight', 'volume', 'origin', 'destination', 'cargo_ref_number', 'tracking_id',
            'collection_date', 'date_of_departure', 'date_of_arrival', 'created_at',
            'status_updates'
        ]