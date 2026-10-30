from datetime import date
from django.db import transaction
from django.db.models import F, Sum
from django.utils import timezone

from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response

from .models import Ingredient, Product, StockEntry, Sale, Shift, Category
from .serializers import (
    IngredientSerializer, ProductSerializer,
    StockEntrySerializer, SaleSerializer,
    SaleCreateSerializer, StockEntryCreateSerializer,
    CategorySerializer
)
from . import services




class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


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


    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        """وقتی فاکتور حذف میشه، مواد اولیه به انبار برمیگردن"""
        instance = self.get_object()
        product = instance.product
        qty = instance.quantity
        
        # برگرداندن به انبار
        for item in product.recipe_items.all():
            Ingredient.objects.filter(id=item.ingredient_id).update(
                current_stock=F('current_stock') + (item.amount * qty)
            )
            
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        """وقتی تعداد فاکتور تغییر میکنه، انبار اصلاح میشه"""
        instance = self.get_object()
        old_qty = instance.quantity
        new_qty = int(request.data.get('quantity', old_qty))
        
        if old_qty != new_qty:
            diff = new_qty - old_qty
            product = instance.product
            
            for item in product.recipe_items.all():
                Ingredient.objects.filter(id=item.ingredient_id).update(
                    current_stock=F('current_stock') - (item.amount * diff)
                )
                
        return super().update(request, *args, **kwargs)

class ReportViewSet(viewsets.ViewSet):
    """Read-only reports. No CRUD, just custom actions."""

    @action(detail=False, methods=['get'], url_path='daily')
    def daily(self, request):
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




class SaleViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.all().select_related('product')
    serializer_class = SaleSerializer

    def create(self, request):
        ser = SaleCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data
        sale = services.commit_sale(
            product_id=data['product_id'],
            quantity=data['quantity'],
            target_date=data.get('date') or date.today()
        )
        return Response(SaleSerializer(sale).data, status=status.HTTP_201_CREATED)

    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        """حذف فاکتور و برگرداندن موجودی به انبار"""
        instance = self.get_object()
        product = instance.product
        qty = instance.quantity
        
        for item in product.recipe_items.all():
            Ingredient.objects.filter(id=item.ingredient_id).update(
                current_stock=F('current_stock') + (item.amount * qty)
            )
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        """ویرایش فاکتور و اصلاح موجودی انبار"""
        instance = self.get_object()
        old_qty = instance.quantity
        new_qty = int(request.data.get('quantity', old_qty))
        
        if old_qty != new_qty:
            diff = new_qty - old_qty
            product = instance.product
            for item in product.recipe_items.all():
                Ingredient.objects.filter(id=item.ingredient_id).update(
                    current_stock=F('current_stock') - (item.amount * diff)
                )
        return super().update(request, *args, **kwargs)


@api_view(['GET', 'POST'])
def shift_management(request):
    # پیدا کردن آخرین شیفت بسته شده
    last_shift = Shift.objects.first()
    
    # محاسبه فروش‌های از آخرین بستن صندوق به بعد
    if last_shift:
        recent_sales = Sale.objects.filter(created_at__gt=last_shift.closed_at)
    else:
        recent_sales = Sale.objects.all()
        
    total_amount = sum(s.unit_price * s.quantity for s in recent_sales)

    if request.method == 'GET':
        return Response({
            'system_total': total_amount,
            'last_closed_at': last_shift.closed_at if last_shift else None
        })
        
    if request.method == 'POST':
        actual = int(request.data.get('actual_cash', 0))
        shift = Shift.objects.create(
            system_total=total_amount,
            actual_cash=actual,
            difference=actual - total_amount
        )
        return Response({'status': 'closed', 'difference': shift.difference})