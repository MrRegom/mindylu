from django.db.models.signals import pre_save
from django.dispatch import receiver
from .models import ColorPredefinido, TallaPredefinida, PrendaVariante, PrendaImagen

@receiver(pre_save, sender=ColorPredefinido)
def actualizar_colores_vinculados(sender, instance, **kwargs):
    if instance.pk:
        try:
            # Obtener la instancia antigua desde la DB
            old_instance = sender.objects.get(pk=instance.pk)
            # Si el nombre cambió
            if old_instance.nombre != instance.nombre:
                # 1. Actualizar colores en variantes de prendas (Talla/Color/Cantidad)
                PrendaVariante.objects.filter(color__iexact=old_instance.nombre).update(color=instance.nombre)
                
                # 2. Actualizar colores asignados a las imágenes
                PrendaImagen.objects.filter(color__iexact=old_instance.nombre).update(color=instance.nombre)
        except sender.DoesNotExist:
            pass

@receiver(pre_save, sender=TallaPredefinida)
def actualizar_tallas_vinculadas(sender, instance, **kwargs):
    if instance.pk:
        try:
            old_instance = sender.objects.get(pk=instance.pk)
            if old_instance.nombre != instance.nombre:
                PrendaVariante.objects.filter(talla__iexact=old_instance.nombre).update(talla=instance.nombre)
        except sender.DoesNotExist:
            pass
