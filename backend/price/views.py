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

    # 🔥 NEW: Bulk update endpoint
    @action(detail=False, methods=['post'], url_path='bulk-update')
    def bulk_update(self, request):
        """
        POST /api/price/bulk-update/
        Saves/updates entire pricing table at once
        
        Expected payload:
        [
            {
                "min_volume": 0.01,
                "max_volume": 10.00,
                "rate": 625.00,
                "rate_type": "variable",
                "hub": 1,  # optional
                "move_type": 2,  # optional
                "currency": "QAR"
            },
            ...
        ]
        """
        if not isinstance(request.data, list):
            return Response(
                {"detail": "Expected a list of pricing entries"},
                status=status.HTTP_400_BAD_REQUEST
            )

        hub_id = request.data[0].get('hub') if request.data else None
        move_type_id = request.data[0].get('move_type') if request.data else None

        with transaction.atomic():
            # Option 1: Delete old prices for this hub/move_type and create new ones
            filters = {}
            if hub_id:
                filters['hub_id'] = hub_id
            if move_type_id:
                filters['move_type_id'] = move_type_id
            
            # Deactivate old prices (safer than deleting)
            Price.objects.filter(**filters, is_active=True).update(is_active=False)
            
            # Create new prices
            serializer = self.get_serializer(data=request.data, many=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()

        return Response(
            {
                "detail": f"Successfully updated {len(request.data)} pricing entries",
                "data": serializer.data
            },
            status=status.HTTP_200_OK
        )

    # 🔥 NEW: Delete specific pricing range
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