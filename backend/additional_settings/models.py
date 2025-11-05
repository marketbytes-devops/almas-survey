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

class Item(models.Model):
    name = models.CharField(max_length=100, blank=True, null=True)
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='items', blank=True, null=True)
    description = models.TextField(blank=True, null=True)

    class Meta:
        unique_together = ('name', 'room') 

    def __str__(self):
        return f"{self.name} ({self.room.name})"

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

# NEW MODELS FOR ADDITIONAL SETTINGS

class Hub(models.Model):
    name = models.CharField(max_length=100, unique=True, blank=True, null=True)
    code = models.CharField(max_length=50, unique=True, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

    def __str__(self):
        return f"{self.name} ({self.code})"

class Type(models.Model):
    TYPE_CATEGORIES = [
        ('service', 'Service Type'),
        ('transport', 'Transport Type'),
        ('package', 'Package Type'),
        ('other', 'Other'),
    ]
    
    name = models.CharField(max_length=100, blank=True, null=True)
    category = models.CharField(max_length=20, choices=TYPE_CATEGORIES, default='other', blank=True, null=True)
    hub = models.ForeignKey(Hub, on_delete=models.CASCADE, related_name='types', blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

    class Meta:
        unique_together = ('name', 'hub', 'category')

    def __str__(self):
        return f"{self.name} - {self.get_category_display()} ({self.hub.name})"

class Tariff(models.Model):
    TARIFF_TYPES = [
        ('main', 'Main Tariff'),
        ('special', 'Special Tariff'),
        ('seasonal', 'Seasonal Tariff'),
        ('promotional', 'Promotional Tariff'),
    ]
    
    RATE_TYPES = [
        ('fixed', 'Fixed'),
        ('variable', 'Variable'),
        ('percentage', 'Percentage'),
    ]
    
    name = models.CharField(max_length=100, blank=True, null=True)
    hub = models.ForeignKey(Hub, on_delete=models.CASCADE, related_name='tariffs', blank=True, null=True)
    type = models.ForeignKey(Type, on_delete=models.CASCADE, related_name='tariffs', blank=True, null=True)
    tariff_type = models.CharField(max_length=20, choices=TARIFF_TYPES, default='main', blank=True, null=True)
    rate_type = models.CharField(max_length=20, choices=RATE_TYPES, default='fixed', blank=True, null=True)
    base_rate = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, blank=True, null=True)
    currency = models.ForeignKey(Currency, on_delete=models.CASCADE, blank=True, null=True)
    unit = models.CharField(max_length=50, default='GBM', blank=True, null=True)  
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True, blank=True, null=True)
    valid_from = models.DateField(blank=True, null=True)
    valid_to = models.DateField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

    class Meta:
        unique_together = ('name', 'hub', 'type')

    def __str__(self):
        return f"{self.name} - {self.type.name} ({self.hub.name})"

class TariffRange(models.Model):
    tariff = models.ForeignKey(Tariff, on_delete=models.CASCADE, related_name='ranges', blank=True, null=True)
    range_number = models.CharField(max_length=50, blank=True, null=True)
    min_value = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    max_value = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    rate = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, blank=True, null=True)
    flat_rate = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, blank=True, null=True)
    adjustment_rate = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)

    class Meta:
        ordering = ['min_value']

    def __str__(self):
        return f"Range {self.range_number}: {self.min_value}+ ({self.tariff.name})"

class Team(models.Model):
    name = models.CharField(max_length=100, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    role = models.CharField(max_length=100, blank=True, null=True)
    is_active = models.BooleanField(default=True, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

    def __str__(self):
        return f"{self.name} ({self.email}) - {self.hub.name}"