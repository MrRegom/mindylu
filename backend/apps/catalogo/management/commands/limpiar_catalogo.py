from django.core.management.base import BaseCommand
from apps.pedidos.models import Pedido
from apps.catalogo.models import Prenda, CicloVenta

class Command(BaseCommand):
    help = 'Limpia todos los pedidos y el catálogo de prendas.'

    def handle(self, *args, **options):
        # 1. Borrar pedidos para liberar las llaves foráneas (PROTECT) en ItemPedido -> PrendaVariante
        count_pedidos, _ = Pedido.objects.all().delete()
        self.stdout.write(self.style.SUCCESS(f'Borrados {count_pedidos} Pedidos (y sus ítems).'))

        # 2. Borrar Prendas (elimina en cascada PrendaVariante y PrendaImagen)
        count_prendas, _ = Prenda.objects.all().delete()
        self.stdout.write(self.style.SUCCESS(f'Borradas {count_prendas} Prendas.'))

        # 3. Opcional: borrar ciclos de venta
        count_ciclos, _ = CicloVenta.objects.all().delete()
        self.stdout.write(self.style.SUCCESS(f'Borrados {count_ciclos} Ciclos de Venta.'))

        self.stdout.write(self.style.SUCCESS('Catálogo limpiado exitosamente.'))
