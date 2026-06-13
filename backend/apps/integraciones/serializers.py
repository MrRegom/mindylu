from rest_framework import serializers
from .models import ReglaRespuestaBot

class ReglaRespuestaBotSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReglaRespuestaBot
        fields = ['id', 'palabras_clave', 'respuesta', 'activa', 'created_at']
        read_only_fields = ['id', 'created_at']
