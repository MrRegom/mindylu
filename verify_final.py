import os
import sys
import django

sys.path.append('/var/www/mindylu/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.local')
django.setup()

from apps.core.models import Tenant, Usuario
from apps.catalogo.models import Categoria

print("Usuarios:")
for u in Usuario.objects.all():
    print(f"  {u.id}: {u.email}, tenant_id={u.tenant_id}, is_active={u.is_active}")

print("Categorias:")
for c in Categoria.objects.all():
    print(f"  {c.id}: {c.nombre} (tenant_id={c.tenant_id})")
