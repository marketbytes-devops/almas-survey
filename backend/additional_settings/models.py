from django.db import models

class CustomerType(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

class ServiceType(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

class VolumeUnit(models.Model):
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

class WeightUnit(models.Model):
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

class PackingType(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

class Manpower(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

class Handyman(models.Model):
    type_name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.type_name

class VehicleType(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name  

class PetType(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name  

class Room(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)

    class Meta:
        unique_together = ('name',)

    def __str__(self):
        return self.name

class Item(models.Model):
    name = models.CharField(max_length=100)
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='items')
    description = models.TextField(blank=True, null=True)
    width = models.DecimalField(max_digits=20, decimal_places=10, blank=True, null=True, help_text="Width in cm")
    length = models.DecimalField(max_digits=20, decimal_places=10, blank=True, null=True, help_text="Length in cm")
    height = models.DecimalField(max_digits=20, decimal_places=10, blank=True, null=True, help_text="Height in cm")
    volume = models.DecimalField(max_digits=20, decimal_places=10, blank=True, null=True, help_text="Volume in m³")
    weight = models.DecimalField(max_digits=20, decimal_places=10, blank=True, null=True, help_text="Weight in kg")
    
    calculated_volume = models.DecimalField(max_digits=20, decimal_places=10, blank=True, null=True, help_text="Auto-calculated volume (L×W×H/1000000)")
    
    class Meta:
        unique_together = ('name', 'room')

    def __str__(self):
        return f"{self.name} ({self.room.name})"
    
    def save(self, *args, **kwargs):
        if self.length and self.width and self.height:
            self.calculated_volume = (self.length * self.width * self.height) / 1000000 
        super().save(*args, **kwargs)

class Currency(models.Model):
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

class Tax(models.Model):
    tax_name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.tax_name