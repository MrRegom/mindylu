from django.db import transaction
from apps.catalogo.models import PrendaVariante
from apps.clientas.models import Clienta
from apps.pedidos.models import Pedido, ItemPedido, EntregaDiaria
from apps.integraciones.services.whatsapp_service import WhatsappService

class PedidoService:
    @staticmethod
    @transaction.atomic
    def crear_pedido_desde_catalogo(tenant, data):
        # 1. Obtener y validar variante
        variante = PrendaVariante.objects.select_for_update().get(id=data['variante_id'], prenda__tenant=tenant)
        
        if variante.cantidad < data['cantidad']:
            raise ValueError("Stock insuficiente")

        variante.cantidad -= data['cantidad']
        variante.save()

        # Revisar si la prenda debe cambiar a agotada
        if variante.prenda.variantes.filter(cantidad__gt=0).count() == 0:
            variante.prenda.estado = 'agotada'
            variante.prenda.save()

        # 2. Obtener clienta
        clienta = Clienta.objects.get(id=data['clienta_id'], tenant=tenant)

        # 3. Determinar fecha y punto según entrega programada
        fecha_entrega = data.get('fecha_entrega_acordada')
        punto_id = data.get('punto_entrega_id')
        entrega_programada = None
        
        if data.get('entrega_diaria_id'):
            try:
                entrega_programada = EntregaDiaria.objects.get(id=data['entrega_diaria_id'], tenant=tenant)
                fecha_entrega = entrega_programada.fecha
                punto_id = entrega_programada.punto_entrega_id
            except EntregaDiaria.DoesNotExist:
                pass
        
        # 4. Obtener o crear Pedido
        # Buscamos si la clienta ya tiene un pedido "apartado" asignado a la misma fecha y lugar de entrega
        pedido = None
        if entrega_programada:
            pedido = entrega_programada.pedidos.filter(
                clienta=clienta,
                estado='apartado'
            ).first()
        elif fecha_entrega and punto_id:
            pedido = Pedido.objects.filter(
                tenant=tenant,
                clienta=clienta,
                fecha_entrega_acordada=fecha_entrega,
                punto_entrega_id=punto_id,
                estado='apartado'
            ).first()

        if pedido:
            # Si ya existe, concatenamos las notas si vienen nuevas
            nuevas_notas = data.get('notas', '')
            if nuevas_notas:
                pedido.notas = f"{pedido.notas} | {nuevas_notas}" if pedido.notas else nuevas_notas
            nuevo_estado = data.get('estado')
            if nuevo_estado in [Pedido.Estado.PAGADO, Pedido.Estado.POR_PAGAR]:
                pedido.estado = nuevo_estado
            pedido.save()
        else:
            # Si no existe, creamos uno nuevo
            pedido = Pedido.objects.create(
                tenant=tenant,
                clienta=clienta,
                estado=data.get('estado', Pedido.Estado.APARTADO),
                fecha_entrega_acordada=fecha_entrega,
                punto_entrega_id=punto_id,
                notas=data.get('notas', '')
            )

        # 5. Crear o actualizar ItemPedido
        # Si la misma variante ya estaba en el pedido, sumamos cantidad. Si no, creamos un item nuevo.
        item_pedido, created = ItemPedido.objects.get_or_create(
            pedido=pedido,
            variante=variante,
            defaults={'cantidad': 0, 'precio_unitario': variante.prenda.precio}
        )
        item_pedido.cantidad += data['cantidad']
        item_pedido.save()

        # 6. Organizar en EntregaDiaria
        if entrega_programada:
            entrega_programada.pedidos.add(pedido)
        elif pedido.fecha_entrega_acordada and pedido.punto_entrega_id:
            entrega, created = EntregaDiaria.objects.get_or_create(
                tenant=tenant,
                fecha=pedido.fecha_entrega_acordada,
                punto_entrega_id=pedido.punto_entrega_id
            )
            entrega.pedidos.add(pedido)

        # Send auto-message for Apartado
        if clienta.telefono:
            try:
                wa_service = WhatsappService(tenant=tenant)
                wa_service.enviar_mensaje_directo(
                    clienta.telefono,
                    "¡Hola Linda! Te confirmo que ya dejé tu prendita separada a tu nombre. Muchas gracias por tu compra 💕"
                )
            except Exception as e:
                pass # Non-blocking message sending

        return pedido
