from datetime import date, timedelta
from decimal import Decimal
from django.db import transaction
from django.db.models import Sum, F
from .models import Ingredient, RecipeItem, StockEntry, Sale, Product


# ═══════════════════════════════════════════════
#  LEDGER-BASED STOCK CALCULATION
# ═══════════════════════════════════════════════
#
#  stock_at(date) = initial + Σ(entries ≤ date) − Σ(usage ≤ date)
#
# ═══════════════════════════════════════════════

def get_stock_at(ingredient_id: int, target_date: date) -> Decimal:
    """
    Stock of one ingredient at END of target_date (ledger-based).
    Works for any date, past or present.
    """
    ingredient = Ingredient.objects.get(id=ingredient_id)

    # Total received up to and including target_date
    total_in = StockEntry.objects.filter(
        ingredient_id=ingredient_id,
        date__lte=target_date
    ).aggregate(t=Sum('amount'))['t'] or Decimal(0)

    # Total consumed up to and including target_date
    total_used = RecipeItem.objects.filter(
        ingredient_id=ingredient_id,
        product__sale__date__lte=target_date
    ).aggregate(
        t=Sum(F('amount') * F('product__sale__quantity'))
    )['t'] or Decimal(0)

    return ingredient.initial_stock + total_in - total_used


def get_daily_usage(target_date: date) -> dict:
    """Usage on a single day: {ingredient_id: amount}"""
    rows = RecipeItem.objects.filter(
        product__sale__date=target_date
    ).values('ingredient_id').annotate(
        total=Sum(F('amount') * F('product__sale__quantity'))
    )
    return {r['ingredient_id']: r['total'] for r in rows}


def get_daily_input(target_date: date) -> dict:
    """Stock received on a single day"""
    rows = StockEntry.objects.filter(date=target_date).values('ingredient_id').annotate(
        total=Sum('amount')
    )
    return {r['ingredient_id']: r['total'] for r in rows}


def get_daily_report(target_date: date):
    """
    Full daily report, ledger-based.
    For each ingredient:
      opening  = stock at end of previous day
      entered  = received today
      used     = consumed today
      closing  = opening + entered - used
    """
    prev_day = target_date - timedelta(days=1)
    usage_today = get_daily_usage(target_date)
    input_today = get_daily_input(target_date)

    report = []
    for ing in Ingredient.objects.all():
        opening = get_stock_at(ing.id, prev_day)
        entered = input_today.get(ing.id, Decimal(0))
        used = usage_today.get(ing.id, Decimal(0))
        closing = opening + entered - used

        report.append({
            'ingredient_id': ing.id,
            'name': ing.name,
            'unit': ing.unit,
            'opening': float(opening),
            'entered': float(entered),
            'used': float(used),
            'remaining': float(closing),
            'below_min': closing < ing.min_stock,
        })
    return report


# ═══════════════════════════════════════════════
#  WRITE OPERATIONS
# ═══════════════════════════════════════════════

def commit_sale(product_id: int, quantity: int, target_date: date):
    """Record a sale + deduct from stock."""
    with transaction.atomic():
        product = Product.objects.get(id=product_id)
        sale = Sale.objects.create(
            product=product, quantity=quantity,
            date=target_date, unit_price=product.price
        )
        for item in product.recipe_items.all():
            Ingredient.objects.filter(id=item.ingredient_id).update(
                current_stock=F('current_stock') - item.amount * quantity
            )
    return sale


def commit_stock_entry(ingredient_id: int, amount, target_date: date, note=''):
    """Record stock received + add to inventory."""
    with transaction.atomic():
        entry = StockEntry.objects.create(
            ingredient_id=ingredient_id, amount=amount, date=target_date, note=note
        )
        Ingredient.objects.filter(id=ingredient_id).update(
            current_stock=F('current_stock') + amount
        )
    return entry