# ─────────────────────────────────────────────────────────────
# apps/catalogo/urls.py
# ─────────────────────────────────────────────────────────────

from django.urls import path, include
from rest_framework.routers import SimpleRouter
from .views import PrendaViewSet, CicloVentaViewSet, CategoriaViewSet

router = SimpleRouter()
router.register(r'prendas', PrendaViewSet, basename='prenda')
router.register(r'ciclos', CicloVentaViewSet, basename='ciclo')
router.register(r'categorias', CategoriaViewSet, basename='categoria')

urlpatterns = [
    path('', include(router.urls)),
]
