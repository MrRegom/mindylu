#!/bin/bash
/var/www/mindylu/backend/venv/bin/python /var/www/mindylu/backend/manage.py shell << 'EOF'
from apps.catalogo.models import CicloVenta
from apps.integraciones.tasks import ejecutar_publicacion_lote
ciclos = CicloVenta.objects.filter(estado='programado')
for c in ciclos:
    print("Forzando lote", c.id)
    ejecutar_publicacion_lote(c.id)
print("Hecho.")
EOF
