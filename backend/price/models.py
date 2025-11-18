from django.db import models
from additional_settings import models as additional_settings

class Price(models.Model):
    RATE_TYPE_CHOICES = [
        ('variable', 'Variable (Rate × Volume)'),
        ('flat', 'Flat Rate'),
    ]

    min_volume = models.DecimalField(
        max_digits=10, decimal_places=2,
        help_text="Minimum volume in CBM (e.g., 0.01)", null=True, blank=True
    )
    max_volume = models.DecimalField(
        max_digits=10, decimal_places=2,
        help_text="Maximum volume in CBM (e.g., 10.00)", null=True, blank=True
    )
    rate = models.DecimalField(
        max_digits=12, decimal_places=2,
        help_text="Price in QAR", null=True, blank=True
    )
    rate_type = models.CharField(
        max_length=10, choices=RATE_TYPE_CHOICES, default='flat', null=True, blank=True
    )
    currency = models.CharField(max_length=10, default="QAR")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    hub = models.ForeignKey(additional_settings.Hub, on_delete=models.SET_NULL, null=True, blank=True)
    move_type = models.ForeignKey(additional_settings.MoveType, on_delete=models.SET_NULL, null=True, blank=True)
    adjustment_rate = models.DecimalField(
        max_digits=12, decimal_places=2, 
        default=0,
        help_text="Additional adjustment to the rate", null=True, blank=True
    )
    
    def __str__(self):
        return f"{self.min_volume} - {self.max_volume} CBM → {self.rate} QAR ({self.rate_type})"
    
    
class AdditionalService(models.Model):
    RATE_TYPE_CHOICES = [
        ("FIX", "FIX"),
        ("VARIABLE", "VARIABLE"),
    ]

    service_name = models.CharField(max_length=200, unique=True, null=True, blank=True)
    currency = models.CharField(max_length=10, default="QAR", null=True, blank=True)
    price_per_unit = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    per_unit_quantity = models.PositiveIntegerField(default=1, null=True, blank=True)
    rate_type = models.CharField(max_length=20, choices=RATE_TYPE_CHOICES, default="FIX", null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)

    class Meta:
        ordering = ['service_name']

    def __str__(self):
        return f"{self.service_name} - {self.price_per_unit} {self.currency}"