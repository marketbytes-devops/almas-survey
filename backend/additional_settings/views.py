from rest_framework import viewsets
from .models import CustomerType, ServiceType, VolumeUnit, WeightUnit, PackingType, Manpower, Handyman, VehicleType, PetType, Room, Item, Currency, Tax, Hub, Type, Tariff, TariffRange, Team
from .serializers import CustomerTypeSerializer, ServiceTypeSerializer, VolumeUnitSerializer, WeightUnitSerializer, PackingTypeSerializer, ManpowerSerializer, HandymanSerializer, VehicleTypeSerializer, PetTypeSerializer, RoomSerializer, ItemSerializer, CurrencySerializer, TaxSerializer, HubSerializer, TypeSerializer, TariffSerializer, TariffRangeSerializer, TeamSerializer

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

# NEW VIEWSETS FOR ADDITIONAL SETTINGS

class HubViewSet(viewsets.ModelViewSet):
    queryset = Hub.objects.all()
    serializer_class = HubSerializer

class TypeViewSet(viewsets.ModelViewSet):
    queryset = Type.objects.all()
    serializer_class = TypeSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        hub_id = self.request.query_params.get('hub_id')
        category = self.request.query_params.get('category')
        
        if hub_id:
            queryset = queryset.filter(hub_id=hub_id)
        if category:
            queryset = queryset.filter(category=category)
        return queryset

class TariffViewSet(viewsets.ModelViewSet):
    queryset = Tariff.objects.all()
    serializer_class = TariffSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        hub_id = self.request.query_params.get('hub_id')
        type_id = self.request.query_params.get('type_id')
        
        if hub_id:
            queryset = queryset.filter(hub_id=hub_id)
        if type_id:
            queryset = queryset.filter(type_id=type_id)
        return queryset

class TariffRangeViewSet(viewsets.ModelViewSet):
    queryset = TariffRange.objects.all()
    serializer_class = TariffRangeSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        tariff_id = self.request.query_params.get('tariff_id')
        if tariff_id:
            queryset = queryset.filter(tariff_id=tariff_id)
        return queryset

class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset