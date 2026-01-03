import os
from django.db import models
from django.utils import timezone
from survey.models import Survey
from additional_settings.models import Currency
from django.core.validators import MinValueValidator


class Quotation(models.Model):
    survey = models.OneToOneField(
        Survey,
        on_delete=models.CASCADE,
        related_name="quotation",
        null=True,
        blank=True,
    )
    quotation_id = models.CharField(max_length=50, unique=True, null=True, blank=True)
    pricing_mode = models.CharField(
        max_length=20,
        choices=[("variable", "Variable"), ("fixed", "Fixed")],
        default="variable",
        help_text="How the amount was calculated",
        null=True,
        blank=True,
    )
    date = models.DateField(default=timezone.now, null=True, blank=True)
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        null=True,
        blank=True,
    )
    advance = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        default=0,
        null=True,
        blank=True,
    )
    discount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        default=0.00,
        null=True,
        blank=True,
        help_text="Discount amount in the quotation currency",
    )

    final_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        null=True,
        blank=True,
        help_text="Total amount after discount (amount - discount)",
    )

    balance = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        null=True,
        blank=True,
        help_text="Remaining amount to pay (final_amount - advance)",
    )
    currency = models.ForeignKey(
        Currency, on_delete=models.SET_NULL, null=True, blank=True
    )
    notes = models.TextField(null=True, blank=True)

    included_services = models.JSONField(
        default=list, null=True, blank=True, help_text="List of included services IDs"
    )
    excluded_services = models.JSONField(
        default=list, null=True, blank=True, help_text="List of excluded services IDs"
    )
    selected_services = models.JSONField(
        default=list,
        null=True,
        blank=True,
        help_text="List of selected general services (from /services/) IDs chosen by user with round buttons",
    )
    additional_charges = models.JSONField(
        default=list,
        null=True,
        blank=True,
        help_text="Detailed additional charges with price and quantity"
    )

    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)
    signature = models.FileField(upload_to='quotation_signatures/', null=True, blank=True)
    signature_uploaded = models.BooleanField(default=False)

    class Meta:
        indexes = [
            models.Index(fields=["survey"]),
            models.Index(fields=["quotation_id"]),
        ]
        verbose_name = "Quotation"
        verbose_name_plural = "Quotations"

    def __str__(self):
        return f"Quotation {self.quotation_id or 'Draft'} – {self.survey}"

    def save(self, *args, **kwargs):
        if not self.quotation_id and self.survey:
            timestamp = timezone.now().strftime("%Y%m%d%H%M%S")
            self.quotation_id = f"QUOT-{self.survey.id}-{timestamp}"

        if not isinstance(self.included_services, list):
            self.included_services = []
        if not isinstance(self.excluded_services, list):
            self.excluded_services = []
        if not isinstance(self.additional_charges, list):
            self.additional_charges = []

        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        if self.signature:
            if os.path.isfile(self.signature.path):
                os.remove(self.signature.path)
        super().delete(*args, **kwargs)
