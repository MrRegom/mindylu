# ─────────────────────────────────────────────────────────────
# apps/catalogo/serializers.py
# ─────────────────────────────────────────────────────────────

from rest_framework import serializers
from .models import CicloVenta, Prenda, PrendaVariante, PrendaImagen


class PrendaImagenSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrendaImagen
        fields = ['id', 'imagen', 'orden']


class PrendaVarianteSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)
    class Meta:
        model = PrendaVariante
        fields = ['id', 'color', 'talla', 'cantidad']


class PrendaSerializer(serializers.ModelSerializer):
    variantes = PrendaVarianteSerializer(many=True, read_only=True)
    imagenes = PrendaImagenSerializer(many=True, read_only=True)
    
    class Meta:
        model = Prenda
        fields = [
            'id', 'nombre', 'precio', 'foto_url', 
            'talla_tipo', 'estado', 'fecha_creacion',
            'variantes', 'imagenes', 'ciclo'
        ]
        read_only_fields = ['estado', 'fecha_creacion']


class PrendaCreateUpdateSerializer(serializers.ModelSerializer):
    variantes = PrendaVarianteSerializer(many=True)

    class Meta:
        model = Prenda
        fields = [
            'id', 'nombre', 'precio', 'foto_url', 
            'talla_tipo', 'ciclo', 'variantes'
        ]

    def create(self, validated_data):
        variantes_data = validated_data.pop('variantes', [])
        # Obtenemos el tenant del request
        tenant = self.context['request'].user.tenant
        
        prenda = Prenda.objects.create(tenant=tenant, **validated_data)
        
        for var_data in variantes_data:
            PrendaVariante.objects.create(prenda=prenda, **var_data)
            
        return prenda

    def update(self, instance, validated_data):
        variantes_data = validated_data.pop('variantes', None)
        
        # Actualizar campos de la Prenda
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if variantes_data is not None:
            variantes_enviadas_ids = [item.get('id') for item in variantes_data if item.get('id')]
            
            # Actualizar o crear
            for var_data in variantes_data:
                var_id = var_data.get('id')
                if var_id:
                    # Actualizar existente
                    try:
                        variante = PrendaVariante.objects.get(id=var_id, prenda=instance)
                        variante.color = var_data.get('color', variante.color)
                        variante.talla = var_data.get('talla', variante.talla)
                        variante.cantidad = var_data.get('cantidad', variante.cantidad)
                        variante.save()
                    except PrendaVariante.DoesNotExist:
                        pass
                else:
                    # Crear nueva
                    PrendaVariante.objects.create(prenda=instance, **var_data)
            
            # Las que están en la base de datos pero no vinieron en la petición se marcan como agotadas (cantidad=0)
            # para no romper el historial de pedidos con IntegrityError
            PrendaVariante.objects.filter(prenda=instance).exclude(id__in=variantes_enviadas_ids).update(cantidad=0)
            
        return instance


class CicloVentaSerializer(serializers.ModelSerializer):
    prendas_count = serializers.IntegerField(source='prendas.count', read_only=True)

    class Meta:
        model = CicloVenta
        fields = ['id', 'fecha_publicacion', 'url_facebook_post', 'estado', 'prendas_count']
