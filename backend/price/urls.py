from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PriceViewSet, additional_services_list_create

router = DefaultRouter()
router.register(r"", PriceViewSet, basename="price")

urlpatterns = [
    path("price/", include(router.urls)),
    path('additional-services/', additional_services_list_create, name='additional-services'),
]
