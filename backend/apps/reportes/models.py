from django.db import models
from apps.core.models import Tenant
from apps.catalogo.models import Prenda
from django.utils.translation import gettext_lazy as _

class ConsultaInteres(models.Model):
    """
    Registra cada vez que una clienta presiona "Me interesa" en el catálogo público.
    """
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='consultas_interes')
    prenda = models.ForeignKey(Prenda, on_delete=models.CASCADE, related_name='consultas')
    fecha = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        ordering = ['-fecha']
        verbose_name = _('Consulta de Interés')
        verbose_name_plural = _('Consultas de Interés')

    def __str__(self):
        return f"Consulta {self.prenda.nombre} - {self.fecha.strftime('%d/%m/%Y %H:%M')}"
