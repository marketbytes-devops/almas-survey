# pricing/urls.py  ← REPLACE YOUR CURRENT FILE WITH THIS

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PriceViewSet,
    SurveyAdditionalServiceViewSet,        # ← NEW: for dropdown
    QuotationAdditionalChargeViewSet,InclusionExclusionViewSet,InsurancePlanViewSet,PaymentTermViewSet,QuoteNoteViewSet,TruckTypeViewSet,SurveyRemarkViewSet
)

# Main router
router = DefaultRouter()
router.register(r'price', PriceViewSet, basename='price')  # Keep your existing pricing

# New endpoints for Additional Services (dropdown + charges)
router.register(r'survey-additional-services', SurveyAdditionalServiceViewSet, basename='survey-additional-service')
router.register(r'quotation-additional-charges', QuotationAdditionalChargeViewSet, basename='quotation-additional-charge')
router.register(r'inclusion-exclusion', InclusionExclusionViewSet, basename='inclusionexclusion')
router.register(r'insurance-plans', InsurancePlanViewSet)
router.register(r'payment-terms', PaymentTermViewSet)
router.register(r'quote-notes', QuoteNoteViewSet)
router.register(r'truck-types', TruckTypeViewSet)#
router.register(r'survey-remarks', SurveyRemarkViewSet)

urlpatterns = [
    # This includes ALL routes: price/, survey-additional-services/, quotation-additional-charges/
    path('', include(router.urls)),
]
