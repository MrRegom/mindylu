# ─────────────────────────────────────────────────────────────
# apps/catalogo/admin.py
# ─────────────────────────────────────────────────────────────

from django.contrib import admin
from .models import CicloVenta, Prenda, PrendaVariante


class PrendaVarianteInline(admin.TabularInline):
    model = PrendaVariante
    extra = 1


@admin.register(Prenda)
class PrendaAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'precio', 'estado', 'tenant', 'ciclo', 'fecha_creacion']
    list_filter = ['estado', 'talla_tipo', 'tenant']
    search_fields = ['nombre']
    inlines = [PrendaVarianteInline]


@admin.register(CicloVenta)
class CicloVentaAdmin(admin.ModelAdmin):
    list_display = ['id', 'fecha_publicacion', 'estado', 'tenant']
    list_filter = ['estado', 'tenant']
