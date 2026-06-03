"""
Script de poblar categorías iniciales para todos los tenants existentes.
Se ejecuta una sola vez via: python manage.py shell < seed_categorias.py
"""
from apps.catalogo.models import Categoria
from apps.core.models import Tenant

CATEGORIAS_INICIALES = [
    'Sweaters',
    'Blusas',
    'Vestidos',
    'Pantalones',
    'Faldas',
    'Leggings',
    'Chaquetas',
    'Abrigos',
    'Conjuntos',
    'Bodys',
    'Camisetas',
    'Shorts',
    'Accesorios',
    'Zapatos',
    'Carteras',
]

tenants = Tenant.objects.all()
total = 0
for tenant in tenants:
    for nombre in CATEGORIAS_INICIALES:
        obj, created = Categoria.objects.get_or_create(tenant=tenant, nombre=nombre)
        if created:
            total += 1
            print(f"  ✓ [{tenant.nombre}] {nombre}")
        else:
            print(f"  - [{tenant.nombre}] {nombre} (ya existía)")

print(f"\nTotal categorías creadas: {total}")
