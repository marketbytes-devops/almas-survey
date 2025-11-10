from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Price
from .serializers import PriceSerializer

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
        """GET /api/price/active/ → Get current pricing table"""
        prices = self.get_queryset()
        serializer = self.get_serializer(prices, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        hub_id = request.query_params.get('hub')
        move_type_id = request.query_params.get('move_type')
        qs = self.get_queryset()
        if hub_id:
            qs = qs.filter(hub_id=hub_id)
        if move_type_id:
            qs = qs.filter(move_type_id=move_type_id)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)