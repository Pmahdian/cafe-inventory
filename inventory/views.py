from datetime import date
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Ingredient, Product, StockEntry, Sale
from .serializers import (
    IngredientSerializer, ProductSerializer,
    StockEntrySerializer, SaleSerializer,
    SaleCreateSerializer, StockEntryCreateSerializer,
)
from . import services


class IngredientViewSet(viewsets.ModelViewSet):
    queryset = Ingredient.objects.all().order_by('name')
    serializer_class = IngredientSerializer

    @action(detail=False, methods=['get'], url_path='units')
    def units(self, request):
        """Return available units so frontend doesn't hardcode them."""
        return Response([
            {'value': v, 'label': l}
            for v, l in Ingredient.UNIT_CHOICES
        ])


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().prefetch_related('recipe_items__ingredient')
    serializer_class = ProductSerializer


class StockEntryViewSet(viewsets.ModelViewSet):
    queryset = StockEntry.objects.all().select_related('ingredient')
    serializer_class = StockEntrySerializer

    def create(self, request):
        ser = StockEntryCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        try:
            entry = services.commit_stock_entry(
                ingredient_id=data['ingredient_id'],
                amount=data['amount'],
                target_date=data.get('date') or date.today(),
                note=data.get('note', ''),
            )
        except Ingredient.DoesNotExist:
            return Response(
                {'error': f'Ingredient with id {data["ingredient_id"]} does not exist.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            StockEntrySerializer(entry).data,
            status=status.HTTP_201_CREATED,
        )


class SaleViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.all().select_related('product')
    serializer_class = SaleSerializer

    def create(self, request):
        ser = SaleCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        try:
            sale = services.commit_sale(
                product_id=data['product_id'],
                quantity=data['quantity'],
                target_date=data.get('date') or date.today(),
            )
        except Product.DoesNotExist:
            return Response(
                {'error': f'Product with id {data["product_id"]} does not exist.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            SaleSerializer(sale).data,
            status=status.HTTP_201_CREATED,
        )

class ReportViewSet(viewsets.ViewSet):
    """Read-only reports. No CRUD, just custom actions."""

    @action(detail=False, methods=['get'], url_path='daily')
    def daily(self, request):
        """
        GET /api/reports/daily/?date=2026-10-05
        Returns the daily closing report (ledger-based).
        """
        date_str = request.query_params.get('date')
        if date_str:
            try:
                target = date.fromisoformat(date_str)
            except ValueError:
                return Response(
                    {'error': 'Invalid date format. Use YYYY-MM-DD.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            target = date.today()

        return Response({
            'date': target.isoformat(),
            'items': services.get_daily_report(target),
        })