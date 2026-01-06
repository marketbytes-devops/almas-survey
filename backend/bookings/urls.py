from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .import views

router = DefaultRouter()
router.register(r'bookings', views.BookingViewSet)
router.register(r'booking-labours', views.BookingLabourViewSet)
router.register(r'booking-trucks', views.BookingTruckViewSet)
router.register(r'booking-materials', views.BookingMaterialViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
