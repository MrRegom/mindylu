from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import CuentaBancaria, MovimientoCuenta
from .serializers import CuentaBancariaSerializer, MovimientoCuentaSerializer

class CuentaBancariaViewSet(viewsets.ModelViewSet):
    serializer_class = CuentaBancariaSerializer

    def get_queryset(self):
        return CuentaBancaria.objects.filter(tenant=self.request.user.tenant, activa=True)

    @action(detail=True, methods=['post'], url_path='registrar-movimiento')
    def registrar_movimiento(self, request, pk=None):
        cuenta = self.get_object()
        monto = request.data.get('monto')
        descripcion = request.data.get('descripcion', '')
        pedido_id = request.data.get('pedido_id')
        
        if not monto:
            return Response({'error': 'El monto es requerido'}, status=status.HTTP_400_BAD_REQUEST)
            
        movimiento = MovimientoCuenta.objects.create(
            cuenta=cuenta,
            monto=monto,
            descripcion=descripcion,
            pedido_id=pedido_id
        )
        
        serializer = MovimientoCuentaSerializer(movimiento)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='sugerida')
    def sugerida(self):
        # Retorna la cuenta con menor porcentaje de uso
        cuentas = self.get_queryset()
        if not cuentas.exists():
            return Response({'error': 'No hay cuentas registradas'}, status=status.HTTP_404_NOT_FOUND)
            
        # Ordenar cuentas usando la propiedad calculada
        cuentas_ordenadas = sorted(
            cuentas, 
            key=lambda c: (c.total_ingresos_mes_actual / c.limite_mensual_ingresos) if c.limite_mensual_ingresos > 0 else 0
        )
        
        cuenta_optima = cuentas_ordenadas[0]
        serializer = self.get_serializer(cuenta_optima)
        return Response(serializer.data)
