from django.core.management.base import BaseCommand
from apps.catalogo.models import Prenda

class Command(BaseCommand):
    help = 'Renombra las prendas que tienen el prefijo Recuperado'

    def handle(self, *args, **options):
        prendas = Prenda.objects.filter(nombre__startswith='Recuperado')
        count = 0
        for p in prendas:
            # Reemplazar 'Recuperado - ' o 'Recuperado: ' por 'Prenda '
            nuevo_nombre = p.nombre.replace('Recuperado - ', 'Prenda ').replace('Recuperado: ', 'Prenda ')
            p.nombre = nuevo_nombre
            p.save()
            count += 1
            
        self.stdout.write(self.style.SUCCESS(f'Exito: se renombraron {count} prendas.'))
