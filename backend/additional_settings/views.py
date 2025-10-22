from rest_framework import viewsets
from .models import CustomerType, ServiceType, VolumeUnit, WeightUnit, PackingType, Manpower, Handyman, VehicleType, PetType, Room, Item, Currency, Tax
from .serializers import CustomerTypeSerializer, ServiceTypeSerializer, VolumeUnitSerializer, WeightUnitSerializer, PackingTypeSerializer, ManpowerSerializer, HandymanSerializer, VehicleTypeSerializer, PetTypeSerializer, RoomSerializer, ItemSerializer, CurrencySerializer, TaxSerializer

class CustomerTypeViewSet(viewsets.ModelViewSet):
    queryset = CustomerType.objects.all()
    serializer_class = CustomerTypeSerializer

class ServiceTypeViewSet(viewsets.ModelViewSet):
    queryset = ServiceType.objects.all()
    serializer_class = ServiceTypeSerializer

class VolumeUnitViewSet(viewsets.ModelViewSet):
    queryset = VolumeUnit.objects.all()
    serializer_class = VolumeUnitSerializer

class WeightUnitViewSet(viewsets.ModelViewSet):
    queryset = WeightUnit.objects.all()
    serializer_class = WeightUnitSerializer

class PackingTypeViewSet(viewsets.ModelViewSet):
    queryset = PackingType.objects.all()
    serializer_class = PackingTypeSerializer

class ManpowerViewSet(viewsets.ModelViewSet):
    queryset = Manpower.objects.all()
    serializer_class = ManpowerSerializer

class HandymanViewSet(viewsets.ModelViewSet):
    queryset = Handyman.objects.all()
    serializer_class = HandymanSerializer

class VehicleTypeViewSet(viewsets.ModelViewSet):
    queryset = VehicleType.objects.all()
    serializer_class = VehicleTypeSerializer

class PetTypeViewSet(viewsets.ModelViewSet):
    queryset = PetType.objects.all()
    serializer_class = PetTypeSerializer

class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer

class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        room_id = self.request.query_params.get('room_id')
        if room_id:
            queryset = queryset.filter(room_id=room_id)
        return queryset

class CurrencyViewSet(viewsets.ModelViewSet):
    queryset = Currency.objects.all()
    serializer_class = CurrencySerializer

class TaxViewSet(viewsets.ModelViewSet):
    queryset = Tax.objects.all()
    serializer_class = TaxSerializer