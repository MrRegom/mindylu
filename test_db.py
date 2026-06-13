
from apps.integraciones.models import Mensaje
for m in Mensaje.objects.all().order_by('-created_at')[:10]:
    print(f'{m.created_at} | {m.direction} | {repr(m.content)}')

