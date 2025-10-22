from django.db import models

class AddCustomer(models.Model):
    name = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=15)
    email = models.EmailField()
    address = models.TextField()
    country = models.CharField(max_length=100)

    def __str__(self):
        return self.name