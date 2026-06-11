# ─────────────────────────────────────────────────────────────
# apps/catalogo/urls.py
# ─────────────────────────────────────────────────────────────

from django.urls import path, include
from rest_framework.routers import SimpleRouter
from .views import PrendaViewSet, CicloVentaViewSet, CategoriaViewSet, ColorPredefinidoViewSet, TallaPredefinidaViewSet, NombrePrendaPredefinidoViewSet, PublicoPrendaViewSet, PublicoCategoriaViewSet, PublicoColorViewSet

router = SimpleRouter()
router.register(r'prendas', PrendaViewSet, basename='prenda')
router.register(r'ciclos', CicloVentaViewSet, basename='ciclo')
router.register(r'categorias', CategoriaViewSet, basename='categoria')
router.register(r'colores', ColorPredefinidoViewSet, basename='color')
router.register(r'tallas', TallaPredefinidaViewSet, basename='talla')
router.register(r'nombres-prendas', NombrePrendaPredefinidoViewSet, basename='nombre-prenda')

router.register(r'publico/prendas', PublicoPrendaViewSet, basename='publico-prenda')
router.register(r'publico/categorias', PublicoCategoriaViewSet, basename='publico-categoria')
router.register(r'publico/colores', PublicoColorViewSet, basename='publico-color')

urlpatterns = [
    path('', include(router.urls)),
]
