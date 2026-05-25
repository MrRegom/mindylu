# apps/cuentas/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CuentaBancariaViewSet

router = DefaultRouter()
router.register(r'bancos', CuentaBancariaViewSet, basename='bancos')

urlpatterns = [
    path('', include(router.urls)),
]
