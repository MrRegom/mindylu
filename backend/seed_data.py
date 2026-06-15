import os
import django
import sys

# Setup Django Environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.local')
django.setup()

from apps.core.models import Tenant
from apps.catalogo.models import Categoria, Prenda, PrendaVariante
from decimal import Decimal

def seed():
    tenant = Tenant.objects.first()
    if not tenant:
        print("No hay Tenant. Ejecutando core_seed primero si es posible, o creando uno.")
        tenant, _ = Tenant.objects.get_or_create(
            nombre='Lu Prenditas Default',
            slug='lu-prenditas',
            activo=True
        )

    # Limpiar catálogo anterior si existiera
    Categoria.objects.filter(tenant=tenant).delete()
    Prenda.objects.filter(tenant=tenant).delete()

    # Categorías
    cats_data = [
        ('Vestidos', 'Sparkles'),
        ('Blusas', 'Shirt'),
        ('Pantalones', 'Archive'),
        ('Abrigos', 'Box'),
        ('Accesorios', 'Star')
    ]
    
    categorias = {}
    for nombre, icono in cats_data:
        cat, _ = Categoria.objects.get_or_create(tenant=tenant, nombre=nombre, icono=icono)
        categorias[nombre] = cat

    # Prendas
    prendas_data = [
        {
            'nombre': 'Vestido Floral Primavera',
            'categoria': categorias['Vestidos'],
            'precio': Decimal('24990'),
            'foto_url': 'https://images.unsplash.com/photo-1515347619362-72e2e92c283d?auto=format&fit=crop&q=80&w=800',
            'estado': Prenda.Estado.DISPONIBLE
        },
        {
            'nombre': 'Blusa Seda Elegance',
            'categoria': categorias['Blusas'],
            'precio': Decimal('15990'),
            'foto_url': 'https://images.unsplash.com/photo-1551163943-3f6a855d1153?auto=format&fit=crop&q=80&w=800',
            'estado': Prenda.Estado.DISPONIBLE
        },
        {
            'nombre': 'Pantalón Palazo Negro',
            'categoria': categorias['Pantalones'],
            'precio': Decimal('19990'),
            'foto_url': 'https://images.unsplash.com/photo-1509631179647-0c5000642f13?auto=format&fit=crop&q=80&w=800',
            'estado': Prenda.Estado.DISPONIBLE
        },
        {
            'nombre': 'Chaleco Tejido Invierno',
            'categoria': categorias['Abrigos'],
            'precio': Decimal('29990'),
            'foto_url': 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&q=80&w=800',
            'estado': Prenda.Estado.DISPONIBLE
        },
        {
            'nombre': 'Collar Corazón Plata',
            'categoria': categorias['Accesorios'],
            'precio': Decimal('9990'),
            'foto_url': 'https://images.unsplash.com/photo-1599643478514-4a4e0f10c611?auto=format&fit=crop&q=80&w=800',
            'estado': Prenda.Estado.DISPONIBLE
        },
        {
            'nombre': 'Vestido Midi Elegante',
            'categoria': categorias['Vestidos'],
            'precio': Decimal('32990'),
            'foto_url': 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=800',
            'estado': Prenda.Estado.DISPONIBLE
        },
        {
            'nombre': 'Blusa Básica Blanca',
            'categoria': categorias['Blusas'],
            'precio': Decimal('12990'),
            'foto_url': 'https://images.unsplash.com/photo-1588117305388-c2631a279f82?auto=format&fit=crop&q=80&w=800',
            'estado': Prenda.Estado.DISPONIBLE
        },
        {
            'nombre': 'Cinturón Eco Cuero',
            'categoria': categorias['Accesorios'],
            'precio': Decimal('7990'),
            'foto_url': 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&q=80&w=800',
            'estado': Prenda.Estado.DISPONIBLE
        }
    ]

    for p in prendas_data:
        prenda = Prenda.objects.create(
            tenant=tenant,
            categoria=p['categoria'],
            nombre=p['nombre'],
            precio=p['precio'],
            foto_url=p['foto_url'],
            estado=p['estado'],
            talla_tipo=Prenda.TipoTalla.UNICA
        )
        # Crear variante por defecto
        PrendaVariante.objects.create(
            prenda=prenda,
            cantidad=10
        )

    print(f"Seed exitoso. Creadas {len(categorias)} categorías y {len(prendas_data)} prendas.")

if __name__ == '__main__':
    seed()
