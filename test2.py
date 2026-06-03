import os
import sys
import django

sys.path.append('/var/www/mindylu/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.local')
django.setup()

from apps.core.models import Usuario
from apps.catalogo.models import Categoria

u = Usuario.objects.get(email='admin@mindylu.com')
cats = Categoria.objects.filter(tenant=u.tenant)
print("Categorias para tenant 1:", cats.count())
print("Primera categoria:", cats.first().nombre if cats.exists() else "None")
