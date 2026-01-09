from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'', views.QuotationViewSet, basename='quotation')

urlpatterns = [
    path('quotation-create', include(router.urls)), 
]