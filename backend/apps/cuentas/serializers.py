from rest_framework import serializers
from .models import CuentaBancaria, MovimientoCuenta

class MovimientoCuentaSerializer(serializers.ModelSerializer):
    class Meta:
        model = MovimientoCuenta
        fields = ['id', 'monto', 'fecha', 'pedido', 'descripcion', 'fecha_creacion']
        read_only_fields = ['fecha_creacion']

class CuentaBancariaSerializer(serializers.ModelSerializer):
    movimientos = MovimientoCuentaSerializer(many=True, read_only=True)
    total_ingresos_mes_actual = serializers.IntegerField(read_only=True)
    estado_semaforo = serializers.CharField(read_only=True)
    total_transferencias_mes_actual = serializers.IntegerField(read_only=True)
    estado_semaforo_transferencias = serializers.CharField(read_only=True)

    class Meta:
        model = CuentaBancaria
        fields = [
            'id', 'banco', 'tipo_cuenta', 'numero_cuenta', 'rut_titular',
            'nombre_titular', 'email_notificacion', 'limite_mensual_ingresos',
            'limite_mensual_transferencias', 'activa', 
            'total_ingresos_mes_actual', 'estado_semaforo',
            'total_transferencias_mes_actual', 'estado_semaforo_transferencias',
            'movimientos'
        ]

    def create(self, validated_data):
        validated_data['tenant'] = self.context['request'].user.tenant
        return super().create(validated_data)
