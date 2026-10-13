from rest_framework.routers import DefaultRouter
from .views import (
    IngredientViewSet,
    ProductViewSet,
    StockEntryViewSet,
    SaleViewSet,
    ReportViewSet,
)


class OptionalSlashRouter(DefaultRouter):
    """
    Router that accepts both /path/ and /path (no redirect).
    Needed because Next.js rewrites strip trailing slashes.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.trailing_slash = '/?'


router = OptionalSlashRouter()
router.register('ingredients', IngredientViewSet)
router.register('products', ProductViewSet)
router.register('stock-entries', StockEntryViewSet, basename='stock-entry')
router.register('sales', SaleViewSet)
router.register('reports', ReportViewSet, basename='report')

urlpatterns = router.urls