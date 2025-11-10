# price/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PriceViewSet

router = DefaultRouter()
router.register(r'', PriceViewSet, basename='price')

urlpatterns = [
    path('price/', include(router.urls)),
]