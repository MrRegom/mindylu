import os
import sys
import django

sys.path.append('/var/www/mindylu/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.local')
django.setup()

from django.db import transaction
from apps.core.models import Tenant
from apps.catalogo.models import Categoria, TallaPredefinida, ColorPredefinido, NombrePrendaPredefinido

categorias = [
    "Sweaters y Chalecos", "Poleras y Blusas", "Pantalones y Jeans",
    "Chaquetas y Abrigos", "Vestidos y Faldas", "Basics", "Accesorios"
]
tallas = ["Unica", "S", "M", "L", "XL", "XXL", "36", "38", "40", "42", "44", "46", "48"]
colores = [
    "Negro", "Blanco", "Gris", "Beige", "Crudo", "Cafe", "Rojo", "Burdeo", "Vino",
    "Azul Marino", "Celeste", "Verde Musgo", "Verde Esmeralda", "Amarillo", "Mostaza",
    "Rosa", "Fucsia", "Morado", "Lila", "Naranja", "Terracota", "Camel", "Multicolor"
]
nombres = [
    "Sweater Lanilla", "Sweater Basico", "Sweater Cuello V", "Sweater Cuello Tortuga",
    "Chaleco Abierto", "Cardigan Largo", "Polera Algodon", "Polera Manga Corta",
    "Polera Manga Larga", "Blusa de Gasa", "Blusa Estampada", "Jeans Push Up",
    "Jeans Mom", "Jeans Wide Leg", "Jeans Skinny", "Pantalon de Tela",
    "Pantalon Palazzo", "Pantalon Eco Cuero", "Calza Termica", "Calza Deportiva",
    "Chaqueta Mezclilla", "Chaqueta Eco Cuero", "Abrigo de Pano", "Parka",
    "Vestido Largo", "Vestido Corto", "Vestido Fiesta", "Falda Larga",
    "Falda Corta", "Shorts Mezclilla", "Enterito", "Bikini", "Traje de Banio"
]

with transaction.atomic():
    for t in Tenant.objects.all():
        print(f"Procesando tenant {t.id}: {t.nombre}")

        existing_cats = Categoria.objects.filter(tenant=t).count()
        print(f"  Categorias existentes: {existing_cats}")

        if existing_cats == 0:
            for c in categorias:
                obj = Categoria(tenant=t, nombre=c)
                obj.save()
                print(f"  Creada categoria: {c}")
        
        if TallaPredefinida.objects.filter(tenant=t).count() == 0:
            for ta in tallas:
                TallaPredefinida(tenant=t, nombre=ta).save()

        if ColorPredefinido.objects.filter(tenant=t).count() == 0:
            for co in colores:
                ColorPredefinido(tenant=t, nombre=co).save()

        if NombrePrendaPredefinido.objects.filter(tenant=t).count() == 0:
            for n in nombres:
                NombrePrendaPredefinido(tenant=t, nombre=n).save()

# Verificar
print("\n=== VERIFICACION FINAL ===")
for t in Tenant.objects.all():
    print(f"Tenant {t.id}: {Categoria.objects.filter(tenant=t).count()} categorias")
    for c in Categoria.objects.filter(tenant=t):
        print(f"  - {c.id}: {c.nombre}")
