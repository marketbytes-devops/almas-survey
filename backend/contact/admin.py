from django.contrib import admin
from .models import Enquiry


@admin.register(Enquiry)
class EnquiryAdmin(admin.ModelAdmin):
    list_display = (
        "fullName",
        "phoneNumber",
        "email",
        "serviceType",
        "contact_status",
        "assigned_user",
        "reached_out_whatsapp",
        "reached_out_email",
        "survey_date",
        "created_at",
    )

    list_filter = (
        "contact_status",
        "serviceType",
        "assigned_user",
        "reached_out_whatsapp",
        "reached_out_email",
        "created_at",
        "survey_date",
    )

    search_fields = (
        "fullName",
        "phoneNumber",
        "email",
        "message",
        "note",
        "contact_status_note",
    )

    readonly_fields = ("created_at",)

    ordering = ("-created_at",)

    fieldsets = (
        ("Basic Information", {
            "fields": (
                "fullName",
                "phoneNumber",
                "email",
                "serviceType",
                "message",
            )
        }),
        ("Assignment & Status", {
            "fields": (
                "assigned_user",
                "contact_status",
                "contact_status_note",
            )
        }),
        ("Follow-up Tracking", {
            "fields": (
                "reached_out_whatsapp",
                "reached_out_email",
                "survey_date",
            )
        }),
        ("Technical Details", {
            "classes": ("collapse",),
            "fields": (
                "recaptchaToken",
                "refererUrl",
                "submittedUrl",
            )
        }),
        ("Notes & Meta", {
            "fields": (
                "note",
                "created_at",
            )
        }),
    )
