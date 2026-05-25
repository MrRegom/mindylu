# ─────────────────────────────────────────────────────────────
# apps/pedidos/serializers.py
# ─────────────────────────────────────────────────────────────

from rest_framework import serializers
from .models import PuntoEntrega, Pedido, ItemPedido, EntregaDiaria
from apps.clientas.serializers import ClientaSerializer
from apps.catalogo.serializers import PrendaVarianteSerializer

class PuntoEntregaSerializer(serializers.ModelSerializer):
    class Meta:
        model = PuntoEntrega
        fields = ['id', 'nombre', 'ciudad']

    def create(self, validated_data):
        validated_data['tenant'] = self.context['request'].user.tenant
        return super().create(validated_data)


class ItemPedidoSerializer(serializers.ModelSerializer):
    variante_detalle = PrendaVarianteSerializer(source='variante', read_only=True)
    
    class Meta:
        model = ItemPedido
        fields = ['id', 'variante', 'variante_detalle', 'cantidad', 'precio_unitario', 'subtotal']
        read_only_fields = ['precio_unitario']


class PedidoSerializer(serializers.ModelSerializer):
    items = ItemPedidoSerializer(many=True, read_only=True)
    clienta_detalle = ClientaSerializer(source='clienta', read_only=True)
    punto_entrega_detalle = PuntoEntregaSerializer(source='punto_entrega', read_only=True)
    total = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Pedido
        fields = [
            'id', 'clienta', 'clienta_detalle', 'estado', 
            'fecha_pedido', 'fecha_entrega_acordada', 
            'punto_entrega', 'punto_entrega_detalle', 
            'notas', 'items', 'total'
        ]
        read_only_fields = ['fecha_pedido', 'estado']

    def create(self, validated_data):
        validated_data['tenant'] = self.context['request'].user.tenant
        return super().create(validated_data)


class PedidoCreateDesdeCatalogoSerializer(serializers.Serializer):
    """
    Serializador especial para el flujo: "Vender desde Catálogo".
    Recibe la clienta, la variante, cantidad y opcionalmente datos de entrega antigua o el id de una ruta programada.
    """
    clienta_id = serializers.IntegerField()
    variante_id = serializers.IntegerField()
    cantidad = serializers.IntegerField(default=1)
    
    entrega_diaria_id = serializers.IntegerField(required=False, allow_null=True)
    
    fecha_entrega_acordada = serializers.DateField(required=False, allow_null=True)
    punto_entrega_id = serializers.IntegerField(required=False, allow_null=True)
    notas = serializers.CharField(required=False, allow_blank=True)


class EntregaDiariaSerializer(serializers.ModelSerializer):
    punto_entrega_detalle = PuntoEntregaSerializer(source='punto_entrega', read_only=True)
    pedidos = PedidoSerializer(many=True, read_only=True)
    
    class Meta:
        model = EntregaDiaria
        fields = [
            'id', 'fecha', 'punto_entrega', 'punto_entrega_detalle', 
            'hora_estimada', 'recordatorios_enviados', 'pedidos'
        ]

    def create(self, validated_data):
        validated_data['tenant'] = self.context['request'].user.tenant
        return super().create(validated_data)
