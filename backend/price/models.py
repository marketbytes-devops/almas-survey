# price/models.py
from django.db import models

class Price(models.Model):
    RATE_TYPE_CHOICES = [
        ('variable', 'Variable (Rate × Volume)'),
        ('flat', 'Flat Rate'),
    ]

    min_volume = models.DecimalField(
        max_digits=10, decimal_places=2,
        help_text="Minimum volume in CBM (e.g., 0.01)"
    )
    max_volume = models.DecimalField(
        max_digits=10, decimal_places=2,
        help_text="Maximum volume in CBM (e.g., 10.00)"
    )
    rate = models.DecimalField(
        max_digits=12, decimal_places=2,
        help_text="Price in QAR"
    )
    rate_type = models.CharField(
        max_length=10, choices=RATE_TYPE_CHOICES, default='flat'
    )
    currency = models.CharField(max_length=10, default="QAR")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['min_volume']
        verbose_name = "Price Range"
        verbose_name_plural = "Price Ranges"
        unique_together = ['min_volume', 'max_volume']

    def __str__(self):
        return f"{self.min_volume} - {self.max_volume} CBM → {self.rate} QAR ({self.rate_type})"