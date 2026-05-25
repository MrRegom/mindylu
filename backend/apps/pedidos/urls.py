# ─────────────────────────────────────────────────────────────
# apps/pedidos/urls.py
# ─────────────────────────────────────────────────────────────

from django.urls import path, include
from rest_framework.routers import SimpleRouter
from .views import PuntoEntregaViewSet, PedidoViewSet, EntregaDiariaViewSet

router = SimpleRouter()
router.register(r'puntos', PuntoEntregaViewSet, basename='punto_entrega')
router.register(r'entregas', EntregaDiariaViewSet, basename='entrega_diaria')
router.register(r'', PedidoViewSet, basename='pedido')

urlpatterns = [
    path('', include(router.urls)),
]
