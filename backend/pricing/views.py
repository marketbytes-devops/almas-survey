from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import (
    Price,
    AdditionalService,
    QuotationAdditionalCharge,
    InclusionExclusion,
    InsurancePlan,
    PaymentTerm,
    QuoteNote,
    TruckType,
    Service,
)
from django.shortcuts import get_object_or_404
from .serializers import (
    PriceSerializer,
    AdditionalServiceSerializer,
    SurveyAdditionalServiceSerializer,
    QuotationAdditionalChargeSerializer,
    InclusionExclusionSerializer,
    InsurancePlanSerializer,
    PaymentTermSerializer,
    QuoteNoteSerializer,
    TruckTypeSerializer,
    ServiceSerializer,
)
from django.db import transaction
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from survey.models import SurveyAdditionalService
from rest_framework import viewsets, filters


class InclusionExclusionViewSet(viewsets.ModelViewSet):
    queryset = InclusionExclusion.objects.filter(is_active=True).order_by("text")
    serializer_class = InclusionExclusionSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        item_type = self.request.query_params.get("type")
        city = self.request.query_params.get("city")

        if item_type in ["include", "exclude"]:
            qs = qs.filter(type=item_type)
        if city:
            qs = qs.filter(city=city)
        return qs

    def create(self, request, *args, **kwargs):
        is_list = isinstance(request.data, list)
        many = is_list

        serializer = self.get_serializer(data=request.data, many=many)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data, status=status.HTTP_201_CREATED, headers=headers
        )


