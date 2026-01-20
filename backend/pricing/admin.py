from django.contrib import admin
from .models import (
    Service,
    Price,
    InclusionExclusion,
    AdditionalService,
    PaymentTerm,
    InsurancePlan,
    QuoteNote,
    TruckType,
)

admin.site.register(Service)
admin.site.register(Price)
admin.site.register(InclusionExclusion)
admin.site.register(AdditionalService)
admin.site.register(PaymentTerm)
admin.site.register(InsurancePlan)
admin.site.register(QuoteNote)
admin.site.register(TruckType)
