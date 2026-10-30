from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone

class Category(models.Model):
    """Product categories (e.g. Breakfast, Hot Coffee, Shakes)"""
    name = models.CharField(max_length=100, unique=True)
    order = models.PositiveIntegerField(default=0, help_text="Order to display in UI")

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['order', 'name']

    def __str__(self):
        return self.name

    
class Ingredient(models.Model):
    """Raw materials: milk, coffee, syrup, etc."""
    UNIT_CHOICES = [
        ('ml', 'Milliliter'),
        ('gr', 'Gram'),
        ('count', 'Count'),
    ]
    name = models.CharField(max_length=100, unique=True)
    unit = models.CharField(max_length=10, choices=UNIT_CHOICES)
    initial_stock = models.DecimalField(       
        max_digits=10, decimal_places=2, default=0,
        validators=[MinValueValidator(0)],
        help_text="Stock before any transaction (the starting point)"
    )
    current_stock = models.DecimalField(
        max_digits=10, decimal_places=2, default=0,
        validators=[MinValueValidator(0)]
    )
    min_stock = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    class Meta:
        verbose_name = "Ingredient"
        verbose_name_plural = "Ingredients"
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.current_stock} {self.unit})"


class Product(models.Model):
    """Final products: Latte, Americano, ..."""
    name = models.CharField(max_length=100, unique=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    price = models.DecimalField(max_digits=10, decimal_places=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Product"
        verbose_name_plural = "Products"
        ordering = ['name']

    def __str__(self):
        return self.name


class RecipeItem(models.Model):
    """One line of a recipe: how much of an ingredient a product uses."""
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name='recipe_items'
    )
    ingredient = models.ForeignKey(Ingredient, on_delete=models.PROTECT)
    amount = models.DecimalField(
        max_digits=10, decimal_places=2,
        validators=[MinValueValidator(0)]
    )

    class Meta:
        unique_together = ('product', 'ingredient')
        verbose_name = "Recipe Item"
        verbose_name_plural = "Recipe Items"

    def __str__(self):
        return f"{self.product} -> {self.ingredient} : {self.amount}"


class StockEntry(models.Model):
    """Stock received on a specific date."""
    ingredient = models.ForeignKey(Ingredient, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField()
    note = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Stock Entry"
        verbose_name_plural = "Stock Entries"
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"{self.ingredient} +{self.amount} on {self.date}"


class Sale(models.Model):
    """Each record = one sale on a specific date."""
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
    date = models.DateField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Sale"
        verbose_name_plural = "Sales"
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"{self.quantity}x {self.product} on {self.date}"




class Shift(models.Model):
    opened_at = models.DateTimeField(auto_now_add=True)
    closed_at = models.DateTimeField(default=timezone.now)
    system_total = models.DecimalField(max_digits=12, decimal_places=0, default=0)
    actual_cash = models.DecimalField(max_digits=12, decimal_places=0, default=0)
    difference = models.DecimalField(max_digits=12, decimal_places=0, default=0)
    is_closed = models.BooleanField(default=False)

    def __str__(self):
        return f"Shift {self.opened_at.strftime('%Y-%m-%d')} - {'Closed' if self.is_closed else 'Open'}"