import os
import sys
import django

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.base')
django.setup()

from apps.core.models import Tenant
from apps.catalogo.models import Categoria, TallaPredefinida, ColorPredefinido, NombrePrendaPredefinido

def seed_predefinidos():
    tenants = Tenant.objects.all()
    if not tenants.exists():
        print("No hay tenants configurados.")
        return

    categorias = ["Sweaters y Chalecos", "Poleras y Blusas", "Pantalones y Jeans", "Chaquetas y Abrigos", "Vestidos y Faldas", "Básicos", "Accesorios"]
    tallas = ["Única", "S", "M", "L", "XL", "XXL", "36", "38", "40", "42", "44", "46", "48"]
    colores = ["Negro", "Blanco", "Gris", "Beige", "Crudo", "Café", "Rojo", "Burdeo", "Vino", "Azul Marino", "Celeste", "Verde Musgo", "Verde Esmeralda", "Amarillo", "Mostaza", "Rosa", "Fucsia", "Morado", "Lila", "Naranja", "Terracota", "Camel", "Multicolor", "Animal Print"]
    nombres = ["Sweater Lanilla", "Sweater Básico", "Sweater Cuello V", "Sweater Cuello Tortuga", "Sweater Manga Murciélago", "Chaleco Abierto", "Cárdigan Largo", "Polera Algodón", "Polera Pabilo", "Polera Manga Corta", "Polera Manga Larga", "Blusa de Gasa", "Blusa Estampada", "Jeans Push Up", "Jeans Mom", "Jeans Wide Leg", "Jeans Skinny", "Pantalón de Tela", "Pantalón Palazzo", "Pantalón Eco Cuero", "Calza Térmica", "Calza Deportiva", "Chaqueta Mezclilla", "Chaqueta Eco Cuero", "Abrigo de Paño", "Cortavientos", "Parka", "Vestido Largo", "Vestido Corto", "Vestido Fiesta", "Falda Larga", "Falda Corta", "Shorts Mezclilla", "Enterito", "Bikini", "Traje de Baño"]

    for tenant in tenants:
        for cat in categorias:
            Categoria.objects.get_or_create(tenant=tenant, nombre=cat)
        for talla in tallas:
            TallaPredefinida.objects.get_or_create(tenant=tenant, nombre=talla)
        for color in colores:
            ColorPredefinido.objects.get_or_create(tenant=tenant, nombre=color)
        for nombre in nombres:
            NombrePrendaPredefinido.objects.get_or_create(tenant=tenant, nombre=nombre)

    print("✅ Seed completado para TODOS los tenants.")

if __name__ == '__main__':
    seed_predefinidos()
