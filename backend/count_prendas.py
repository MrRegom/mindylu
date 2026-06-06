import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.prod')
django.setup()
from apps.catalogo.models import Prenda
print('PRENDAS COUNT:', Prenda.objects.count())
