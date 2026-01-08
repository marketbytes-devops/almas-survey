from django.db import models
from django.utils import timezone
from quotation.models import Quotation
from additional_settings.models import Labour, Truck, Material, Manpower, InventoryLog

class Booking(models.Model):
    quotation = models.OneToOneField(Quotation, on_delete=models.CASCADE, related_name='booking')
    booking_id = models.CharField(max_length=50, unique=True, blank=True, null=True)
    
    move_date = models.DateField(null=True, blank=True)
    start_time = models.TimeField(null=True, blank=True)  # <-- Renamed to start_time
    estimated_end_time = models.TimeField(null=True, blank=True)
    
    supervisor = models.ForeignKey(Manpower, on_delete=models.SET_NULL, null=True, blank=True, related_name='supervised_bookings')
    notes = models.TextField(blank=True, null=True)
    
    status = models.CharField(
        max_length=50,
        default='confirmed',
        null=True, blank=True,
        choices=[
            ('confirmed', 'Confirmed'),
            ('in_progress', 'In Progress'),
            ('completed', 'Completed'),
            ('cancelled', 'Cancelled')
        ]
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.booking_id:
            timestamp = timezone.now().strftime("%Y%m%d%H%M%S")
            self.booking_id = f"BOOK-{self.quotation.id}-{timestamp}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Booking {self.booking_id} for {self.quotation}"

class BookingLabour(models.Model):
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='labours', null=True, blank=True)
    labour_type = models.ForeignKey(Labour, on_delete=models.CASCADE, null=True, blank=True)
    staff_member = models.ForeignKey(Manpower, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_bookings')
    quantity = models.PositiveIntegerField(default=1, null=True, blank=True)

    def __str__(self):
        return f"{self.quantity} x {self.labour_type.name} for {self.booking.booking_id}"

class BookingTruck(models.Model):
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='trucks', null=True, blank=True)
    truck_type = models.ForeignKey(Truck, on_delete=models.CASCADE, null=True, blank=True)
    quantity = models.PositiveIntegerField(default=1, null=True, blank=True)

    def __str__(self):
        return f"{self.quantity} x {self.truck_type.name} for {self.booking.booking_id}"

class BookingMaterial(models.Model):
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='materials', null=True, blank=True)
    material = models.ForeignKey(Material, on_delete=models.CASCADE, null=True, blank=True)
    quantity = models.PositiveIntegerField(default=1, null=True, blank=True)

    def save(self, *args, **kwargs):
        # Handle stock update
        is_new = self.pk is None
        old_quantity = 0
        if not is_new:
            old_instance = BookingMaterial.objects.get(pk=self.pk)
            old_quantity = old_instance.quantity
        
        super().save(*args, **kwargs)
        
        # Adjust stock_in_hand
        quantity_diff = self.quantity - old_quantity
        if quantity_diff != 0:
            self.material.stock_in_hand -= quantity_diff
            self.material.save()
            
            InventoryLog.objects.create(
                material=self.material,
                transaction_type='booking_use',
                quantity=-quantity_diff, # Negative for usage
                reference_id=self.booking.booking_id,
                notes=f"{'Used' if quantity_diff > 0 else 'Returned'} for booking {self.booking.booking_id}"
            )

    def delete(self, *args, **kwargs):
        # Restore stock on deletion
        self.material.stock_in_hand += self.quantity
        self.material.save()
        
        InventoryLog.objects.create(
            material=self.material,
            transaction_type='adjustment',
            quantity=self.quantity,
            reference_id=self.booking.booking_id,
            notes=f"Returned due to material removal from booking {self.booking.booking_id}"
        )
        super().delete(*args, **kwargs)

    def __str__(self):
        return f"{self.quantity} x {self.material.name} for {self.booking.booking_id}"
