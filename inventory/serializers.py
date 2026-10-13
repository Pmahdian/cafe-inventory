from rest_framework import serializers
from .models import Ingredient, Product, RecipeItem, StockEntry, Sale
from decimal import Decimal


# ═══════════════════════════════════════════════
#  READ SERIALIZERS (for displaying data)
# ═══════════════════════════════════════════════

class IngredientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ingredient
        fields = ('id', 'name', 'unit', 'initial_stock',
                  'current_stock', 'min_stock')
        read_only_fields = ('current_stock',)


class RecipeItemSerializer(serializers.ModelSerializer):
    ingredient_name = serializers.CharField(
        source='ingredient.name', read_only=True
    )
    unit = serializers.CharField(source='ingredient.unit', read_only=True)

    class Meta:
        model = RecipeItem
        fields = ('id', 'ingredient', 'ingredient_name', 'unit', 'amount')


class ProductSerializer(serializers.ModelSerializer):
    recipe_items = RecipeItemSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = ('id', 'name', 'price', 'is_active', 'recipe_items')


class StockEntrySerializer(serializers.ModelSerializer):
    ingredient_name = serializers.CharField(
        source='ingredient.name', read_only=True
    )

    class Meta:
        model = StockEntry
        fields = ('id', 'ingredient', 'ingredient_name',
                  'amount', 'date', 'note', 'created_at')
        read_only_fields = ('created_at',)


class SaleSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(
        source='product.name', read_only=True
    )
    total_price = serializers.SerializerMethodField()

    class Meta:
        model = Sale
        fields = ('id', 'product', 'product_name', 'quantity',
                  'unit_price', 'total_price', 'date', 'created_at')
        read_only_fields = ('unit_price', 'created_at')

    def get_total_price(self, obj):
        return float(obj.unit_price) * obj.quantity


# ═══════════════════════════════════════════════
#  WRITE SERIALIZERS (for creating data)
# ═══════════════════════════════════════════════

class SaleCreateSerializer(serializers.Serializer):
    """Simple input for creating a sale — logic lives in services.py"""
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)
    date = serializers.DateField(required=False)


class StockEntryCreateSerializer(serializers.Serializer):
    """Simple input for stock entry — logic lives in services.py"""
    ingredient_id = serializers.IntegerField()
    amount = serializers.DecimalField(
    max_digits=10, decimal_places=2, min_value=Decimal('0.01')  # ← Decimal
        )
    
    date = serializers.DateField(required=False)
    note = serializers.CharField(required=False, allow_blank=True, default='')