import os
import sys
import django

sys.path.append('/var/www/mindylu/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.integraciones.models import ReglaRespuestaBot
print("Reglas activas:")
for r in ReglaRespuestaBot.objects.filter(activa=True):
    print(f"[{r.palabras_clave}] -> [{r.respuesta}]")
