from django.db import models
from additional_settings import models as additional_settings


class InclusionExclusion(models.Model):
    TYPE_CHOICES = [
        ("include", "Include"),
        ("exclude", "Exclude"),
    ]

    text = models.CharField(max_length=500, blank=True, null=True)
    type = models.CharField(max_length=10, choices=TYPE_CHOICES, blank=True, null=True)

    country = models.CharField(max_length=100, default="Qatar", blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)

    is_active = models.BooleanField(default=True, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

    class Meta:
        verbose_name = "Inclusion / Exclusion Item"
        verbose_name_plural = "Inclusion / Exclusion Items"
        unique_together = ("text", "type", "city")
        indexes = [
            models.Index(fields=["type"]),
            models.Index(fields=["city"]),
            models.Index(fields=["is_active"]),
        ]

    def __str__(self):
        return f"[{self.get_type_display()}] {self.text}"


class Price(models.Model):
    RATE_TYPE_CHOICES = [
        ("variable", "Variable (Rate × Volume)"),
        ("flat", "Flat Rate"),
    ]

    pricing_country = models.CharField(
        max_length=100, default="Qatar", blank=True, null=True
    )
    pricing_city = models.CharField(max_length=100, blank=True, null=True)

    min_volume = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Minimum volume in CBM (e.g., 0.01)",
        blank=True,
        null=True,
    )
    max_volume = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Maximum volume in CBM (e.g., 10.00)",
        blank=True,
        null=True,
    )
    rate = models.DecimalField(
        max_digits=12, decimal_places=2, help_text="Price in QAR", blank=True, null=True
    )
    rate_type = models.CharField(
        max_length=10, choices=RATE_TYPE_CHOICES, default="flat", blank=True, null=True
    )
    currency = models.CharField(max_length=10, default="QAR", blank=True, null=True)
    is_active = models.BooleanField(default=True, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

    move_type = models.ForeignKey(
        additional_settings.MoveType, on_delete=models.SET_NULL, blank=True, null=True
    )
    adjustment_rate = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        help_text="Additional adjustment to the rate",
        blank=True,
        null=True,
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
    price_per_unit = models.DecimalField(
        max_digits=12, decimal_places=2, blank=True, null=True
    )
    per_unit_quantity = models.PositiveIntegerField(default=1, blank=True, null=True)
    rate_type = models.CharField(
        max_length=20, choices=RATE_TYPE_CHOICES, default="FIX", blank=True, null=True
    )
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

    class Meta:
        ordering = ["service_name"]

    def __str__(self):
        return f"{self.service_name} - {self.price_per_unit} {self.currency}"


class QuotationAdditionalCharge(models.Model):
    RATE_TYPE_CHOICES = [
        ("FIX", "FIX"),
        ("VARIABLE", "VARIABLE"),
    ]

    service = models.ForeignKey(
        "additional_settings.SurveyAdditionalService",
        on_delete=models.PROTECT,
        related_name="quotation_charges",
        blank=True,
        null=True,
    )

    currency = models.ForeignKey(
        "additional_settings.Currency", on_delete=models.SET_NULL, null=True, blank=True
    )

    price_per_unit = models.DecimalField(
        max_digits=12, decimal_places=2, blank=True, null=True
    )
    per_unit_quantity = models.PositiveIntegerField(default=1, blank=True, null=True)
    rate_type = models.CharField(
        max_length=20, choices=RATE_TYPE_CHOICES, default="FIX", blank=True, null=True
    )

    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

    class Meta:
        verbose_name = "Quotation Additional Charge"
        verbose_name_plural = "Quotation Additional Charges"
        ordering = ["service__name"]

    def __str__(self):
        return f"{self.service.name} - {self.price_per_unit} {self.currency}"


class InsurancePlan(models.Model):
    CALCULATION_CHOICES = [
        ("free", "Free (Included in Base Price)"),
        ("percentage", "Percentage of Total Quote Value"),
        ("fixed", "Fixed Amount"),
        ("per_item", "Fixed Amount Per High-Value Item"),
    ]

    name = models.CharField(max_length=100, unique=True, blank=True, null=True)
    description = models.TextField(
        help_text="Shown to customer in quote", blank=True, null=True
    )

    calculation_type = models.CharField(
        max_length=20,
        choices=CALCULATION_CHOICES,
        default="percentage",
        blank=True,
        null=True,
    )

    rate = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="e.g. 3.50 for 3.5% or 250.00 for QAR 250 fixed",
        blank=True,
        null=True,
    )

    minimum_premium = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        help_text="Minimum charge even if calculation is lower",
        blank=True,
        null=True,
    )

    maximum_coverage = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Maximum amount this plan covers (optional)",
    )

    is_default = models.BooleanField(
        default=False,
        help_text="Auto-selected when generating quote",
        blank=True,
        null=True,
    )

    is_mandatory = models.BooleanField(
        default=False, help_text="Customer cannot unselect this", blank=True, null=True
    )

    is_active = models.BooleanField(default=True, blank=True, null=True)
    order = models.PositiveIntegerField(
        default=0, help_text="Display order", blank=True, null=True
    )

    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

    class Meta:
        ordering = ["order", "name"]
        verbose_name = "Insurance Plan"
        verbose_name_plural = "Insurance Plans"

    def __str__(self):
        return f"{self.name} - {self.get_calculation_type_display()}"

    def save(self, *args, **kwargs):
        if self.is_default:
            InsurancePlan.objects.filter(is_default=True).update(is_default=False)
            self.is_default = True
        super().save(*args, **kwargs)


