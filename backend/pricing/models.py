from django.db import models
from additional_settings import models as additional_settings

class Price(models.Model):
    RATE_TYPE_CHOICES = [
        ('variable', 'Variable (Rate × Volume)'),
        ('flat', 'Flat Rate'),
    ]
    
    pricing_country = models.CharField(max_length=100, default="Qatar", blank=True, null=True)
    pricing_city = models.CharField(max_length=100, blank=True, null=True)
    
    min_volume = models.DecimalField(
        max_digits=10, decimal_places=2,
        help_text="Minimum volume in CBM (e.g., 0.01)", blank=True, null=True
    )
    max_volume = models.DecimalField(
        max_digits=10, decimal_places=2,
        help_text="Maximum volume in CBM (e.g., 10.00)", blank=True, null=True
    )
    rate = models.DecimalField(
        max_digits=12, decimal_places=2,
        help_text="Price in QAR", blank=True, null=True
    )
    rate_type = models.CharField(
        max_length=10, choices=RATE_TYPE_CHOICES, default='flat', blank=True, null=True
    )
    currency = models.CharField(max_length=10, default="QAR")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    move_type = models.ForeignKey(
        additional_settings.MoveType, 
        on_delete=models.SET_NULL, 
        blank=True, null=True
    )
    adjustment_rate = models.DecimalField(
        max_digits=12, decimal_places=2,
        default=0,
        help_text="Additional adjustment to the rate", blank=True, null=True
    )
  
    def __str__(self):
        return f"{self.pricing_city} - {self.min_volume} - {self.max_volume} CBM → {self.rate} QAR ({self.rate_type})"
    
    class Meta:
        indexes = [
            models.Index(fields=["pricing_country", "pricing_city", "is_active"]),
            models.Index(fields=["move_type", "is_active"]),
        ]

class AdditionalService(models.Model):
    RATE_TYPE_CHOICES = [
        ("FIX", "FIX"),
        ("VARIABLE", "VARIABLE"),
    ]
    service_name = models.CharField(max_length=200, unique=True, blank=True, null=True)
    currency = models.CharField(max_length=10, default="QAR", blank=True, null=True)
    price_per_unit = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    per_unit_quantity = models.PositiveIntegerField(default=1, blank=True, null=True)
    rate_type = models.CharField(max_length=20, choices=RATE_TYPE_CHOICES, default="FIX", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)
    
    class Meta:
        ordering = ['service_name']

    def __str__(self):
        return f"{self.service_name} - {self.price_per_unit} {self.currency}"