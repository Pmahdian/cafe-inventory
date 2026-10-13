# Cafe Inventory Management

A full-stack inventory management system for cafes with recipe-based automatic stock deduction.

## 🎯 What it does

Instead of manually tracking how much milk and coffee you use each day, this system:

- **Knows your recipes**: `Latte = 18g espresso + 200ml milk + 1 cup`
- **Deducts automatically**: When you record a sale, ingredients are deducted
- **Reports historical state**: View inventory at any past date with ledger-based calculation
- **Alerts on low stock**: Get notified before you run out

## ✨ Features

- 🧾 Recipe-based stock management
- 📊 Ledger-based historical reports (accurate at any date)
- 🔒 Atomic transactions (rollback on failure)
- 📈 Top products chart (last 7 days)
- 🌓 Dark mode
- 🔔 Low-stock alerts
- ⚡ Optimistic cart updates

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Backend | Django 5, Django REST Framework |
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS |
| Database | SQLite (dev) — PostgreSQL-ready |
| Testing | pytest-django, 50+ tests |
| HTTP Client | Axios |
| Icons | lucide-react |
| Charts | recharts |

## 🏗 Architecture

```
┌─────────────┐      HTTP/JSON      ┌──────────────┐
│  Next.js    │ ←─────────────────→ │  Django+DRF  │
│  (port 3000)│                     │  (port 8000) │
└─────────────┘                     └──────┬───────┘
                                           │
                                      ┌────▼────┐
                                      │ SQLite  │
                                      └─────────┘
```

**Key design decision:** All stock calculations are ledger-based — every transaction is stored with a date, and inventory at any point is computed by aggregating transactions up to that date. This makes historical reports accurate without data duplication.

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+

### Backend

```bash
# Setup
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Configure
cp .env.example .env
# Edit .env and set DJANGO_SECRET_KEY

# Migrate
python manage.py migrate
python manage.py createsuperuser

# Run
python manage.py runserver 0.0.0.0:8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local

# Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🧪 Testing

```bash
# Backend tests
pytest

# With coverage
pytest --cov=inventory --cov-report=term-missing
```

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/ingredients/` | List all ingredients |
| GET | `/api/ingredients/units/` | Available units |
| GET | `/api/products/` | List products with recipes |
| POST | `/api/sales/` | Record a sale (deducts stock) |
| POST | `/api/stock-entries/` | Record stock delivery |
| GET | `/api/reports/daily/?date=YYYY-MM-DD` | Daily report |

## 📝 License

MIT
