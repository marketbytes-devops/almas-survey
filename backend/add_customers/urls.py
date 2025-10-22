from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AddCustomerViewSet

router = DefaultRouter()
router.register(r'add-customers', AddCustomerViewSet)

urlpatterns = [
    path('', include(router.urls)),
]