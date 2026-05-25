# ─────────────────────────────────────────────────────────────
# apps/clientas/admin.py
# ─────────────────────────────────────────────────────────────

from django.contrib import admin
from .models import Clienta


@admin.register(Clienta)
class ClientaAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'telefono', 'tenant', 'activa', 'fecha_registro']
    list_filter = ['activa', 'tenant']
    search_fields = ['nombre', 'telefono', 'email']
