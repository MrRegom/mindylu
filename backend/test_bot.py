import os
import sys
import django

sys.path.append('/var/www/mindylu/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.integraciones.models import Conversacion
from apps.clientas.models import Clienta
from apps.integraciones.services.whatsapp_service import WhatsappService

# Obtener la conversacion y clienta
conversacion = Conversacion.objects.filter(client_phone='56949253373').first()
clienta = Clienta.objects.filter(telefono='56949253373').first()

if conversacion and clienta:
    service = WhatsappService(tenant=conversacion.tenant)
    print("Enviando mensaje manual...")
    try:
        service._responder_consulta_cuenta(conversacion, clienta)
        print("Enviado con exito.")
    except Exception as e:
        print("Error:", e)
else:
    print("No se encontro conversacion o clienta")
