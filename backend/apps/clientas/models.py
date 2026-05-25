# ─────────────────────────────────────────────────────────────
# apps/clientas/models.py
# ─────────────────────────────────────────────────────────────

from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.core.models import Tenant


class Clienta(models.Model):
    """
    Representa a una compradora. 
    Aislada por Tenant para que las tiendas no crucen datos.
    """
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='clientas')
    
    nombre = models.CharField(max_length=255)
    telefono = models.CharField(max_length=20, blank=True, null=True, help_text=_('Necesario para WhatsApp'))
    email = models.EmailField(blank=True, null=True)
    perfil_facebook = models.URLField(blank=True, null=True, help_text=_('URL del perfil si compró por FB'))
    perfil_instagram = models.URLField(blank=True, null=True)
    notas = models.TextField(blank=True, null=True, help_text=_('Ej: Es mañosa con las tallas, prefiere envíos los viernes...'))
    
    fecha_registro = models.DateTimeField(auto_now_add=True)
    activa = models.BooleanField(default=True)

    class Meta:
        ordering = ['nombre']
        verbose_name = _('Clienta')
        verbose_name_plural = _('Clientas')
        # Una tienda no puede tener dos clientas con el mismo teléfono (evitar duplicados)
        unique_together = [['tenant', 'telefono']]

    def __str__(self):
        return f"{self.nombre} - {self.telefono or 'Sin teléfono'}"
