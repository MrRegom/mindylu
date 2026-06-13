# apps/integraciones/models.py

from django.db import models
from apps.core.models import Tenant

class WhatsappConfig(models.Model):
    """
    Guarda el estado de la conexión con Meta API para el envío de WhatsApp.
    """
    tenant = models.OneToOneField(Tenant, on_delete=models.CASCADE, related_name='whatsapp_config')
    phone_number_id = models.CharField(max_length=100, blank=True, null=True, help_text="ID del Número de Teléfono en Meta")
    waba_id = models.CharField(max_length=100, blank=True, null=True, help_text="ID de la Cuenta de WhatsApp Business")
    access_token = models.TextField(blank=True, null=True, help_text="Token Permanente del Usuario de Sistema")
    webhook_url = models.URLField(blank=True, null=True)
    is_active = models.BooleanField(default=False)
    
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Configuración de WhatsApp"
        verbose_name_plural = "Configuraciones de WhatsApp"

    def __str__(self):
        return f"WhatsApp Config - {self.tenant.nombre}"


class Conversacion(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE)
    client_phone = models.CharField(max_length=50)
    client_name = models.CharField(max_length=150, blank=True)
    last_message_at = models.DateTimeField(auto_now=True)
    unread_count = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=[('OPEN', 'Open'), ('CLOSED', 'Closed')], default='OPEN')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-last_message_at']
        verbose_name = "Conversación"
        verbose_name_plural = "Conversaciones"

    def __str__(self):
        return f"Conversación con {self.client_phone} ({self.status})"


class Mensaje(models.Model):
    DIRECTION_CHOICES = [
        ('INBOUND', 'Entrante'),
        ('OUTBOUND', 'Saliente'),
    ]
    STATUS_CHOICES = [
        ('sent', 'Enviado'),
        ('delivered', 'Entregado'),
        ('read', 'Leído'),
        ('failed', 'Fallido'),
    ]

    conversacion = models.ForeignKey(Conversacion, on_delete=models.CASCADE, related_name='mensajes')
    wam_id = models.CharField(max_length=255, unique=True, help_text="WhatsApp Message ID")
    direction = models.CharField(max_length=10, choices=DIRECTION_CHOICES)
    content = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='sent')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']
        verbose_name = "Mensaje"
        verbose_name_plural = "Mensajes"

    def __str__(self):
        return f"[{self.direction}] {self.content[:30]}"


class ReglaRespuestaBot(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='reglas_bot')
    palabras_clave = models.CharField(
        max_length=500, 
        help_text="Palabras o frases separadas por comas (ej: horario, donde estan, direccion)"
    )
    respuesta = models.TextField(help_text="Respuesta que enviará el bot cuando detecte alguna de las palabras clave")
    activa = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Regla de Respuesta Bot"
        verbose_name_plural = "Reglas de Respuesta Bot"

    def __str__(self):
        return f"Regla: {self.palabras_clave[:30]} ({'Activa' if self.activa else 'Inactiva'})"
