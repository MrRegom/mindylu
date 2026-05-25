# ─────────────────────────────────────────────────────────────
# apps/pedidos/admin.py
# ─────────────────────────────────────────────────────────────

from django.contrib import admin
from .models import PuntoEntrega, Pedido, ItemPedido, EntregaDiaria

class ItemPedidoInline(admin.TabularInline):
    model = ItemPedido
    extra = 0

@admin.register(PuntoEntrega)
class PuntoEntregaAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'ciudad', 'tenant']
    list_filter = ['tenant']

@admin.register(Pedido)
class PedidoAdmin(admin.ModelAdmin):
    list_display = ['id', 'clienta', 'estado', 'fecha_entrega_acordada', 'punto_entrega', 'tenant']
    list_filter = ['estado', 'tenant']
    inlines = [ItemPedidoInline]

@admin.register(EntregaDiaria)
class EntregaDiariaAdmin(admin.ModelAdmin):
    list_display = ['fecha', 'punto_entrega', 'hora_estimada', 'recordatorios_enviados', 'tenant']
    list_filter = ['fecha', 'punto_entrega', 'tenant']
