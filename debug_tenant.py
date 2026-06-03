import os
import sys
import django

sys.path.append('/var/www/mindylu/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.local')
django.setup()

from apps.core.models import Tenant, Usuario
from apps.catalogo.models import Categoria

print("=== TODOS LOS TENANTS ===")
for t in Tenant.objects.all():
    print(f"  ID={t.id}, nombre={t.nombre}")

print("\n=== TODOS LOS USUARIOS ===")
for u in Usuario.objects.all():
    print(f"  ID={u.id}, email={u.email}, tenant_id={u.tenant_id}")

print("\n=== CATEGORIAS POR TENANT ===")
for t in Tenant.objects.all():
    cats = Categoria.objects.filter(tenant=t)
    print(f"  Tenant {t.id} ({t.nombre}): {cats.count()} categorias")
    for c in cats[:3]:
        print(f"    - {c.nombre}")
