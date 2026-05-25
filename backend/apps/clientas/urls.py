# ─────────────────────────────────────────────────────────────
# apps/clientas/urls.py
# ─────────────────────────────────────────────────────────────

from django.urls import path, include
from rest_framework.routers import SimpleRouter
from .views import ClientaViewSet

router = SimpleRouter()
router.register(r'', ClientaViewSet, basename='clienta')

urlpatterns = [
    path('', include(router.urls)),
]
