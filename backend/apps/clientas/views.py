# ─────────────────────────────────────────────────────────────
# apps/clientas/views.py
# ─────────────────────────────────────────────────────────────

from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Clienta
from .serializers import ClientaSerializer


class ClientaViewSet(viewsets.ModelViewSet):
    """
    CRUD para gestión de Clientas.
    Incluye búsqueda por nombre o teléfono.
    """
    serializer_class = ClientaSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['nombre', 'telefono']

    def get_queryset(self):
        return Clienta.objects.filter(
            tenant=self.request.user.tenant,
            activa=True
        )
