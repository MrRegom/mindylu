from django.db import transaction
from django.utils.dateparse import parse_datetime
from django.utils import timezone
from apps.integraciones.scheduler import schedule_publicacion_lote
from .models import Prenda, PrendaVariante, PrendaImagen, CicloVenta

class CatalogoService:
    @staticmethod
    def crear_prenda_con_variantes(tenant, nombre, precio, categoria_id, variantes_data, imagen_file):
        with transaction.atomic():
            prenda = Prenda.objects.create(
                tenant=tenant,
                nombre=nombre,
                precio=precio,
                categoria_id=categoria_id if categoria_id else None,
                talla_tipo='unica'
            )
            if not variantes_data:
                PrendaVariante.objects.create(prenda=prenda, color='Único', talla='Única', cantidad=1)
            else:
                for v in variantes_data:
                    PrendaVariante.objects.create(
                        prenda=prenda,
                        color=v.get('color', 'Único'),
                        talla=v.get('talla', 'Única'),
                        cantidad=int(v.get('cantidad', 1))
                    )
            if imagen_file:
                PrendaImagen.objects.create(prenda=prenda, imagen=imagen_file, orden=0)
        return prenda

    @staticmethod
    def programar_publicacion(tenant, prenda_ids, mensaje, fecha_programada_str):
        from django.db.models import Sum
        prendas = Prenda.objects.filter(id__in=prenda_ids, tenant=tenant)
        if prendas.count() != len(prenda_ids):
            raise ValueError('Una o más prendas no existen en tu catálogo.')
            
        # Filtrar solo prendas que tengan stock real (> 0)
        prendas_con_stock = prendas.annotate(total_stock=Sum('variantes__cantidad')).filter(total_stock__gt=0)
        
        if prendas_con_stock.count() == 0:
            raise ValueError('Ninguna de las prendas seleccionadas tiene stock disponible.')

        with transaction.atomic():
            ciclo = CicloVenta.objects.create(
                tenant=tenant,
                mensaje_facebook=mensaje,
                estado=CicloVenta.Estado.PROGRAMADO if fecha_programada_str else CicloVenta.Estado.ACTIVO
            )
            if fecha_programada_str:
                ciclo.fecha_programada = parse_datetime(fecha_programada_str)
                ciclo.save()

            # Solo asignamos el ciclo a las prendas que sí tienen stock
            prendas_con_stock.update(ciclo=ciclo)

            if fecha_programada_str:
                schedule_publicacion_lote(ciclo.id, ciclo.fecha_programada)
            else:
                import threading
                from apps.integraciones.tasks import ejecutar_publicacion_lote
                threading.Thread(target=ejecutar_publicacion_lote, args=(ciclo.id,)).start()

        return ciclo, prendas_con_stock.count()

    @staticmethod
    def crear_lote_masivo(tenant, items, fecha_programada_str, mensaje_facebook, files):
        creadas_ids = []
        with transaction.atomic():
            ciclo = CicloVenta.objects.create(
                tenant=tenant,
                mensaje_facebook=mensaje_facebook,
                estado=CicloVenta.Estado.PROGRAMADO if fecha_programada_str else CicloVenta.Estado.ACTIVO
            )
            if fecha_programada_str:
                ciclo.fecha_programada = parse_datetime(fecha_programada_str)
                ciclo.save()

            for i, item in enumerate(items):
                cat_id = item.get('categoria_id')
                precio_comp = item.get('precio_compra')
                prenda = Prenda.objects.create(
                    tenant=tenant,
                    ciclo=ciclo,
                    nombre=item.get('nombre', 'Producto Sin Nombre'),
                    precio=int(item.get('precio', 0)),
                    precio_compra=int(precio_comp) if precio_comp else None,
                    categoria_id=cat_id if cat_id else None,
                    talla_tipo=item.get('talla_tipo', 'unica')
                )
                variantes_list = item.get('variantes', [])
                if not variantes_list:
                    PrendaVariante.objects.create(prenda=prenda, color='Único', talla='Única', cantidad=1)
                else:
                    for v in variantes_list:
                        PrendaVariante.objects.create(
                            prenda=prenda,
                            color=v.get('color', 'Único'),
                            talla=v.get('talla', 'Única'),
                            cantidad=int(v.get('cantidad', 1))
                        )
                imagen_file = files.get(f'imagenes_{i}')
                if imagen_file:
                    PrendaImagen.objects.create(prenda=prenda, imagen=imagen_file, orden=0)
                creadas_ids.append(prenda.id)

            if fecha_programada_str:
                schedule_publicacion_lote(ciclo.id, ciclo.fecha_programada)
            else:
                import threading
                from apps.integraciones.tasks import ejecutar_publicacion_lote
                threading.Thread(target=ejecutar_publicacion_lote, args=(ciclo.id,)).start()

        return ciclo, creadas_ids
