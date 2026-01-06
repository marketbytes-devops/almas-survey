from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r"customer-types", views.CustomerTypeViewSet)
router.register(r"service-types", views.ServiceTypeViewSet)
router.register(r"volume-units", views.VolumeUnitViewSet)
router.register(r"weight-units", views.WeightUnitViewSet)
router.register(r"packing-types", views.PackingTypeViewSet)
router.register(r"manpower", views.ManpowerViewSet)
router.register(r"handyman", views.HandymanViewSet)
router.register(r"vehicle-types", views.VehicleTypeViewSet)
router.register(r"pet-types", views.PetTypeViewSet)
router.register(r"rooms", views.RoomViewSet)
router.register(r"items", views.ItemViewSet)
router.register(r"currencies", views.CurrencyViewSet)
router.register(r"taxes", views.TaxViewSet)
router.register(r"hub", views.HubViewSet)
router.register(r"move-types", views.MoveTypeViewSet)
router.register(r"tariff-types", views.TariffTypeViewSet)
router.register(r"survey-additional-services", views.SurveyAdditionalServiceViewSet)
router.register(r"labours", views.LabourViewSet)
router.register(r"trucks", views.TruckViewSet)
router.register(r"materials", views.MaterialViewSet)

urlpatterns = [
    path("", include(router.urls)),
]
