# backend/contact/serializers.py

from rest_framework import serializers
from .models import Enquiry
from authapp.models import CustomUser
from django.db import transaction
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)

class EnquirySerializer(serializers.ModelSerializer):

    class Meta:
        model = Enquiry
        fields = [
            "id", "fullName", "phoneNumber", "email", "serviceType", "message",
            "recaptchaToken", "refererUrl", "submittedUrl", "created_at",
            "note", "contact_status", "contact_status_note",
            "reached_out_whatsapp", "reached_out_email", "survey_date","assigned_user_email",
        ]
        read_only_fields = ["id", "created_at"]

    assigned_user_email = serializers.EmailField(write_only=True, required=False, allow_blank=True, allow_null=True)

    def validate_assigned_user_email(self, value):
        if value:
            try:
                CustomUser.objects.get(email__iexact=value)
                return value
            except CustomUser.DoesNotExist:
                raise serializers.ValidationError("User with this email does not exist.")
        return value

    def create(self, validated_data):
        assigned_user_email = validated_data.pop("assigned_user_email", None)
        assigned_user = None
        if assigned_user_email:
            assigned_user = CustomUser.objects.get(email__iexact=assigned_user_email)

        enquiry = Enquiry.objects.create(
            assigned_user=assigned_user,
            **validated_data
        )
        return enquiry

    def update(self, instance, validated_data):
        assigned_user_email = validated_data.pop("assigned_user_email", None)

        if assigned_user_email is not None:
            if assigned_user_email:
                try:
                    instance.assigned_user = CustomUser.objects.get(email__iexact=assigned_user_email)
                except CustomUser.DoesNotExist:
                    raise serializers.ValidationError("User with this email does not exist.")
            else:
                instance.assigned_user = None

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.assigned_user:
            data["assigned_user_email"] = instance.assigned_user.email
        else:
            data["assigned_user_email"] = None
        return data