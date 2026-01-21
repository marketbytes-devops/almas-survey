from django.db import models

class CustomerType(models.Model):
    name = models.CharField(max_length=100, unique=True, blank=True, null=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

class ServiceType(models.Model):
    name = models.CharField(max_length=100, unique=True, blank=True, null=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

class VolumeUnit(models.Model):
    name = models.CharField(max_length=50, unique=True, blank=True, null=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

class WeightUnit(models.Model):
    name = models.CharField(max_length=50, unique=True, blank=True, null=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

class PackingType(models.Model):
    name = models.CharField(max_length=100, unique=True, blank=True, null=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

class Manpower(models.Model):
    name = models.CharField(max_length=100, unique=True, blank=True, null=True)
    category = models.CharField(max_length=100, blank=True, null=True)
    EMPLOYER_CHOICES = [
        ('Almas Movers', 'Almas Movers'),
        ('Outside Workers', 'Outside Workers'),
    ]
    employer = models.CharField(max_length=200, choices=EMPLOYER_CHOICES, blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.category or 'No Category'})"

class Handyman(models.Model):
    type_name = models.CharField(max_length=100, unique=True, blank=True, null=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.type_name

class VehicleType(models.Model):
    name = models.CharField(max_length=100, unique=True, blank=True, null=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name  

class PetType(models.Model):
    name = models.CharField(max_length=100, unique=True, blank=True, null=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name  

class Room(models.Model):
    name = models.CharField(max_length=100, unique=True, blank=True, null=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

class Item(models.Model):
    name = models.CharField(max_length=100, blank=True, null=True)
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='items', blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    length = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="in cm")
    width = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="in cm")
    height = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="in cm")
    volume = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True, help_text="in m³ (auto-calculated)")
    weight = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="in kg (estimated)")

    pass

    def __str__(self):
        return f"{self.name} ({self.room.name if self.room else 'No Room'})"
class Currency(models.Model):
    name = models.CharField(max_length=50, unique=True, blank=True, null=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

class Tax(models.Model):
    tax_name = models.CharField(max_length=100, unique=True, blank=True, null=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.tax_name

class Hub(models.Model):
    name = models.CharField(max_length=100, unique=True, blank=True, null=True)
    code = models.CharField(max_length=50, unique=True, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

    def __str__(self):
        return f"{self.name} ({self.code})"

class Labour(models.Model):
    name = models.CharField(max_length=100, unique=True, null=True, blank=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name


class Material(models.Model):
    name = models.CharField(max_length=100, unique=True, null=True, blank=True)
    description = models.TextField(blank=True, null=True)
    stock_in_hand = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    unit = models.CharField(max_length=50, blank=True, null=True, help_text="e.g. Rolls, Pcs, Boxes")
    purchase_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    def __str__(self):
        return f"{self.name} ({self.stock_in_hand} {self.unit or ''})"

class MaterialPurchase(models.Model):
    material = models.ForeignKey(Material, on_delete=models.CASCADE, related_name='purchases')
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    purchase_date = models.DateField(auto_now_add=True)
    supplier = models.CharField(max_length=200, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.total_price:
            self.total_price = self.quantity * self.unit_price
        
        is_new = self.pk is None
        super().save(*args, **kwargs)
        
        if is_new:
            self.material.stock_in_hand += self.quantity
            self.material.save()
            
            InventoryLog.objects.create(
                material=self.material,
                transaction_type='purchase',
                quantity=self.quantity,
                reference_id=str(self.id),
                notes=f"Purchased from {self.supplier or 'Unknown'}"
            )

    def __str__(self):
        return f"Purchase of {self.quantity} {self.material.name}"

class InventoryLog(models.Model):
    TRANSACTION_TYPES = [
        ('purchase', 'Purchase'),
        ('booking_use', 'Booking Usage'),
        ('adjustment', 'Manual Adjustment'),
        ('sale', 'Sale'),
    ]
    material = models.ForeignKey(Material, on_delete=models.CASCADE, related_name='logs')
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateTimeField(auto_now_add=True)
    reference_id = models.CharField(max_length=100, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.get_transaction_type_display()} - {self.quantity} for {self.material.name}"
    
class MoveType(models.Model):
    name = models.CharField(max_length=100, unique=True, blank=True, null=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

class TariffType(models.Model):
    name = models.CharField(max_length=100, unique=True, blank=True, null=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name
    
class SurveyAdditionalService(models.Model):
    name = models.CharField(max_length=200, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

    def __str__(self):
        return self.name