@api_view(["GET", "POST"])
def additional_services_list_create(request):
    if request.method == "GET":
        services = AdditionalService.objects.all()
        serializer = AdditionalServiceSerializer(services, many=True)
        return Response(serializer.data)
    elif request.method == "POST":
        data = request.data
        if isinstance(data, list):
            response_data = []
            for item in data:
                obj_id = item.get("id")
                if obj_id:
                    try:
                        obj = AdditionalService.objects.get(id=obj_id)
                        serializer = AdditionalServiceSerializer(
                            obj, data=item, partial=True
                        )
                    except AdditionalService.DoesNotExist:
                        serializer = AdditionalServiceSerializer(data=item)
                else:
                    serializer = AdditionalServiceSerializer(data=item)

                if serializer.is_valid():
                    serializer.save()
                    response_data.append(serializer.data)
                else:
                    return Response(
                        serializer.errors, status=status.HTTP_400_BAD_REQUEST
                    )
            return Response(response_data, status=status.HTTP_200_OK)
        else:
            serializer = AdditionalServiceSerializer(data=data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PriceViewSet(viewsets.ModelViewSet):
    queryset = Price.objects.filter(is_active=True).order_by("min_volume")
    serializer_class = PriceSerializer

    def create(self, request):
        if isinstance(request.data, list):
            serializer = self.get_serializer(data=request.data, many=True)
        else:
            serializer = self.get_serializer(data=request.data)

        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get"])
    def active(self, request):
        """GET /api/price/active/ → Get current pricing table with filters"""
        pricing_city = request.query_params.get("pricing_city")
        move_type_id = request.query_params.get("move_type")
        qs = self.get_queryset()

        if pricing_city:
            qs = qs.filter(pricing_city=pricing_city)
        if move_type_id:
            qs = qs.filter(move_type_id=move_type_id)

        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def cities(self, request):
        """GET /api/price/cities/ → Get available cities for Qatar"""
        qatar_cities = [
            "Doha",
            "Al Rayyan",
            "Al Wakrah",
            "Al Khor",
            "Umm Salal",
            "Al Daayen",
            "Mesaieed",
            "Al Shahaniya",
            "Al Ruwais",
            "Dukhan",
        ]
        return Response({"cities": qatar_cities})

    @action(detail=False, methods=["post", "patch"], url_path="bulk-update")
    def bulk_update(self, request):
        """
        POST → Create new pricing entries
        PATCH → Update existing entries (by ID)
        """
        if not isinstance(request.data, list):
            return Response(
                {"detail": "Expected a list of pricing entries"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            pricing_city = request.data[0].get("pricing_city") if request.data else None
            move_type_id = request.data[0].get("move_type") if request.data else None

            with transaction.atomic():
                if request.method == "POST":
                    filters = {"pricing_country": "Qatar", "is_active": True}
                    if pricing_city:
                        filters["pricing_city"] = pricing_city
                    if move_type_id:
                        filters["move_type_id"] = move_type_id

                    Price.objects.filter(**filters).update(is_active=False)

                to_create = []
                to_update = []

                for item in request.data:
                    if "id" not in item or not item["id"]:
                        to_create.append(item)
                    else:
                        to_update.append(item)

                response_data = []

                if to_create:
                    create_serializer = self.get_serializer(data=to_create, many=True)
                    create_serializer.is_valid(raise_exception=True)
                    created_instances = create_serializer.save()
                    response_data.extend(create_serializer.data)

                if to_update and request.method in ["PATCH", "PUT"]:
                    for item in to_update:
                        try:
                            instance = Price.objects.get(id=item["id"])
                            serializer = self.get_serializer(
                                instance, data=item, partial=True
                            )
                            serializer.is_valid(raise_exception=True)
                            updated_instance = serializer.save()
                            response_data.append(serializer.data)
                        except Price.DoesNotExist:
                            continue

                return Response(
                    {
                        "detail": f"Processed {len(to_create)} created, {len(to_update)} updated",
                        "data": response_data,
                    },
                    status=status.HTTP_200_OK,
                )

        except Exception as e:
            return Response(
                {"detail": f"Error processing bulk update: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=False, methods=["delete"], url_path="bulk-delete")
    def bulk_delete(self, request):
        """DELETE /api/price/bulk-delete/?ids=1,2,3"""
        ids = request.query_params.get("ids", "")
        if not ids:
            return Response(
                {"detail": "Provide comma-separated IDs in 'ids' parameter"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            id_list = [int(x.strip()) for x in ids.split(",") if x.strip().isdigit()]
            deleted_count, _ = Price.objects.filter(id__in=id_list).delete()

            return Response(
                {"detail": f"Deleted {deleted_count} pricing entries"},
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {"detail": f"Error deleting entries: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class SurveyAdditionalServiceViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SurveyAdditionalService.objects.all().order_by("name")
    serializer_class = SurveyAdditionalServiceSerializer


class QuotationAdditionalChargeViewSet(viewsets.ModelViewSet):
    queryset = QuotationAdditionalCharge.objects.select_related(
        "service", "currency"
    ).all()
    serializer_class = QuotationAdditionalChargeSerializer

    def create(self, request, *args, **kwargs):
        if isinstance(request.data, list):
            serializer = self.get_serializer(data=request.data, many=True)
        else:
            serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=201)


class InsurancePlanViewSet(viewsets.ModelViewSet):
    queryset = InsurancePlan.objects.all()
    serializer_class = InsurancePlanSerializer

    def get_queryset(self):
        return InsurancePlan.objects.all().order_by("order", "name")

    @action(detail=True, methods=["post"])
    def toggle_active(self, request, pk=None):
        plan = self.get_object()
        plan.is_active = not plan.is_active
        plan.save()
        return Response({"status": "toggled", "is_active": plan.is_active})

    @action(detail=True, methods=["post"])
    def set_default(self, request, pk=None):
        InsurancePlan.objects.filter(is_default=True).update(is_default=False)
        plan = self.get_object()
        plan.is_default = True
        plan.save()
        return Response({"status": "default set"})


class PaymentTermViewSet(viewsets.ModelViewSet):
    queryset = PaymentTerm.objects.all()
    serializer_class = PaymentTermSerializer

    @action(detail=True, methods=["post"])
    def toggle_active(self, request, pk=None):
        term = self.get_object()
        term.is_active = not term.is_active
        term.save()
        return Response({"status": "toggled", "is_active": term.is_active})

    @action(detail=True, methods=["post"])
    def set_default(self, request, pk=None):
        PaymentTerm.objects.filter(is_default=True).update(is_default=False)
        term = self.get_object()
        term.is_default = True
        term.save()
        return Response({"status": "default set"})


class QuoteNoteViewSet(viewsets.ModelViewSet):
    queryset = QuoteNote.objects.all()
    serializer_class = QuoteNoteSerializer

    @action(detail=True, methods=["post"])
    def toggle_active(self, request, pk=None):
        note = self.get_object()
        note.is_active = not note.is_active
        note.save()
        return Response({"status": "toggled", "is_active": note.is_active})


class TruckTypeViewSet(viewsets.ModelViewSet):
    queryset = TruckType.objects.all()
    serializer_class = TruckTypeSerializer

    @action(detail=True, methods=["post"])
    def toggle_active(self, request, pk=None):
        truck = self.get_object()
        truck.is_active = not truck.is_active
        truck.save()
        return Response({"is_active": truck.is_active})

    @action(detail=True, methods=["post"])
    def set_default(self, request, pk=None):
        TruckType.objects.filter(is_default=True).update(is_default=False)
        truck = self.get_object()
        truck.is_default = True
        truck.save()
        return Response({"status": "default set"})



class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.filter(is_active=True)
    serializer_class = ServiceSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name"]
    ordering_fields = ["name", "created_at"]
    ordering = ["name"]

    def get_queryset(self):
        if self.request.user.is_staff:
            return Service.objects.all()
        return Service.objects.filter(is_active=True)

    @action(detail=False, methods=["patch"], url_path="bulk-update")
    def bulk_update(self, request):
        return Response({"detail": "Not implemented"}, status=400)
