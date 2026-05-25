# apps/cuentas/models.py
from django.db import models
from apps.core.models import Tenant
from apps.pedidos.models import Pedido
from django.utils.translation import gettext_lazy as _
import datetime

class CuentaBancaria(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='cuentas_bancarias')
    banco = models.CharField(max_length=100)
    tipo_cuenta = models.CharField(max_length=50) # Ej: Cuenta RUT, Vista, Corriente
    numero_cuenta = models.CharField(max_length=50)
    rut_titular = models.CharField(max_length=20)
    nombre_titular = models.CharField(max_length=100)
    email_notificacion = models.EmailField(blank=True)
    limite_mensual_ingresos = models.IntegerField(default=4000000)
    limite_mensual_transferencias = models.IntegerField(default=50) # Ley SII Chile
    activa = models.BooleanField(default=True)
    
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_modificacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'cuenta_bancaria'
        unique_together = [['tenant', 'numero_cuenta', 'banco']]

    def __str__(self):
        return f"{self.banco} - {self.tipo_cuenta} ({self.nombre_titular})"

    @property
    def total_ingresos_mes_actual(self):
        hoy = datetime.date.today()
        movimientos = self.movimientos.filter(
            fecha__year=hoy.year,
            fecha__month=hoy.month
        )
        return sum(mov.monto for mov in movimientos)

    @property
    def total_transferencias_mes_actual(self):
        hoy = datetime.date.today()
        return self.movimientos.filter(
            fecha__year=hoy.year,
            fecha__month=hoy.month
        ).count()

    @property
    def estado_semaforo(self):
        total = self.total_ingresos_mes_actual
        if self.limite_mensual_ingresos <= 0:
            return 'verde'
            
        porcentaje = (total / self.limite_mensual_ingresos) * 100
        
        if porcentaje < 50:
            return 'verde'
        elif 50 <= porcentaje < 80:
            return 'amarillo'
        else:
            return 'rojo'

    @property
    def estado_semaforo_transferencias(self):
        total_transf = self.total_transferencias_mes_actual
        if self.limite_mensual_transferencias <= 0:
            return 'verde'
            
        porcentaje = (total_transf / self.limite_mensual_transferencias) * 100
        
        if porcentaje < 50: # menos de 25
            return 'verde'
        elif 50 <= porcentaje < 80: # entre 25 y 40
            return 'amarillo'
        else: # 40 o más
            return 'rojo'


class MovimientoCuenta(models.Model):
    cuenta = models.ForeignKey(CuentaBancaria, on_delete=models.CASCADE, related_name='movimientos')
    monto = models.IntegerField()
    fecha = models.DateField(default=datetime.date.today)
    pedido = models.ForeignKey(Pedido, on_delete=models.SET_NULL, null=True, blank=True, related_name='pagos')
    descripcion = models.CharField(max_length=255, blank=True)
    
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'movimiento_cuenta'

    def __str__(self):
        return f"+${self.monto} a {self.cuenta.banco} ({self.fecha})"
