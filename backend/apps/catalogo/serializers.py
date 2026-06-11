# ─────────────────────────────────────────────────────────────
# apps/catalogo/serializers.py
# ─────────────────────────────────────────────────────────────

from rest_framework import serializers
from .models import CicloVenta, Prenda, PrendaVariante, PrendaImagen, Categoria, ColorPredefinido, TallaPredefinida, NombrePrendaPredefinido

class ColorPredefinidoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ColorPredefinido
        fields = ['id', 'nombre', 'hex_code']

class TallaPredefinidaSerializer(serializers.ModelSerializer):
    class Meta:
        model = TallaPredefinida
        fields = ['id', 'nombre']

class NombrePrendaPredefinidoSerializer(serializers.ModelSerializer):
    class Meta:
        model = NombrePrendaPredefinido
        fields = ['id', 'nombre']

class CategoriaSerializer(serializers.ModelSerializer):
    """Serializer CRUD para las categorías del tenant."""
    class Meta:
        model = Categoria
        fields = ['id', 'nombre', 'icono']


class PrendaImagenSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrendaImagen
        fields = ['id', 'imagen', 'color', 'orden']


class PrendaVarianteSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)
    class Meta:
        model = PrendaVariante
        fields = ['id', 'color', 'talla', 'cantidad']


class PrendaSerializer(serializers.ModelSerializer):
    variantes = PrendaVarianteSerializer(many=True, read_only=True)
    imagenes = PrendaImagenSerializer(many=True, read_only=True)
    categoria_nombre = serializers.CharField(source='categoria.nombre', read_only=True, default=None)

    class Meta:
        model = Prenda
        fields = [
            'id', 'nombre', 'descripcion', 'precio_compra', 'precio', 'foto_url',
            'talla_tipo', 'estado', 'fecha_creacion', 'fecha_ultima_carga',
            'categoria', 'categoria_nombre',
            'variantes', 'imagenes', 'ciclo'
        ]
        read_only_fields = ['estado', 'fecha_creacion', 'fecha_ultima_carga']


class PrendaCreateUpdateSerializer(serializers.ModelSerializer):
    variantes = PrendaVarianteSerializer(many=True)

    class Meta:
        model = Prenda
        fields = [
            'id', 'nombre', 'descripcion', 'precio_compra', 'precio', 'foto_url',
            'talla_tipo', 'ciclo', 'categoria', 'variantes'
        ]

    def create(self, validated_data):
        variantes_data = validated_data.pop('variantes', [])
        tenant = self.context['request'].user.tenant
        prenda = Prenda.objects.create(tenant=tenant, **validated_data)
        for var_data in variantes_data:
            PrendaVariante.objects.create(prenda=prenda, **var_data)
        return prenda

    def update(self, instance, validated_data):
        variantes_data = validated_data.pop('variantes', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if variantes_data is not None:
            variantes_enviadas_ids = [item.get('id') for item in variantes_data if item.get('id')]
            for var_data in variantes_data:
                var_id = var_data.get('id')
                if var_id:
                    try:
                        variante = PrendaVariante.objects.get(id=var_id, prenda=instance)
                        variante.color = var_data.get('color', variante.color)
                        variante.talla = var_data.get('talla', variante.talla)
                        variante.cantidad = var_data.get('cantidad', variante.cantidad)
                        variante.save()
                    except PrendaVariante.DoesNotExist:
                        pass
                else:
                    PrendaVariante.objects.create(prenda=instance, **var_data)
            PrendaVariante.objects.filter(prenda=instance).exclude(id__in=variantes_enviadas_ids).update(cantidad=0)
        return instance


class CicloVentaSerializer(serializers.ModelSerializer):
    prendas_count = serializers.IntegerField(source='prendas.count', read_only=True)

    class Meta:
        model = CicloVenta
        fields = ['id', 'fecha_publicacion', 'url_facebook_post', 'estado', 'prendas_count']
