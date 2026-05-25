# ─────────────────────────────────────────────────────────────
# apps/core/urls/auth.py
# Rutas de autenticación JWT.
# ─────────────────────────────────────────────────────────────

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from apps.core.views.auth_views import registro_view, login_view, perfil_view

urlpatterns = [
    path('registro/', registro_view, name='auth-registro'),
    path('login/', login_view, name='auth-login'),
    path('perfil/', perfil_view, name='auth-perfil'),
    path('refresh/', TokenRefreshView.as_view(), name='auth-refresh'),
]
