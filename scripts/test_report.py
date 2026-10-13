"""Test the new ledger-based reports for today and yesterday."""
import os
import sys
import django
from pathlib import Path
from datetime import date, timedelta

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from inventory import services


def print_report(target_date):
    print(f"\n=== REPORT for {target_date} ===\n")
    print(f"{'Name':<25} {'opening':>9} {'in':>6} {'used':>6} {'closing':>9}  unit")
    print("-" * 70)
    for item in services.get_daily_report(target_date):
        flag = "LOW" if item['below_min'] else ""
        print(f"{item['name']:<25} {item['opening']:>9.0f} "
              f"{item['entered']:>6.0f} {item['used']:>6.0f} "
              f"{item['remaining']:>9.0f}  {item['unit']}  {flag}")


if __name__ == '__main__':
    today = date.today()
    yesterday = today - timedelta(days=1)

    print_report(yesterday)
    print_report(today)