from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator
from contact.models import Enquiry
from additional_settings.models import CustomerType, ServiceType, Room, VolumeUnit, WeightUnit, PackingType, Handyman, Currency, VehicleType

class Survey(models.Model):
    enquiry = models.OneToOneField(
        Enquiry, on_delete=models.CASCADE, related_name="survey", null=True, blank=True
    )
    customer_type = models.ForeignKey(
        CustomerType, on_delete=models.SET_NULL, null=True, blank=True, related_name="surveys"
    )
    is_military = models.BooleanField(default=False, blank=True, null=True)
    salutation = models.CharField(max_length=10, blank=True, null=True)
    full_name = models.CharField(max_length=100, blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    company = models.CharField(max_length=100, blank=True, null=True)
    survey_id = models.CharField(max_length=50, unique=True, blank=True, null=True)
    service_type = models.CharField(max_length=50, blank=True, null=True)
    goods_type = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(max_length=50, blank=True, null=True)
    survey_date = models.DateField(blank=True, null=True)
    survey_start_time = models.TimeField(blank=True, null=True)
    survey_end_time = models.TimeField(blank=True, null=True)
    work_description = models.TextField(blank=True, null=True)
    include_vehicle = models.BooleanField(default=False, blank=True, null=True)
    include_pet = models.BooleanField(default=False, blank=True, null=True)
    cost_together_vehicle = models.BooleanField(default=False, blank=True, null=True)
    cost_together_pet = models.BooleanField(default=False, blank=True, null=True)
    same_as_customer_address = models.BooleanField(default=False, blank=True, null=True)
    origin_address = models.TextField(blank=True, null=True)
    origin_city = models.CharField(max_length=100, blank=True, null=True)
    origin_country = models.CharField(max_length=100, blank=True, null=True)
    origin_state = models.CharField(max_length=100, blank=True, null=True)
    origin_zip = models.CharField(max_length=20, blank=True, null=True)
    pod_pol = models.CharField(max_length=100, blank=True, null=True)
    multiple_addresses = models.BooleanField(default=False, blank=True, null=True)
    packing_date_from = models.DateField(blank=True, null=True)
    packing_date_to = models.DateField(blank=True, null=True)
    loading_date = models.DateField(blank=True, null=True)
    eta = models.DateField(blank=True, null=True)
    etd = models.DateField(blank=True, null=True)
    est_delivery_date = models.DateField(blank=True, null=True)
    storage_start_date = models.DateField(blank=True, null=True)
    storage_frequency = models.CharField(max_length=50, blank=True, null=True)
    storage_duration = models.CharField(max_length=50, blank=True, null=True)
    storage_mode = models.CharField(max_length=50, blank=True, null=True)
    transport_mode = models.CharField(max_length=50, blank=True, null=True)
    general_owner_packed = models.BooleanField(default=False, blank=True, null=True)
    general_owner_packed_notes = models.TextField(blank=True, null=True)
    general_restriction = models.BooleanField(default=False, blank=True, null=True)
    general_restriction_notes = models.TextField(blank=True, null=True)
    general_handyman = models.BooleanField(default=False, blank=True, null=True)
    general_handyman_notes = models.TextField(blank=True, null=True)
    general_insurance = models.BooleanField(default=False, blank=True, null=True)
    general_insurance_notes = models.TextField(blank=True, null=True)
    origin_floor = models.BooleanField(default=False, blank=True, null=True)
    origin_floor_notes = models.TextField(blank=True, null=True)
    origin_lift = models.BooleanField(default=False, blank=True, null=True)
    origin_lift_notes = models.TextField(blank=True, null=True)
    origin_parking = models.BooleanField(default=False, blank=True, null=True)
    origin_parking_notes = models.TextField(blank=True, null=True)
    origin_storage = models.BooleanField(default=False, blank=True, null=True)
    origin_storage_notes = models.TextField(blank=True, null=True)
    destination_floor = models.BooleanField(default=False, blank=True, null=True)
    destination_floor_notes = models.TextField(blank=True, null=True)
    destination_lift = models.BooleanField(default=False, blank=True, null=True)
    destination_lift_notes = models.TextField(blank=True, null=True)
    destination_parking = models.BooleanField(default=False, blank=True, null=True)
    destination_parking_notes = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["enquiry"]),
            models.Index(fields=["survey_id"]),
            models.Index(fields=["created_at"]),
        ]

    def save(self, *args, **kwargs):
        if not self.survey_id:
            self.survey_id = f"SURVEY-{self.enquiry.id if self.enquiry else 'TEMP'}-{timezone.now().strftime('%Y%m%d%H%M%S')}"
        super().save(*args, **kwargs)

