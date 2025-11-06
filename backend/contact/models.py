from django.conf import settings
from django.db import models

class Enquiry(models.Model):
    fullName = models.CharField(max_length=100)
    phoneNumber = models.CharField(max_length=20)
    email = models.EmailField()
    serviceType = models.CharField(max_length=50)
    message = models.TextField()
    recaptchaToken = models.TextField(null=True, blank=True)
    refererUrl = models.URLField(max_length=2000, null=True, blank=True)
    submittedUrl = models.URLField(max_length=2000, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    assigned_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    note = models.TextField(blank=True, null=True)
    contact_status = models.CharField(
        max_length=20,
        choices=[('Attended', 'Attended'), ('Not Attended', 'Not Attended')],
        default='Not Attended',
        null=True,
        blank=True
    )
    contact_status_note = models.TextField(blank=True, null=True)
    reached_out_whatsapp = models.BooleanField(default=False, null=True, blank=True)
    reached_out_email = models.BooleanField(default=False, null=True, blank=True)
    survey_date = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['created_at']),
            models.Index(fields=['assigned_user']),
            models.Index(fields=['contact_status']),
            models.Index(fields=['survey_date']),
        ]

    def __str__(self):
        return self.fullName or "Unnamed Enquiry"
