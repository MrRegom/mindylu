# ─────────────────────────────────────────────────────────────
# apps/pedidos/views.py
# ─────────────────────────────────────────────────────────────

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone

from apps.catalogo.models import PrendaVariante
from apps.clientas.models import Clienta
from .models import PuntoEntrega, Pedido, ItemPedido, EntregaDiaria
from .serializers import (
    PuntoEntregaSerializer, PedidoSerializer, 
    EntregaDiariaSerializer, PedidoCreateDesdeCatalogoSerializer,
    EntregaDiariaPublicaSerializer
)
from rest_framework.permissions import AllowAny
from apps.core.models import Tenant


class PuntoEntregaViewSet(viewsets.ModelViewSet):
    serializer_class = PuntoEntregaSerializer

    def get_queryset(self):
        return PuntoEntrega.objects.filter(tenant=self.request.user.tenant)


class PedidoViewSet(viewsets.ModelViewSet):
    serializer_class = PedidoSerializer

    def get_queryset(self):
        qs = Pedido.objects.filter(tenant=self.request.user.tenant)
        
        estado = self.request.query_params.get('estado')
        if estado:
            qs = qs.filter(estado=estado)
            
        sin_ruta = self.request.query_params.get('sin_ruta')
        if sin_ruta == 'true':
            qs = qs.filter(rutas_entrega__isnull=True)
            
        return qs

    @action(detail=False, methods=['post'], url_path='crear-desde-catalogo')
    def crear_desde_catalogo(self, request):
        """
        Endpoint que recibe los datos desde el Modal de Catálogo y orquesta la creación:
        1. Descuenta stock de la variante.
        2. Crea el Pedido.
        3. Crea el ItemPedido.
        4. Agrega a la EntregaDiaria correspondiente.
        """
        serializer = PedidoCreateDesdeCatalogoSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        tenant = request.user.tenant

        try:
            from apps.pedidos.services import PedidoService
            pedido = PedidoService.crear_pedido_desde_catalogo(tenant, data)
            
            serializer = self.get_serializer(pedido)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except PrendaVariante.DoesNotExist:
            return Response({'error': 'Variante no encontrada'}, status=status.HTTP_404_NOT_FOUND)
        except Clienta.DoesNotExist:
            return Response({'error': 'Clienta no encontrada.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], url_path='cancelar')
    def cancelar(self, request, pk=None):
        """
        Cancela el pedido y devuelve el stock.
        """
        pedido = self.get_object()
        
        if pedido.estado in [Pedido.Estado.CANCELADO, Pedido.Estado.ENTREGADO]:
            return Response({'error': 'No se puede cancelar en este estado.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            with transaction.atomic():
                pedido.estado = Pedido.Estado.CANCELADO
                pedido.save()
                
                # Quitar del viaje de entrega si estaba
                if pedido.rutas_entrega.exists():
                    for ruta in pedido.rutas_entrega.all():
                        ruta.pedidos.remove(pedido)

                # Devolver stock
                for item in pedido.items.select_for_update().all():
                    variante = item.variante
                    variante.cantidad += item.cantidad
                    variante.save()
                    
                    if variante.prenda.estado == 'agotada':
                        variante.prenda.estado = 'activa'
                        variante.prenda.save()
                        
            return Response({'status': 'Pedido cancelado y stock devuelto.'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], url_path='entregar')
    def entregar(self, request, pk=None):
        """
        Marca el pedido como Entregado.
        """
        pedido = self.get_object()
        if pedido.estado != Pedido.Estado.APARTADO and pedido.estado != Pedido.Estado.PAGADO:
            return Response({'error': 'Solo se pueden entregar pedidos apartados o pagados.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                pedido.estado = Pedido.Estado.ENTREGADO
                pedido.save()
            return Response({'status': 'Pedido marcado como entregado.'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], url_path='desvincular_ruta')
    def desvincular_ruta(self, request, pk=None):
        """
        Quita el pedido de la ruta diaria actual (para inasistencias o reagendamiento), 
        pero lo mantiene en estado APARTADO.
        """
        pedido = self.get_object()
        ruta_id = request.data.get('ruta_id')
        
        try:
            with transaction.atomic():
                if ruta_id:
                    ruta = EntregaDiaria.objects.get(id=ruta_id, tenant=request.user.tenant)
                    ruta.pedidos.remove(pedido)
                else:
                    # Remover de todas las rutas si no se especifica
                    for ruta in pedido.rutas_entrega.all():
                        ruta.pedidos.remove(pedido)
            return Response({'status': 'Pedido desvinculado de la ruta correctamente.'})
        except EntregaDiaria.DoesNotExist:
            return Response({'error': 'Ruta no encontrada.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], url_path='asignar_ruta')
    def asignar_ruta(self, request, pk=None):
        """
        Asigna el pedido a una ruta específica.
        """
        pedido = self.get_object()
        ruta_id = request.data.get('ruta_id')
        
        if not ruta_id:
            return Response({'error': 'Debe proveer una ruta_id.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            with transaction.atomic():
                ruta = EntregaDiaria.objects.get(id=ruta_id, tenant=request.user.tenant)
                ruta.pedidos.add(pedido)
            return Response({'status': 'Pedido asignado a la ruta correctamente.'})
        except EntregaDiaria.DoesNotExist:
            return Response({'error': 'Ruta no encontrada.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class EntregaDiariaViewSet(viewsets.ModelViewSet):
    """
    Vista para el Tablero del Día.
    Trae las entregas de hoy o futuras ordenadas y permite editar la hora.
    """
    serializer_class = EntregaDiariaSerializer

    def get_queryset(self):
        # Usamos timedelta para no esconder rutas por desface de zona horaria o de un par de días atrás.
        from datetime import timedelta
        hoy = timezone.localdate()
        return EntregaDiaria.objects.filter(
            tenant=self.request.user.tenant,
            fecha__gte=hoy - timedelta(days=2)
        ).prefetch_related('pedidos', 'pedidos__clienta', 'pedidos__items__variante__prenda')

    @action(detail=False, methods=['get'], permission_classes=[])
    def debug_filtered(self, request):
        from datetime import timedelta
        hoy = timezone.localdate()
        qs = EntregaDiaria.objects.filter(
            tenant_id=1,
            fecha__gte=hoy - timedelta(days=2)
        )
        return Response({
            "hoy": str(hoy),
            "gte": str(hoy - timedelta(days=2)),
            "count": qs.count(),
            "results": list(qs.values('id', 'fecha', 'punto_entrega_id', 'hora_estimada'))
        })

    def create(self, request, *args, **kwargs):
        # Evitamos el error de unique_together si el usuario intenta crear una ruta que ya existe.
        tenant = request.user.tenant
        fecha = request.data.get('fecha')
        punto_entrega_id = request.data.get('punto_entrega')
        hora_estimada = request.data.get('hora_estimada')
        
        if not fecha or not punto_entrega_id:
            return Response({'error': 'Faltan datos'}, status=status.HTTP_400_BAD_REQUEST)
            
        entrega, created = EntregaDiaria.objects.get_or_create(
            tenant=tenant,
            fecha=fecha,
            punto_entrega_id=punto_entrega_id
        )
        
        if hora_estimada:
            entrega.hora_estimada = hora_estimada
            entrega.save()
            
        serializer = self.get_serializer(entrega)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

class EntregaDiariaPublicaView(viewsets.ReadOnlyModelViewSet):
    """
    Vista pública para mostrar el itinerario de entregas en el catálogo.
    Solo expone información segura.
    """
    serializer_class = EntregaDiariaPublicaSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        hoy = timezone.localdate()
        # Asumiendo tenant_id = 1 para la vista pública inicial.
        tenant = Tenant.objects.first()
        if not tenant:
            return EntregaDiaria.objects.none()
        
        return EntregaDiaria.objects.filter(
            tenant=tenant,
            fecha__gte=hoy
        ).order_by('fecha', 'hora_estimada')
