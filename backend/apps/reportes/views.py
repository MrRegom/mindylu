from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Sum, F

from apps.pedidos.models import Pedido, ItemPedido
from apps.catalogo.models import Prenda
from apps.clientas.models import Clienta

class DashboardAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant = request.user.tenant
        hoy = timezone.localdate()
        
        # 1. Ventas de Hoy (Total de pedidos creados hoy, independientemente del estado)
        ventas_hoy = ItemPedido.objects.filter(
            pedido__tenant=tenant, 
            pedido__fecha_pedido__date=hoy
        ).aggregate(
            total=Sum(F('cantidad') * F('precio_unitario'))
        )['total'] or 0
        
        # 2. Entregas Pendientes (Pedidos en estado Apartado o Pagado)
        entregas_pendientes = Pedido.objects.filter(
            tenant=tenant,
            estado__in=['apartado', 'pagado']
        ).count()
        
        # 3. Saldos por cobrar (Valor de los pedidos que están en estado 'apartado')
        saldos = ItemPedido.objects.filter(
            pedido__tenant=tenant,
            pedido__estado='apartado'
        ).aggregate(
            total=Sum(F('cantidad') * F('precio_unitario'))
        )['total'] or 0
        
        # 4. Prendas activas en el catálogo
        prendas_activas = Prenda.objects.filter(tenant=tenant).count()
        
        return Response({
            'ventas_hoy': ventas_hoy,
            'entregas_pendientes': entregas_pendientes,
            'saldos_pendientes': saldos,
            'prendas_activas': prendas_activas
        })
