from django.urls import path
from apps.core.views.config_views import ConfiguracionTiendaPrivadaView, ConfiguracionTiendaPublicaView

urlpatterns = [
    path('privado/', ConfiguracionTiendaPrivadaView.as_view(), name='configuracion-privada'),
    path('publico/', ConfiguracionTiendaPublicaView.as_view(), name='configuracion-publica'),
]
