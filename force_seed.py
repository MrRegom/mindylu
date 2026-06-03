import os
import sys
import django

sys.path.append('/var/www/mindylu/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.local')
django.setup()

from apps.core.models import Tenant
from apps.catalogo.models import Categoria, TallaPredefinida, ColorPredefinido, NombrePrendaPredefinido

categorias = ["Sweaters y Chalecos", "Poleras y Blusas", "Pantalones y Jeans", "Chaquetas y Abrigos", "Vestidos y Faldas", "Básicos", "Accesorios"]
tallas = ["Única", "S", "M", "L", "XL", "XXL", "36", "38", "40", "42", "44", "46", "48"]
colores = ["Negro", "Blanco", "Gris", "Beige", "Crudo", "Café", "Rojo", "Burdeo", "Vino", "Azul Marino", "Celeste", "Verde Musgo", "Verde Esmeralda", "Amarillo", "Mostaza", "Rosa", "Fucsia", "Morado", "Lila", "Naranja", "Terracota", "Camel", "Multicolor", "Animal Print"]
nombres = ["Sweater Lanilla", "Sweater Básico", "Sweater Cuello V", "Sweater Cuello Tortuga", "Sweater Manga Murciélago", "Chaleco Abierto", "Cárdigan Largo", "Polera Algodón", "Polera Pabilo", "Polera Manga Corta", "Polera Manga Larga", "Blusa de Gasa", "Blusa Estampada", "Jeans Push Up", "Jeans Mom", "Jeans Wide Leg", "Jeans Skinny", "Pantalón de Tela", "Pantalón Palazzo", "Pantalón Eco Cuero", "Calza Térmica", "Calza Deportiva", "Chaqueta Mezclilla", "Chaqueta Eco Cuero", "Abrigo de Paño", "Cortavientos", "Parka", "Vestido Largo", "Vestido Corto", "Vestido Fiesta", "Falda Larga", "Falda Corta", "Shorts Mezclilla", "Enterito", "Bikini", "Traje de Baño"]

for t in Tenant.objects.all():
    print(f"Forzando creacion para tenant {t.id}...")
    
    # Limpiar existentes
    Categoria.objects.filter(tenant=t).delete()
    TallaPredefinida.objects.filter(tenant=t).delete()
    ColorPredefinido.objects.filter(tenant=t).delete()
    NombrePrendaPredefinido.objects.filter(tenant=t).delete()

    for c in categorias:
        Categoria.objects.create(tenant=t, nombre=c)
    for ta in tallas:
        TallaPredefinida.objects.create(tenant=t, nombre=ta)
    for co in colores:
        ColorPredefinido.objects.create(tenant=t, nombre=co)
    for n in nombres:
        NombrePrendaPredefinido.objects.create(tenant=t, nombre=n)

print("Finalizado.")
