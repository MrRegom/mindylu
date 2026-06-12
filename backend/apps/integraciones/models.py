# apps/integraciones/models.py

from django.db import models
from apps.core.models import Tenant

class WhatsappConfig(models.Model):
    """
    Guarda el estado de la conexión con Evolution API para el envío de WhatsApp.
    """
    tenant = models.OneToOneField(Tenant, on_delete=models.CASCADE, related_name='whatsapp_config')
    instance_name = models.CharField(max_length=100, blank=True, null=True, help_text="Nombre de la instancia en Evolution API")
    instance_id = models.CharField(max_length=100, blank=True, null=True)
    connection_status = models.CharField(max_length=50, default='DISCONNECTED')
    qr_code_base64 = models.TextField(blank=True, null=True)
    webhook_url = models.URLField(blank=True, null=True)
    is_active = models.BooleanField(default=False)
    
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Configuración de WhatsApp"
        verbose_name_plural = "Configuraciones de WhatsApp"

    def __str__(self):
        return f"WhatsApp Config - {self.tenant.nombre} ({self.connection_status})"
