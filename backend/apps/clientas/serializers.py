# ─────────────────────────────────────────────────────────────
# apps/clientas/serializers.py
# ─────────────────────────────────────────────────────────────

from rest_framework import serializers
from .models import Clienta


class ClientaSerializer(serializers.ModelSerializer):
    historial_compras = serializers.SerializerMethodField()
    cuenta_asignada_detalle = serializers.SerializerMethodField()

    class Meta:
        model = Clienta
        fields = [
            'id', 'nombre', 'telefono', 'email', 
            'perfil_facebook', 'perfil_instagram', 
            'notas', 'fecha_registro', 'activa', 'historial_compras',
            'cuenta_asignada', 'cuenta_asignada_detalle'
        ]
        read_only_fields = ['fecha_registro']

    def get_historial_compras(self, obj):
        pedidos = obj.pedidos.all().order_by('-fecha_pedido')
        return [{
            'id': p.id,
            'estado': p.estado,
            'estado_display': p.get_estado_display(),
            'fecha': p.fecha_pedido.strftime('%Y-%m-%d %H:%M'),
            'total': p.total()
        } for p in pedidos]

    def get_cuenta_asignada_detalle(self, obj):
        if obj.cuenta_asignada:
            return f"{obj.cuenta_asignada.banco} - {obj.cuenta_asignada.tipo_cuenta} ({obj.cuenta_asignada.numero_cuenta})"
        return None

    def validate_telefono(self, value):
        import re
        # Extraer solo numeros
        telefono_limpio = re.sub(r'\D', '', value)
        if not telefono_limpio:
            raise serializers.ValidationError("El número de teléfono no es válido.")
            
        request = self.context.get('request')
        tenant = request.user.tenant if request and hasattr(request.user, 'tenant') else None
        
        if tenant:
            qs = Clienta.objects.filter(tenant=tenant, telefono=telefono_limpio)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
                
            if qs.exists():
                raise serializers.ValidationError("Ya existe una clienta registrada con este número de teléfono.")
                
        return telefono_limpio

    def create(self, validated_data):
        # Auto-asignar el tenant del usuario autenticado
        validated_data['tenant'] = self.context['request'].user.tenant
        return super().create(validated_data)

    def validate_telefono(self, value):
        if not value:
            return value
        tenant = self.context['request'].user.tenant
        qs = Clienta.objects.filter(tenant=tenant, telefono=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Ya existe una clienta con este número de teléfono.")
        return value
