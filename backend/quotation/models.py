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
    serial_no = models.CharField(max_length=20, default="1001", null=True, blank=True)
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
    currency = models.ForeignKey(
        Currency, on_delete=models.SET_NULL, null=True, blank=True
    )
    notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)

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

        if not self.serial_no:
            last = Quotation.objects.order_by("-id").first()
            self.serial_no = str(int(last.serial_no or "1000") + 1) if last else "1001"

        super().save(*args, **kwargs)