class PaymentTerm(models.Model):
    name = models.CharField(max_length=100, unique=True, blank=True, null=True)
    description = models.TextField(
        help_text="Shown in quote to customer", blank=True, null=True
    )

    advance_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=50.00,
        help_text="e.g. 50.00 = 50% advance",
        blank=True,
        null=True,
    )

    due_on_choices = [
        ("survey", "Upon Survey Confirmation"),
        ("packing", "Before Packing"),
        ("delivery", "On Delivery"),
        ("after_delivery", "After Delivery (Net 7/15/30)"),
    ]
    advance_due_on = models.CharField(
        max_length=20, choices=due_on_choices, default="survey", blank=True, null=True
    )

    balance_due_on = models.CharField(
        max_length=20, choices=due_on_choices, default="delivery", blank=True, null=True
    )

    is_default = models.BooleanField(
        default=False, help_text="Auto-selected in quote", blank=True, null=True
    )
    is_active = models.BooleanField(default=True, blank=True, null=True)
    order = models.PositiveIntegerField(default=0, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

    class Meta:
        ordering = ["order", "name"]
        verbose_name = "Payment Term"
        verbose_name_plural = "Payment Terms"

    def __str__(self):
        return f"{self.name} ({self.advance_percentage}% advance)"

    def save(self, *args, **kwargs):
        if self.is_default:
            PaymentTerm.objects.filter(is_default=True).update(is_default=False)
        super().save(*args, **kwargs)


class QuoteNote(models.Model):
    CATEGORY_CHOICES = [
        ("general", "General"),
        ("packing", "Packing"),
        ("delivery", "Delivery"),
        ("storage", "Storage"),
        ("payment", "Payment"),
        ("legal", "Legal / Terms"),
        ("custom", "Custom"),
    ]

    title = models.CharField(max_length=150, blank=True, null=True)
    content = models.TextField(
        help_text="Full note text shown in quote", blank=True, null=True
    )
    category = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES,
        default="general",
        blank=True,
        null=True,
    )

    is_default = models.BooleanField(
        default=False,
        help_text="Automatically included in every new quote",
        blank=True,
        null=True,
    )
    is_active = models.BooleanField(default=True, blank=True, null=True)
    order = models.PositiveIntegerField(default=0, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

    class Meta:
        ordering = ["order", "title"]
        verbose_name = "Quote Note"
        verbose_name_plural = "Quote Notes"

    def __str__(self):
        return self.title


class TruckType(models.Model):
    name = models.CharField(max_length=100, unique=True, blank=True, null=True)
    capacity_cbm = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        help_text="Volume capacity in cubic meters (CBM)",
        blank=True,
        null=True,
    )
    capacity_kg = models.PositiveIntegerField(
        help_text="Weight capacity in kilograms", blank=True, null=True
    )
    price_per_trip = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Base price per trip in QAR",
        blank=True,
        null=True,
    )

    length_meters = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True
    )
    width_meters = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True
    )
    height_meters = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True
    )

    is_active = models.BooleanField(default=True, blank=True, null=True)
    is_default = models.BooleanField(
        default=False, help_text="Auto-selected in new surveys", blank=True, null=True
    )
    order = models.PositiveIntegerField(default=0, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

    class Meta:
        ordering = ["order", "name"]
        verbose_name = "Truck Type"
        verbose_name_plural = "Truck Types"

    def __str__(self):
        return f"{self.name} ({self.capacity_cbm} CBM / {self.capacity_kg} KG)"

    def save(self, *args, **kwargs):
        if self.is_default:
            TruckType.objects.filter(is_default=True).update(is_default=False)
        super().save(*args, **kwargs)


class SurveyRemark(models.Model):
    CATEGORY_CHOICES = [
        ("access", "Access Issues"),
        ("packing", "Packing Related"),
        ("items", "Special Items"),
        ("building", "Building / Elevator"),
        ("timing", "Timing / Scheduling"),
        ("other", "Other"),
    ]

    title = models.CharField(max_length=150, unique=True, blank=True, null=True)
    description = models.TextField(
        help_text="Optional longer explanation", blank=True, null=True
    )
    category = models.CharField(
        max_length=20, choices=CATEGORY_CHOICES, default="other", blank=True, null=True
    )

    is_active = models.BooleanField(default=True, blank=True, null=True)
    order = models.PositiveIntegerField(default=0, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

    class Meta:
        ordering = ["order", "title"]
        verbose_name = "Survey Remark"
        verbose_name_plural = "Survey Remarks"

    def __str__(self):
        return self.title


class Service(models.Model):
    name = models.CharField(
        max_length=200,
        unique=True,
        help_text="Name of the additional service (e.g., Boom Truck, Curtain Installation)",
        blank=True,
        null=True,
    )
    is_active = models.BooleanField(default=True, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Additional Service"
        verbose_name_plural = "Additional Services"

    def __str__(self):
        return self.name
