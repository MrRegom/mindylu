"""
config/wsgi.py — Punto de entrada WSGI para producción.
"""

import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.local')

application = get_wsgi_application()

try:
    from apps.core.models import Tenant
    from apps.catalogo.models import Prenda, PrendaImagen, PrendaVariante
    import os

    tenant = Tenant.objects.first()
    if tenant:
        media_dir = os.path.join('/var/www/mindylu/backend/media/prendas')
        if os.path.exists(media_dir):
            images = os.listdir(media_dir)
            existing_images = set([img.imagen.name for img in PrendaImagen.objects.all()])
            
            for img_file in images:
                rel_path = f"prendas/{img_file}"
                if rel_path not in existing_images:
                    name_clean = img_file.split('.')[0].replace('_', ' ').capitalize()
                    
                    prenda = Prenda.objects.create(
                        tenant=tenant,
                        nombre=f"Recuperado - {name_clean}",
                        precio=0,
                        talla_tipo='unica'
                    )
                    
                    PrendaVariante.objects.create(
                        prenda=prenda,
                        color='Único',
                        talla='Única',
                        cantidad=1
                    )
                    
                    PrendaImagen.objects.create(
                        prenda=prenda,
                        imagen=rel_path,
                        orden=0
                    )
except Exception as e:
    pass

