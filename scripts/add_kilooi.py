import os
import sys
import django
from pathlib import Path
from decimal import Decimal

# Setup Django
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from inventory.models import Category, Product

def run():
    print("🌱 Adding 'کیلویی' (By Weight) category...")

    # ۱. ساخت دسته‌بندی جدید (اگر از قبل نبود)
    category, created = Category.objects.get_or_create(
        name="کیلویی",
        defaults={'order': 11} # ترتیبش بعد از اسموتی ها
    )
    
    if created:
        print("✅ Created category: کیلویی")
    else:
        print("ℹ️ Category 'کیلویی' already exists.")

    # ۲. لیست محصولات جدید
    products = [
        ("یک کیلو پسته‌ای", 4650000),
        ("یک کیلو گردویی", 2350000),
        ("یک کیلو مخلوط گردو و پسته", 3550000),
    ]

    # ۳. اضافه کردن محصولات
    for name, price in products:
        prod, p_created = Product.objects.get_or_create(
            name=name,
            defaults={
                'category': category,
                'price': Decimal(price)
            }
        )
        if p_created:
            print(f"✅ Created product: {name} - {price:,} Toman")
        else:
            print(f"ℹ️ Product '{name}' already exists.")

    print("\n🎉 Done! You can now see them in the POS page.")

if __name__ == '__main__':
    run()