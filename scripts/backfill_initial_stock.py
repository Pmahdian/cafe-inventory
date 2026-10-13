"""
Backfill initial_stock for all ingredients.

initial_stock = current_stock - total_in + total_used

Because:
    current_stock = initial_stock + total_in - total_used
    => initial_stock = current_stock - total_in + total_used
"""
import os
import sys
import django
from decimal import Decimal
from pathlib import Path

# Add project root to Python path so 'backend' is importable
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.db.models import F, Sum
from inventory.models import Ingredient, StockEntry, RecipeItem


def run():
    print("Backfilling initial_stock...\n")
    print(f"{'Name':<25} {'initial':>10} {'current':>10} {'in':>8} {'used':>8}")
    print("-" * 65)

    for ing in Ingredient.objects.all():
        total_in = StockEntry.objects.filter(ingredient=ing).aggregate(
            t=Sum('amount')
        )['t'] or Decimal(0)

        total_used = RecipeItem.objects.filter(ingredient=ing).aggregate(
            t=Sum(F('amount') * F('product__sale__quantity'))
        )['t'] or Decimal(0)

        initial = ing.current_stock - total_in + total_used
        ing.initial_stock = initial
        ing.save(update_fields=['initial_stock'])

        print(f"{ing.name:<25} {initial:>10} {ing.current_stock:>10} "
              f"{total_in:>8} {total_used:>8}")

    print("\nDone.")


if __name__ == '__main__':
    run()