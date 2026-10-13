from django.contrib import admin
from .models import Ingredient, Product, RecipeItem, StockEntry, Sale


class RecipeItemInline(admin.TabularInline):
    model = RecipeItem
    extra = 3


@admin.register(Ingredient)
class IngredientAdmin(admin.ModelAdmin):
    list_display = ('name', 'unit', 'current_stock', 'min_stock')
    list_filter = ('unit',)
    search_fields = ('name',)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    inlines = [RecipeItemInline]
    list_display = ('name', 'price', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name',)


@admin.register(StockEntry)
class StockEntryAdmin(admin.ModelAdmin):
    list_display = ('ingredient', 'amount', 'date', 'note')
    list_filter = ('date', 'ingredient')
    date_hierarchy = 'date'


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = ('product', 'quantity', 'unit_price', 'date')
    list_filter = ('date', 'product')
    date_hierarchy = 'date'


# App label in admin panel
admin.site.site_header = "Cafe Inventory Admin"
admin.site.site_title = "Cafe Inventory"
admin.site.index_title = "Management"