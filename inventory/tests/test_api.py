"""
Tests for the REST API endpoints.
"""
from datetime import date
from decimal import Decimal

from django.test import TestCase
from rest_framework.test import APIClient

from inventory.models import (
    Ingredient, Product, RecipeItem, Sale, StockEntry,
)


class IngredientAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.milk = Ingredient.objects.create(
            name='Milk', unit='ml',
            initial_stock=5000, current_stock=5000, min_stock=1000,
        )
        self.bean = Ingredient.objects.create(
            name='Bean', unit='gr',
            initial_stock=2000, current_stock=2000, min_stock=500,
        )

    def test_list_ingredients(self):
        response = self.client.get('/api/ingredients/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 2)

    def test_retrieve_ingredient(self):
        response = self.client.get(f'/api/ingredients/{self.milk.id}/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['name'], 'Milk')
        self.assertEqual(response.data['unit'], 'ml')

    def test_create_ingredient(self):
        payload = {
            'name': 'Sugar',
            'unit': 'gr',
            'initial_stock': '1000',
            'current_stock': '1000',
            'min_stock': '200',
        }
        response = self.client.post('/api/ingredients/', payload)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Ingredient.objects.count(), 3)

    def test_units_endpoint(self):
        response = self.client.get('/api/ingredients/units/')
        self.assertEqual(response.status_code, 200)
        values = [u['value'] for u in response.data]
        self.assertIn('ml', values)
        self.assertIn('gr', values)
        self.assertIn('count', values)


class ProductAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.milk = Ingredient.objects.create(
            name='Milk', unit='ml', current_stock=5000
        )
        self.latte = Product.objects.create(name='Latte', price=85000)
        RecipeItem.objects.create(
            product=self.latte, ingredient=self.milk, amount=200
        )

    def test_list_products_includes_recipe(self):
        response = self.client.get('/api/products/')
        self.assertEqual(response.status_code, 200)
        latte_data = response.data[0]
        self.assertEqual(latte_data['name'], 'Latte')
        self.assertEqual(len(latte_data['recipe_items']), 1)
        self.assertEqual(
            latte_data['recipe_items'][0]['ingredient_name'], 'Milk'
        )


class SaleAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.milk = Ingredient.objects.create(
            name='Milk', unit='ml',
            initial_stock=5000, current_stock=5000,
        )
        self.latte = Product.objects.create(name='Latte', price=85000)
        RecipeItem.objects.create(
            product=self.latte, ingredient=self.milk, amount=200
        )

    def test_create_sale(self):
        response = self.client.post('/api/sales/', {
            'product_id': self.latte.id,
            'quantity': 3,
        }, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Sale.objects.count(), 1)
        self.assertEqual(response.data['quantity'], 3)
        # Milk should be deducted
        self.milk.refresh_from_db()
        self.assertEqual(self.milk.current_stock, Decimal('4400'))

    def test_create_sale_with_invalid_product(self):
        response = self.client.post('/api/sales/', {
            'product_id': 99999,
            'quantity': 1,
        }, format='json')
        # Service raises Product.DoesNotExist → view should return error
        self.assertIn(response.status_code, [400, 404, 500])

    def test_create_sale_with_invalid_quantity(self):
        response = self.client.post('/api/sales/', {
            'product_id': self.latte.id,
            'quantity': 0,
        }, format='json')
        self.assertEqual(response.status_code, 400)

    def test_sale_returns_total_price(self):
        response = self.client.post('/api/sales/', {
            'product_id': self.latte.id,
            'quantity': 2,
        }, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['total_price'], 170000.0)


class StockEntryAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.milk = Ingredient.objects.create(
            name='Milk', unit='ml',
            initial_stock=1000, current_stock=1000,
        )

    def test_create_stock_entry(self):
        response = self.client.post('/api/stock-entries/', {
            'ingredient_id': self.milk.id,
            'amount': '500',
            'note': 'Morning delivery',
        }, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(StockEntry.objects.count(), 1)
        self.milk.refresh_from_db()
        self.assertEqual(self.milk.current_stock, Decimal('1500'))


class ReportAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.milk = Ingredient.objects.create(
            name='Milk', unit='ml',
            initial_stock=5000, current_stock=5000, min_stock=1000,
        )
        self.latte = Product.objects.create(name='Latte', price=85000)
        RecipeItem.objects.create(
            product=self.latte, ingredient=self.milk, amount=200
        )

    def test_daily_report_default_today(self):
        response = self.client.get('/api/reports/daily/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('date', response.data)
        self.assertIn('items', response.data)

    def test_daily_report_for_specific_date(self):
        response = self.client.get('/api/reports/daily/?date=2026-10-05')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['date'], '2026-10-05')

    def test_daily_report_invalid_date(self):
        response = self.client.get('/api/reports/daily/?date=invalid')
        self.assertEqual(response.status_code, 400)

    def test_report_reflects_usage(self):
        Sale.objects.create(
            product=self.latte, quantity=3,
            date=date.today(), unit_price=self.latte.price,
        )
        response = self.client.get('/api/reports/daily/')
        milk_row = next(
            r for r in response.data['items'] if r['name'] == 'Milk'
        )
        self.assertEqual(milk_row['used'], 600.0)
        self.assertEqual(milk_row['remaining'], 4400.0)