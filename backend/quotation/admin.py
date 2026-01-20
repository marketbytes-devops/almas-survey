from django.contrib import admin
from .models import Quotation, QuotationRemark

@admin.register(QuotationRemark)
class QuotationRemarkAdmin(admin.ModelAdmin):
    list_display = ("description", "is_active", "created_at")
    search_fields = ("description",)

@admin.register(Quotation)
class QuotationAdmin(admin.ModelAdmin):
    list_display = ("quotation_id", "survey", "date", "final_amount")
    search_fields = ("quotation_id", "survey__survey_id")
