from django.db import models
from django.utils import timezone
from quotation.models import Quotation
from additional_settings.models import Labour, Truck, Material, Manpower

class Booking(models.Model):
    quotation = models.OneToOneField(Quotation, on_delete=models.CASCADE, related_name='booking')
    booking_id = models.CharField(max_length=50, unique=True, blank=True, null=True)
    
    move_date = models.DateField(null=True, blank=True)
    start_date = models.DateField(null=True, blank=True)
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

    def __str__(self):
        return f"{self.quantity} x {self.material.name} for {self.booking.booking_id}"
