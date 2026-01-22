from rest_framework import viewsets, permissions
from authapp.permissions import HasPagePermission
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
    Labour,
    Material,
    MaterialPurchase,
    InventoryLog,
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
    LabourSerializer,
    MaterialSerializer,
    MaterialPurchaseSerializer,
    InventoryLogSerializer,
)


class CustomerTypeViewSet(viewsets.ModelViewSet):
    queryset = CustomerType.objects.all()
    serializer_class = CustomerTypeSerializer
    permission_classes = [HasPagePermission("types")]


class ServiceTypeViewSet(viewsets.ModelViewSet):
    queryset = ServiceType.objects.all()
    serializer_class = ServiceTypeSerializer
    permission_classes = [HasPagePermission("types")]


class VolumeUnitViewSet(viewsets.ModelViewSet):
    queryset = VolumeUnit.objects.all()
    serializer_class = VolumeUnitSerializer
    permission_classes = [HasPagePermission("units")]


class WeightUnitViewSet(viewsets.ModelViewSet):
    queryset = WeightUnit.objects.all()
    serializer_class = WeightUnitSerializer
    permission_classes = [HasPagePermission("units")]


class PackingTypeViewSet(viewsets.ModelViewSet):
    queryset = PackingType.objects.all()
    serializer_class = PackingTypeSerializer
    permission_classes = [HasPagePermission("types")]


class ManpowerViewSet(viewsets.ModelViewSet):
    queryset = Manpower.objects.all()
    serializer_class = ManpowerSerializer
    permission_classes = [HasPagePermission("manpower")]


class HandymanViewSet(viewsets.ModelViewSet):
    queryset = Handyman.objects.all()
    serializer_class = HandymanSerializer
    permission_classes = [HasPagePermission("handyman")]


class VehicleTypeViewSet(viewsets.ModelViewSet):
    queryset = VehicleType.objects.all()
    serializer_class = VehicleTypeSerializer
    permission_classes = [HasPagePermission("types")]


class PetTypeViewSet(viewsets.ModelViewSet):
    queryset = PetType.objects.all()
    serializer_class = PetTypeSerializer
    permission_classes = [HasPagePermission("types")]


class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    permission_classes = [HasPagePermission("room")]


class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer
    permission_classes = [HasPagePermission("room")]

    def get_queryset(self):
        queryset = super().get_queryset()
        room_id = self.request.query_params.get("room_id")
        if room_id:
            queryset = queryset.filter(room_id=room_id)
        return queryset.select_related('room')


class CurrencyViewSet(viewsets.ModelViewSet):
    queryset = Currency.objects.all()
    serializer_class = CurrencySerializer
    permission_classes = [HasPagePermission("currency")]


class TaxViewSet(viewsets.ModelViewSet):
    queryset = Tax.objects.all()
    serializer_class = TaxSerializer
    permission_classes = [HasPagePermission("tax")]


class HubViewSet(viewsets.ModelViewSet):
    queryset = Hub.objects.all()
    serializer_class = HubSerializer
    permission_classes = [HasPagePermission("types")]


class MoveTypeViewSet(viewsets.ModelViewSet):
    queryset = MoveType.objects.all()
    serializer_class = MoveTypeSerializer
    permission_classes = [HasPagePermission("types")]


class TariffTypeViewSet(viewsets.ModelViewSet):
    queryset = TariffType.objects.all()
    serializer_class = TariffTypeSerializer
    permission_classes = [HasPagePermission("types")]


class SurveyAdditionalServiceViewSet(viewsets.ModelViewSet):
    queryset = SurveyAdditionalService.objects.all()
    serializer_class = SurveyAdditionalServiceSerializer
    permission_classes = [HasPagePermission("additional-services")]


class LabourViewSet(viewsets.ModelViewSet):
    queryset = Labour.objects.all()
    serializer_class = LabourSerializer
    permission_classes = [HasPagePermission("labours")]




class MaterialViewSet(viewsets.ModelViewSet):
    queryset = Material.objects.all()
    serializer_class = MaterialSerializer
    permission_classes = [HasPagePermission("inventory")]


class MaterialPurchaseViewSet(viewsets.ModelViewSet):
    queryset = MaterialPurchase.objects.all().order_by('-purchase_date')
    serializer_class = MaterialPurchaseSerializer
    permission_classes = [HasPagePermission("inventory")]


class InventoryLogViewSet(viewsets.ModelViewSet):
    queryset = InventoryLog.objects.all().order_by('-date')
    serializer_class = InventoryLogSerializer
    permission_classes = [HasPagePermission("inventory")]