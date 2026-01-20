from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
 
router = DefaultRouter()
router.register(r'quotation-remarks', views.QuotationRemarkViewSet, basename='quotation-remark')
router.register(r'quotation-create', views.QuotationViewSet, basename='quotation')

urlpatterns = [
    path('', include(router.urls)),
]