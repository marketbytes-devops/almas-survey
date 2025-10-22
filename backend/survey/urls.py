from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'surveys', views.SurveyViewSet, basename='survey')
router.register(r'destination-addresses', views.DestinationAddressViewSet, basename='destinationaddress')
router.register(r'articles', views.ArticleViewSet, basename='article')
router.register(r'vehicles', views.VehicleViewSet, basename='vehicle')
router.register(r'pets', views.PetViewSet, basename='pet')

urlpatterns = [
    path('', include(router.urls)),
]