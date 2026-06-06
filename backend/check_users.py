import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.prod')
django.setup()
from apps.core.models import Usuario, Tenant
for u in Usuario.objects.all():
    print(f"User: {u.email}, Tenant: {u.tenant_id}")
for t in Tenant.objects.all():
    print(f"Tenant: {t.id} - {t.nombre}")
