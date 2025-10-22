from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CustomerTypeViewSet, ServiceTypeViewSet, VolumeUnitViewSet, WeightUnitViewSet, PackingTypeViewSet, ManpowerViewSet, HandymanViewSet, VehicleTypeViewSet, PetTypeViewSet, RoomViewSet, ItemViewSet, CurrencyViewSet, TaxViewSet

router = DefaultRouter()
router.register(r'customer-types', CustomerTypeViewSet)
router.register(r'service-types', ServiceTypeViewSet)
router.register(r'volume-units', VolumeUnitViewSet)
router.register(r'weight-units', WeightUnitViewSet)
router.register(r'packing-types', PackingTypeViewSet)
router.register(r'manpower', ManpowerViewSet)
router.register(r'handyman', HandymanViewSet)
router.register(r'vehicle-types', VehicleTypeViewSet)
router.register(r'pet-types', PetTypeViewSet)
router.register(r'rooms', RoomViewSet)
router.register(r'items', ItemViewSet)
router.register(r'currencies', CurrencyViewSet)
router.register(r'taxes', TaxViewSet)

urlpatterns = [
    path('', include(router.urls)),
]