import sys
import os
import django

sys.path.append('/var/www/mindylu/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.catalogo.models import CicloVenta
from apps.integraciones.tasks import ejecutar_publicacion_lote

# Find the delayed cycle
ciclos_pendientes = CicloVenta.objects.filter(estado=CicloVenta.Estado.PROGRAMADO)
for ciclo in ciclos_pendientes:
    print(f"Forzando publicación del lote {ciclo.id}...")
    ejecutar_publicacion_lote(ciclo.id)
    print("¡Lote publicado!")
