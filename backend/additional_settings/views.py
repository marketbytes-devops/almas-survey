from rest_framework import viewsets
from rest_framework import viewsets, permissions
from .models import (
    CustomerType,
    ServiceType,
    VolumeUnit,
    WeightUnit,
    PackingType,
    Manpower,
    Handyman,
    VehicleType,
    PetType,
    Room,
    Item,
    Currency,
    Tax,
    Hub,
    MoveType,
    TariffType,
    SurveyAdditionalService,
)
from .serializers import (
    CustomerTypeSerializer,
    ServiceTypeSerializer,
    VolumeUnitSerializer,
    WeightUnitSerializer,
    PackingTypeSerializer,
    ManpowerSerializer,
    HandymanSerializer,
    VehicleTypeSerializer,
    PetTypeSerializer,
    RoomSerializer,
    ItemSerializer,
    CurrencySerializer,
    TaxSerializer,
    HubSerializer,
    MoveTypeSerializer,
    TariffTypeSerializer,
    SurveyAdditionalServiceSerializer,
)


class CustomerTypeViewSet(viewsets.ModelViewSet):
    queryset = CustomerType.objects.all()
    serializer_class = CustomerTypeSerializer
    permission_classes = [permissions.AllowAny]


class ServiceTypeViewSet(viewsets.ModelViewSet):
    queryset = ServiceType.objects.all()
    serializer_class = ServiceTypeSerializer
    permission_classes = [permissions.AllowAny]


class VolumeUnitViewSet(viewsets.ModelViewSet):
    queryset = VolumeUnit.objects.all()
    serializer_class = VolumeUnitSerializer
    permission_classes = [permissions.AllowAny]


class WeightUnitViewSet(viewsets.ModelViewSet):
    queryset = WeightUnit.objects.all()
    serializer_class = WeightUnitSerializer
    permission_classes = [permissions.AllowAny]


class PackingTypeViewSet(viewsets.ModelViewSet):
    queryset = PackingType.objects.all()
    serializer_class = PackingTypeSerializer
    permission_classes = [permissions.AllowAny]


class ManpowerViewSet(viewsets.ModelViewSet):
    queryset = Manpower.objects.all()
    serializer_class = ManpowerSerializer
    permission_classes = [permissions.AllowAny]


class HandymanViewSet(viewsets.ModelViewSet):
    queryset = Handyman.objects.all()
    serializer_class = HandymanSerializer
    permission_classes = [permissions.AllowAny]


class VehicleTypeViewSet(viewsets.ModelViewSet):
    queryset = VehicleType.objects.all()
    serializer_class = VehicleTypeSerializer
    permission_classes = [permissions.AllowAny]


class PetTypeViewSet(viewsets.ModelViewSet):
    queryset = PetType.objects.all()
    serializer_class = PetTypeSerializer
    permission_classes = [permissions.AllowAny]


class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    permission_classes = [permissions.AllowAny]


class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = super().get_queryset()
        room_id = self.request.query_params.get("room_id")
        if room_id:
            queryset = queryset.filter(room_id=room_id)
        return queryset.select_related('room')


class CurrencyViewSet(viewsets.ModelViewSet):
    queryset = Currency.objects.all()
    serializer_class = CurrencySerializer
    permission_classes = [permissions.AllowAny]


class TaxViewSet(viewsets.ModelViewSet):
    queryset = Tax.objects.all()
    serializer_class = TaxSerializer
    permission_classes = [permissions.AllowAny]


class HubViewSet(viewsets.ModelViewSet):
    queryset = Hub.objects.all()
    serializer_class = HubSerializer
    permission_classes = [permissions.AllowAny]


class MoveTypeViewSet(viewsets.ModelViewSet):
    queryset = MoveType.objects.all()
    serializer_class = MoveTypeSerializer
    permission_classes = [permissions.AllowAny]


class TariffTypeViewSet(viewsets.ModelViewSet):
    queryset = TariffType.objects.all()
    serializer_class = TariffTypeSerializer
    permission_classes = [permissions.AllowAny]


class SurveyAdditionalServiceViewSet(viewsets.ModelViewSet):
    queryset = SurveyAdditionalService.objects.all()
    serializer_class = SurveyAdditionalServiceSerializer
    permission_classes = [permissions.AllowAny]
