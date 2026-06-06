import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.prod')
django.setup()
from apps.catalogo.models import Prenda, PrendaVariante
from apps.core.models import Tenant

print("--- PRENDAS ---")
for p in Prenda.objects.all():
    print(f"ID: {p.id}, Nombre: {p.nombre}, Estado: {p.estado}, Tenant: {p.tenant.nombre}, Foto: {p.foto_url}")
    print("Variantes:")
    for v in p.variantes.all():
        print(f"  - Color: {v.color}, Talla: {v.talla}, Cantidad: {v.cantidad}")
    print("Imagenes:")
    for img in p.imagenes.all():
        print(f"  - URL: {img.imagen}, Color: {img.color}")
