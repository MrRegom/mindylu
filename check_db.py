import os
import sys
import django

sys.path.append('/var/www/mindylu/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.base')
django.setup()

from apps.core.models import Tenant, Usuario
from apps.catalogo.models import Categoria, NombrePrendaPredefinido

print("Tenants:")
for t in Tenant.objects.all():
    print(f"ID: {t.id}, Nombre: {t.nombre}")

print("Categorias:")
for c in Categoria.objects.all():
    print(f"ID: {c.id}, Nombre: {c.nombre}, Tenant ID: {c.tenant_id}")
