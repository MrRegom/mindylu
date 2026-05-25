# ─────────────────────────────────────────────────────────────
# apps/clientas/serializers.py
# ─────────────────────────────────────────────────────────────

from rest_framework import serializers
from .models import Clienta


class ClientaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Clienta
        fields = [
            'id', 'nombre', 'telefono', 'email', 
            'perfil_facebook', 'perfil_instagram', 
            'notas', 'fecha_registro', 'activa'
        ]
        read_only_fields = ['fecha_registro']

    def create(self, validated_data):
        # Auto-asignar el tenant del usuario autenticado
        validated_data['tenant'] = self.context['request'].user.tenant
        return super().create(validated_data)
