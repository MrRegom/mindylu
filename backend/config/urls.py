# ─────────────────────────────────────────────────────────────
# config/urls.py
# Router principal del proyecto. Todas las apps exponen
# sus endpoints bajo el prefijo /api/v1/
# ─────────────────────────────────────────────────────────────

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),

    # Autenticación JWT
    path('api/v1/auth/', include('apps.core.urls.auth')),

    # Módulos de negocio
    path('api/v1/catalogo/', include('apps.catalogo.urls')),
    path('api/v1/clientas/', include('apps.clientas.urls')),
    path('api/v1/pedidos/', include('apps.pedidos.urls')),
    path('api/v1/cuentas/', include('apps.cuentas.urls')),
    path('api/v1/integraciones/', include('apps.integraciones.urls')),
    path('api/v1/reportes/', include('apps.reportes.urls')),
    path('api/v1/logs/', include('apps.core.urls.logs')),
]

# Servir archivos media en desarrollo
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
