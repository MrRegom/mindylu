import os
import sys
import django
from datetime import datetime

sys.path.append('/var/www/mindylu/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.local')
django.setup()

from django.db import transaction
from apps.core.models import Tenant, Usuario
from apps.catalogo.models import Prenda, PrendaImagen, PrendaVariante

def recover_from_media():
    tenant = Tenant.objects.first()
    if not tenant:
        print("No tenant found. Cannot recover.")
        return

    media_dir = os.path.join('/var/www/mindylu/backend/media/prendas')
    if not os.path.exists(media_dir):
        print(f"Directory {media_dir} does not exist.")
        return

    images = os.listdir(media_dir)
    print(f"Found {len(images)} images in {media_dir}")

    existing_images = set([img.imagen.name for img in PrendaImagen.objects.all()])
    
    count = 0
    with transaction.atomic():
        for img_file in images:
            rel_path = f"prendas/{img_file}"
            
            if rel_path in existing_images:
                continue
                
            # Attempt to create a Prenda for this orphaned image
            # Remove extension for name
            name_clean = img_file.split('.')[0].replace('_', ' ').capitalize()
            
            prenda = Prenda.objects.create(
                tenant=tenant,
                nombre=f"Recuperado: {name_clean}",
                precio=0,
                talla_tipo='unica'
            )
            
            PrendaVariante.objects.create(
                prenda=prenda,
                color='Recuperado',
                talla='Única',
                cantidad=1
            )
            
            PrendaImagen.objects.create(
                prenda=prenda,
                imagen=rel_path,
                orden=0
            )
            count += 1
            
    print(f"Successfully recovered {count} prendas from orphaned images!")

if __name__ == '__main__':
    # Make sure we have the basics first
    from seed_predefinidos import seed_predefinidos
    try:
        seed_predefinidos()
    except Exception as e:
        print("Seed error:", e)
        
    recover_from_media()
