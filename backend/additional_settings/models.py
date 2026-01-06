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
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

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

# models.py 
class Item(models.Model):
    name = models.CharField(max_length=100, blank=True, null=True)
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='items', blank=True, null=True)
    description = models.TextField(blank=True, null=True)

    # ADD THESE FIELDS
    length = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="in cm")
    width = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="in cm")
    height = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="in cm")
    volume = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True, help_text="in m³ (auto-calculated)")
    weight = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="in kg (estimated)")

    class Meta:
        unique_together = ('name', 'room')

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

class Truck(models.Model):
    name = models.CharField(max_length=100, unique=True, null=True, blank=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

class Material(models.Model):
    name = models.CharField(max_length=100, unique=True, null=True, blank=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name
    
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