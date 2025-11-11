from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Price
from .serializers import PriceSerializer
from django.db import transaction

class PriceViewSet(viewsets.ModelViewSet):
    queryset = Price.objects.filter(is_active=True).order_by('min_volume')
    serializer_class = PriceSerializer

    def create(self, request):
        if isinstance(request.data, list):
            serializer = self.get_serializer(data=request.data, many=True)
        else:
            serializer = self.get_serializer(data=request.data)
        
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def active(self, request):
        """GET /api/price/active/ → Get current pricing table with filters"""
        hub_id = request.query_params.get('hub')
        move_type_id = request.query_params.get('move_type')
        qs = self.get_queryset()
        
        if hub_id:
            qs = qs.filter(hub_id=hub_id)
        if move_type_id:
            qs = qs.filter(move_type_id=move_type_id)
        
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post', 'patch'], url_path='bulk-update')
    def bulk_update(self, request):
        """
        POST  → Create new pricing entries
        PATCH → Update existing entries (by ID)
        """
        if not isinstance(request.data, list):
            return Response(
                {"detail": "Expected a list of pricing entries"},
                status=status.HTTP_400_BAD_REQUEST
            )

        hub_id = request.data[0].get('hub') if request.data else None
        move_type_id = request.data[0].get('move_type') if request.data else None

        with transaction.atomic():
            if request.method == 'POST':
                filters = {}
                if hub_id:
                    filters['hub_id'] = hub_id
                if move_type_id:
                    filters['move_type_id'] = move_type_id
                Price.objects.filter(**filters, is_active=True).update(is_active=False)

            to_create = [item for item in request.data if 'id' not in item or not item['id']]
            to_update = [item for item in request.data if 'id' in item and item['id']]

            response_data = []

            if to_create:
                create_serializer = self.get_serializer(data=to_create, many=True)
                create_serializer.is_valid(raise_exception=True)
                created = create_serializer.save()
                response_data.extend(create_serializer.data)

            if to_update and request.method in ['PATCH', 'PUT']:
                updated_instances = []
                update_serializer_data = []
                for item in to_update:
                    try:
                        instance = Price.objects.get(id=item['id'], is_active=True)
                        serializer = self.get_serializer(instance, data=item, partial=True)
                        serializer.is_valid(raise_exception=True)
                        updated_instances.append(serializer.save())
                        update_serializer_data.append(serializer.data)
                    except Price.DoesNotExist:
                        continue 
                response_data.extend(update_serializer_data)

            return Response(
                {
                    "detail": f"Processed {len(to_create)} created, {len(to_update)} updated",
                    "data": response_data
                },
                status=status.HTTP_200_OK
            )

    @action(detail=False, methods=['delete'], url_path='bulk-delete')
    def bulk_delete(self, request):
        """DELETE /api/price/bulk-delete/?ids=1,2,3"""
        ids = request.query_params.get('ids', '')
        if not ids:
            return Response(
                {"detail": "Provide comma-separated IDs in 'ids' parameter"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        id_list = [int(x.strip()) for x in ids.split(',') if x.strip().isdigit()]
        deleted_count, _ = Price.objects.filter(id__in=id_list).delete()
        
        return Response(
            {"detail": f"Deleted {deleted_count} pricing entries"},
            status=status.HTTP_200_OK
        )