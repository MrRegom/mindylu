# ─────────────────────────────────────────────────────────────
# apps/pedidos/models.py
# ─────────────────────────────────────────────────────────────

from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.core.models import Tenant
from apps.clientas.models import Clienta
from apps.catalogo.models import PrendaVariante
#from apps.cuentas.models import CuentaBancaria # Se usará en Fase 5


class PuntoEntrega(models.Model):
    """
    Lugares físicos donde la vendedora hace las entregas.
    Ej: "Metro Barón", "Metro Viña", "Domicilio Valparaíso"
    """
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='puntos_entrega')
    nombre = models.CharField(max_length=100)
    ciudad = models.CharField(max_length=100, blank=True, null=True)
    
    class Meta:
        ordering = ['nombre']
        verbose_name = _('Punto de Entrega')
        verbose_name_plural = _('Puntos de Entrega')
        unique_together = [['tenant', 'nombre']]

    def __str__(self):
        return self.nombre


class Pedido(models.Model):
    """
    El registro maestro de una venta apartada o completada.
    """
    class Estado(models.TextChoices):
        APARTADO = 'apartado', _('Apartado')
        POR_PAGAR = 'por_pagar', _('Por Pagar')
        PAGADO = 'pagado', _('Pagado')
        ENTREGADO = 'entregado', _('Entregado')
        CANCELADO = 'cancelado', _('Cancelado')

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='pedidos')
    clienta = models.ForeignKey(Clienta, on_delete=models.CASCADE, related_name='pedidos')
    
    estado = models.CharField(max_length=20, choices=Estado.choices, default=Estado.APARTADO, db_index=True)
    
    fecha_pedido = models.DateTimeField(auto_now_add=True)
    fecha_entrega_acordada = models.DateField(null=True, blank=True)
    punto_entrega = models.ForeignKey(PuntoEntrega, on_delete=models.SET_NULL, null=True, blank=True)
    
    # cuenta_pago = models.ForeignKey(CuentaBancaria, on_delete=models.SET_NULL, null=True, blank=True) # Fase 5
    
    notas = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-fecha_pedido']
        verbose_name = _('Pedido')
        verbose_name_plural = _('Pedidos')

    def total(self):
        return sum(item.subtotal() for item in self.items.all())

    def __str__(self):
        return f"Pedido #{self.id} - {self.clienta.nombre} ({self.get_estado_display()})"


class ItemPedido(models.Model):
    """
    Las prendas individuales dentro de un pedido.
    """
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name='items')
    variante = models.ForeignKey(PrendaVariante, on_delete=models.PROTECT)
    cantidad = models.PositiveIntegerField(default=1)
    precio_unitario = models.PositiveIntegerField(help_text=_('Precio de la prenda al momento de venderla'))

    class Meta:
        verbose_name = _('Item de Pedido')
        verbose_name_plural = _('Items de Pedido')

    def subtotal(self):
        return self.cantidad * self.precio_unitario

    def __str__(self):
        return f"{self.cantidad}x {self.variante.prenda.nombre} ({self.variante.color})"


class EntregaDiaria(models.Model):
    """
    Agrupación para ayudar a la vendedora a organizar su día.
    Contiene todos los pedidos que debe entregar en un lugar y fecha específicos.
    """
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='entregas_diarias')
    fecha = models.DateField()
    punto_entrega = models.ForeignKey(PuntoEntrega, on_delete=models.CASCADE)
    hora_estimada = models.TimeField(null=True, blank=True, help_text=_('Ej: 14:00 hrs'))
    
    pedidos = models.ManyToManyField(Pedido, related_name='rutas_entrega')
    
    recordatorios_enviados = models.BooleanField(default=False)

    class Meta:
        ordering = ['-fecha', 'hora_estimada']
        verbose_name = _('Entrega Diaria')
        verbose_name_plural = _('Entregas Diarias')
        unique_together = [['tenant', 'fecha', 'punto_entrega']]

    def __str__(self):
        return f"Entrega {self.fecha} en {self.punto_entrega.nombre}"
