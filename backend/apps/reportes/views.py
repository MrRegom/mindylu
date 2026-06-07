from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Sum, F, Count
from datetime import timedelta

from apps.pedidos.models import Pedido, ItemPedido
from apps.catalogo.models import Prenda
from apps.clientas.models import Clienta

class DashboardAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant = request.user.tenant
        hoy = timezone.localdate()
        
        # 1. Ventas de Hoy
        ventas_hoy = ItemPedido.objects.filter(
            pedido__tenant=tenant, 
            pedido__fecha_pedido__date=hoy
        ).aggregate(
            total=Sum(F('cantidad') * F('precio_unitario'))
        )['total'] or 0
        
        # 2. Entregas Pendientes
        entregas_pendientes = Pedido.objects.filter(
            tenant=tenant,
            estado__in=['apartado', 'pagado']
        ).count()
        
        # 3. Saldos por cobrar
        saldos = ItemPedido.objects.filter(
            pedido__tenant=tenant,
            pedido__estado='apartado'
        ).aggregate(
            total=Sum(F('cantidad') * F('precio_unitario'))
        )['total'] or 0
        
        # 4. Prendas activas
        prendas_activas = Prenda.objects.filter(tenant=tenant).count()

        # 4b. Clientes
        clientes_activos = Clienta.objects.filter(tenant=tenant).count()

        # 5. Ventas de los últimos 7 días (Para gráfico)
        ventas_semana = []
        for i in range(6, -1, -1):
            fecha = hoy - timedelta(days=i)
            total_dia = ItemPedido.objects.filter(
                pedido__tenant=tenant,
                pedido__fecha_pedido__date=fecha
            ).aggregate(total=Sum(F('cantidad') * F('precio_unitario')))['total'] or 0
            ventas_semana.append({
                'name': fecha.strftime('%a'),
                'ventas': total_dia
            })

        # 6. Top 5 Productos más vendidos (Todo el tiempo)
        top_productos = ItemPedido.objects.filter(
            pedido__tenant=tenant
        ).values(
            nombre=F('variante__prenda__nombre')
        ).annotate(
            total_vendido=Sum('cantidad')
        ).order_by('-total_vendido')[:5]

        # 7. Últimos 5 Pedidos Recientes
        pedidos_recientes = Pedido.objects.filter(tenant=tenant).order_by('-fecha_pedido')[:5]
        pedidos_data = []
        for p in pedidos_recientes:
            pedidos_data.append({
                'id': p.id,
                'cliente': p.clienta.nombre if p.clienta else 'Anónimo',
                'estado': p.estado,
                'total': p.total,
                'fecha': p.fecha_pedido.strftime('%d %b')
            })

        return Response({
            'ventas_hoy': ventas_hoy,
            'entregas_pendientes': entregas_pendientes,
            'saldos_pendientes': saldos,
            'prendas_activas': prendas_activas,
            'clientes_activos': clientes_activos,
            'ventas_semana': ventas_semana,
            'top_productos': list(top_productos),
            'pedidos_recientes': pedidos_data,
            'usuario_nombre': request.user.nombre or request.user.username,
            'usuario_avatar': request.user.avatar.url if request.user.avatar else None
        })

class ReportesAvanzadosAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant = request.user.tenant
        mes_actual = timezone.now().month
        anio_actual = timezone.now().year

        # 1. Ingresos del Mes (Pagados + Entregados)
        ingresos_mes = ItemPedido.objects.filter(
            pedido__tenant=tenant,
            pedido__fecha_pedido__year=anio_actual,
            pedido__fecha_pedido__month=mes_actual,
            pedido__estado__in=['pagado', 'entregado']
        ).aggregate(total=Sum(F('cantidad') * F('precio_unitario')))['total'] or 0

        # 2. Dinero "en la calle" (Apartados)
        dinero_en_calle = ItemPedido.objects.filter(
            pedido__tenant=tenant,
            pedido__estado='apartado'
        ).aggregate(total=Sum(F('cantidad') * F('precio_unitario')))['total'] or 0

        # 3. Clientas VIP (Top 10 por monto gastado)
        top_clientas = Clienta.objects.filter(
            tenant=tenant,
            pedidos__estado__in=['pagado', 'entregado', 'apartado']
        ).annotate(
            total_comprado=Sum(F('pedidos__items__cantidad') * F('pedidos__items__precio_unitario')),
            total_pedidos=Count('pedidos', distinct=True)
        ).filter(total_comprado__gt=0).order_by('-total_comprado')[:10]

        top_clientas_data = [{
            'id': c.id,
            'nombre': c.nombre,
            'telefono': c.telefono,
            'total_comprado': c.total_comprado,
            'total_pedidos': c.total_pedidos
        } for c in top_clientas]

        # 4. Top Categorias
        top_categorias = ItemPedido.objects.filter(
            pedido__tenant=tenant
        ).values(
            nombre_cat=F('variante__prenda__categoria__nombre')
        ).annotate(
            total_vendido=Sum('cantidad')
        ).order_by('-total_vendido')[:5]

        return Response({
            'ingresos_mes': ingresos_mes,
            'dinero_en_calle': dinero_en_calle,
            'top_clientas': top_clientas_data,
            'top_categorias': list(top_categorias)
        })
