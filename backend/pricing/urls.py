from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PriceViewSet,
    SurveyAdditionalServiceViewSet,     
    QuotationAdditionalChargeViewSet,InclusionExclusionViewSet,InsurancePlanViewSet,PaymentTermViewSet,QuoteNoteViewSet,TruckTypeViewSet,ServiceViewSet
)

router = DefaultRouter()
router.register(r'price', PriceViewSet, basename='price') 
router.register(r'survey-additional-services', SurveyAdditionalServiceViewSet, basename='survey-additional-service')
router.register(r'quotation-additional-charges', QuotationAdditionalChargeViewSet, basename='quotation-additional-charge')
router.register(r'inclusion-exclusion', InclusionExclusionViewSet, basename='inclusionexclusion')
router.register(r'insurance-plans', InsurancePlanViewSet)
router.register(r'payment-terms', PaymentTermViewSet)
router.register(r'quote-notes', QuoteNoteViewSet)
router.register(r'truck-types', TruckTypeViewSet)
router.register(r'services', ServiceViewSet)


urlpatterns = [
    path('', include(router.urls)),
]