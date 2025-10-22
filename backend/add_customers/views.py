from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from .models import AddCustomer
from .serializers import AddCustomerSerializer

class AddCustomerViewSet(viewsets.ModelViewSet):
    queryset = AddCustomer.objects.all()
    serializer_class = AddCustomerSerializer
    permission_classes = [AllowAny]