class DestinationAddress(models.Model):
    survey = models.ForeignKey(
        Survey, on_delete=models.CASCADE, related_name="destination_addresses", null=True, blank=True
    )
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    zip = models.CharField(max_length=20, blank=True, null=True)
    poe = models.CharField(max_length=100, blank=True, null=True)
    
    class Meta:
        indexes = [
            models.Index(fields=["survey"]),
        ]

    def __str__(self):
        return f"Destination Address for {self.survey}"

class Article(models.Model):
    survey = models.ForeignKey(Survey, related_name='articles', on_delete=models.CASCADE, blank=True, null=True)
    room = models.ForeignKey(Room, on_delete=models.SET_NULL, null=True, blank=True)
    item_name = models.CharField(max_length=200, blank=True, null=True)
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)], default=1, blank=True, null=True)
    volume = models.DecimalField(max_digits=20, decimal_places=10, null=True, blank=True)
    volume_unit = models.ForeignKey(VolumeUnit, on_delete=models.SET_NULL, null=True, blank=True)
    weight = models.DecimalField(max_digits=20, decimal_places=10, null=True, blank=True)
    weight_unit = models.ForeignKey(WeightUnit, on_delete=models.SET_NULL, null=True, blank=True)
    handyman = models.ForeignKey(Handyman, on_delete=models.SET_NULL, null=True, blank=True)
    packing_option = models.ForeignKey(PackingType, on_delete=models.SET_NULL, null=True, blank=True)
    move_status = models.CharField(max_length=50, blank=True, null=True)
    amount = models.DecimalField(max_digits=20, decimal_places=10, null=True, blank=True)
    currency = models.ForeignKey(Currency, on_delete=models.SET_NULL, null=True, blank=True)
    remarks = models.TextField(blank=True, null=True)
    length = models.DecimalField(max_digits=20, decimal_places=10, blank=True, null=True, help_text="Length in cm")
    width = models.DecimalField(max_digits=20, decimal_places=10, blank=True, null=True, help_text="Width in cm")
    height = models.DecimalField(max_digits=20, decimal_places=10, blank=True, null=True, help_text="Height in cm")
    calculated_volume = models.DecimalField(max_digits=20, decimal_places=10, blank=True, null=True, help_text="Auto-calculated volume (L×W×H/1000000)")
    
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)

    class Meta:
        indexes = [
            models.Index(fields=["survey"]),
            models.Index(fields=["room"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return f"{self.item_name} (Qty: {self.quantity})"
    
    def save(self, *args, **kwargs):
        if self.length and self.width and self.height:
            self.calculated_volume = (self.length * self.width * self.height) / 1000000
        super().save(*args, **kwargs)

class Vehicle(models.Model):
    survey = models.ForeignKey(Survey, related_name='vehicles', on_delete=models.CASCADE, null=True, blank=True)
    vehicle_type = models.ForeignKey(VehicleType, on_delete=models.SET_NULL, null=True, blank=True)
    make = models.CharField(max_length=100, blank=True, null=True)
    model = models.CharField(max_length=100, blank=True, null=True)
    insurance = models.BooleanField(default=False, blank=True, null=True)
    remark = models.TextField(blank=True, null=True)
    transport_mode = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)

    class Meta:
        indexes = [
            models.Index(fields=["survey"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return f"{self.make} {self.model}"

class Pet(models.Model):
    survey = models.ForeignKey(Survey, related_name='pets', on_delete=models.CASCADE, null=True, blank=True)
    pet_name = models.CharField(max_length=100, blank=True, null=True)
    pet_type = models.CharField(max_length=100, blank=True, null=True)
    breed = models.CharField(max_length=100, blank=True, null=True)
    age = models.PositiveIntegerField(blank=True, null=True)
    weight = models.DecimalField(max_digits=20, decimal_places=10, blank=True, null=True)
    special_care = models.TextField(blank=True, null=True)
    transport_requirements = models.TextField(blank=True, null=True)
    feeding_instructions = models.TextField(blank=True, null=True)
    medication = models.TextField(blank=True, null=True)
    vaccination_status = models.CharField(max_length=100, blank=True, null=True)
    behavior_notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)

    class Meta:
        indexes = [
            models.Index(fields=["survey"]),
        ]

    def __str__(self):
        return f"{self.pet_name} ({self.pet_type})"