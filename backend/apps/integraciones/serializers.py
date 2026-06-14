from rest_framework import serializers
from .models import ReglaRespuestaBot, RespuestaRapida

class RespuestaRapidaSerializer(serializers.ModelSerializer):
    class Meta:
        model = RespuestaRapida
        fields = ['id', 'titulo', 'mensaje', 'orden', 'created_at']
        read_only_fields = ['id', 'created_at']

class ReglaRespuestaBotSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReglaRespuestaBot
        fields = ['id', 'palabras_clave', 'respuesta', 'activa', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate_palabras_clave(self, value):
        if not value:
            return value
        
        request = self.context.get('request')
        if not request or not hasattr(request, 'user') or not request.user.tenant:
            return value

        tenant = request.user.tenant
        palabras_nuevas = [p.strip().lower() for p in value.split(',') if p.strip()]
        
        qs = ReglaRespuestaBot.objects.filter(tenant=tenant)
        if self.instance:
            qs = qs.exclude(id=self.instance.id)

        for regla in qs:
            palabras_existentes = [p.strip().lower() for p in regla.palabras_clave.split(',') if p.strip()]
            interseccion = set(palabras_nuevas).intersection(set(palabras_existentes))
            if interseccion:
                palabras_str = ", ".join(interseccion)
                raise serializers.ValidationError(f"Las palabras '{palabras_str}' ya están siendo usadas en otra regla.")
                
        return value
