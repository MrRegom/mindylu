import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.local')
django.setup()

from apps.integraciones.views import publicar_lote_en_facebook
from apps.catalogo.models import Prenda
from django.test import RequestFactory
from apps.core.models import Usuario
from rest_framework.test import force_authenticate

factory = RequestFactory()
request = factory.post('/api/v1/integraciones/publicar-lote-facebook/', {'prenda_ids': [3, 4]}, content_type='application/json')
from apps.core.models import Usuario
from rest_framework.test import force_authenticate

factory = RequestFactory()
request = factory.post('/api/v1/integraciones/publicar-lote-facebook/', {'prenda_ids': [3, 4]}, content_type='application/json')
user = Usuario.objects.first()
force_authenticate(request, user=user)
request.user = user

response = publicar_lote_en_facebook(request)
print("STATUS CODE:", response.status_code)
print("DATA:", response.data)
