from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import JobViewSet, StatusUpdateViewSet

router = DefaultRouter()
router.register(r'jobs', JobViewSet, basename='job')
router.register(r'status-updates', StatusUpdateViewSet, basename='status-update') 

urlpatterns = [
    path('', include(router.urls)),
]