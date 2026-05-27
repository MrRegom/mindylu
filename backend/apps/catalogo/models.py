# ─────────────────────────────────────────────────────────────
# apps/catalogo/models.py
# Modelos del catálogo: CicloVenta, Prenda y PrendaVariante
# ─────────────────────────────────────────────────────────────

from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.core.models import Tenant


class CicloVenta(models.Model):
    """
    Representa una 'publicación' o 'subida de álbum'.
    Agrupa prendas para tener trazabilidad de cuándo llegaron.
    """
    class Estado(models.TextChoices):
        PROGRAMADO = 'programado', _('Programado')
        ACTIVO = 'activo', _('Activo')
        CERRADO = 'cerrado', _('Cerrado')

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='ciclos')
    fecha_publicacion = models.DateTimeField(auto_now_add=True)
    fecha_programada = models.DateTimeField(null=True, blank=True, help_text=_('Fecha para publicarse automáticamente'))
    url_facebook_post = models.URLField(blank=True, null=True, help_text=_('URL del post original si vino de FB'))
    mensaje_facebook = models.TextField(blank=True, null=True, help_text=_('Mensaje personalizado para Facebook'))
    estado = models.CharField(max_length=20, choices=Estado.choices, default=Estado.ACTIVO)

    class Meta:
        ordering = ['-fecha_publicacion']
        verbose_name = _('Ciclo de Venta')
        verbose_name_plural = _('Ciclos de Venta')

    def __str__(self):
        return f"Ciclo {self.fecha_publicacion.strftime('%d/%m/%Y')} - {self.get_estado_display()}"


class Categoria(models.Model):
    """
    Categorías de prendas definidas por la tienda (ej: Sweaters, Blusas).
    Cada tenant gestiona las suyas propias — aislamiento multi-tenant.
    """
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='categorias')
    nombre = models.CharField(max_length=100, verbose_name=_('Nombre'))

    class Meta:
        ordering = ['nombre']
        verbose_name = _('Categoría')
        verbose_name_plural = _('Categorías')
        unique_together = ['tenant', 'nombre']  # No duplicar categorías por tenant

    def __str__(self):
        return self.nombre


class Prenda(models.Model):
    """
    Una prenda base en el catálogo (ej: Chaleco de Lana).
    """
    class TipoTalla(models.TextChoices):
        UNICA = 'unica', _('Talla Única')
        POR_TALLA = 'por_talla', _('Por Talla')

    class Estado(models.TextChoices):
        DISPONIBLE = 'disponible', _('Disponible')
        AGOTADA = 'agotada', _('Agotada')
        ARCHIVADA = 'archivada', _('Archivada')

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='prendas')
    ciclo = models.ForeignKey(CicloVenta, on_delete=models.SET_NULL, null=True, blank=True, related_name='prendas')
    categoria = models.ForeignKey(
        Categoria,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='prendas',
        verbose_name=_('Categoría')
    )
    
    nombre = models.CharField(max_length=255)
    precio_compra = models.DecimalField(max_digits=10, decimal_places=0, null=True, blank=True, verbose_name=_('Precio de Compra/Costo'))
    precio = models.DecimalField(max_digits=10, decimal_places=0, verbose_name=_('Precio de Venta')) # CLP no usa decimales
    foto_url = models.URLField(max_length=1000, blank=True, null=True) # En el MVP inicial puede estar vacío si no jalamos la foto
    talla_tipo = models.CharField(max_length=20, choices=TipoTalla.choices, default=TipoTalla.UNICA)
    estado = models.CharField(max_length=20, choices=Estado.choices, default=Estado.DISPONIBLE)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_ultima_carga = models.DateTimeField(
        auto_now=True,
        verbose_name=_('Última vez cargada'),
        help_text=_('Se actualiza cada vez que se sube stock a esta prenda. Usado para el filtro "nuevas de hoy".')
    )

    class Meta:
        ordering = ['-fecha_ultima_carga']
        verbose_name = _('Prenda')
        verbose_name_plural = _('Prendas')

    def __str__(self):
        return f"{self.nombre} (${self.precio})"

    def actualizar_estado(self):
        """Regla de negocio (SRP): Si no queda stock, pasa a agotada. Si recupera stock, vuelve a disponible."""
        total_stock = sum(v.cantidad for v in self.variantes.all())
        if total_stock <= 0:
            if self.estado == self.Estado.DISPONIBLE:
                self.estado = self.Estado.AGOTADA
                self.save()
        else:
            if self.estado in [self.Estado.AGOTADA, self.Estado.ARCHIVADA]:
                self.estado = self.Estado.DISPONIBLE
                self.save()


class PrendaImagen(models.Model):
    """
    Soporte para múltiples imágenes (Álbum o Carrusel) de una misma Prenda.
    """
    prenda = models.ForeignKey(Prenda, on_delete=models.CASCADE, related_name='imagenes')
    imagen = models.ImageField(upload_to='prendas/')
    orden = models.PositiveIntegerField(default=0)
    fecha_subida = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['orden', 'fecha_subida']
        verbose_name = _('Imagen de Prenda')
        verbose_name_plural = _('Imágenes de Prenda')

    def __str__(self):
        return f"Imagen de {self.prenda.nombre}"


class PrendaVariante(models.Model):
    """
    Las variaciones de la prenda (Colores y tallas con su respectivo stock).
    Ej: Chaleco de Lana -> Beige -> Cantidad: 2
    """
    prenda = models.ForeignKey(Prenda, on_delete=models.CASCADE, related_name='variantes')
    color = models.CharField(max_length=100, blank=True, null=True)
    talla = models.CharField(max_length=20, blank=True, null=True)
    cantidad = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ['color', 'talla']
        verbose_name = _('Variante de Prenda')
        verbose_name_plural = _('Variantes de Prenda')
        unique_together = ['prenda', 'color', 'talla']

    def __str__(self):
        return f"{self.prenda.nombre} - {self.color or ''} {self.talla or ''} ({self.cantidad})"

    def vender(self, cantidad=1):
        """Regla de negocio: Descuenta stock y actualiza estado de la prenda padre."""
        if self.cantidad >= cantidad:
            self.cantidad -= cantidad
            self.save()
            self.prenda.actualizar_estado()
            return True
        return False


class ColorPredefinido(models.Model):
    """Colores autogestionables desde la pantalla de Ajustes."""
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='colores_predefinidos')
    nombre = models.CharField(max_length=100)

    class Meta:
        ordering = ['nombre']
        verbose_name = _('Color Predefinido')
        unique_together = ['tenant', 'nombre']

    def __str__(self):
        return self.nombre


class TallaPredefinida(models.Model):
    """Tallas autogestionables desde la pantalla de Ajustes."""
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='tallas_predefinidas')
    nombre = models.CharField(max_length=50)

    class Meta:
        ordering = ['nombre']
        verbose_name = _('Talla Predefinida')
        unique_together = ['tenant', 'nombre']

    def __str__(self):
        return self.nombre


class NombrePrendaPredefinido(models.Model):
    """Nombres de prendas base para el autocompletado."""
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='nombres_prendas_predefinidos')
    nombre = models.CharField(max_length=255)

    class Meta:
        ordering = ['nombre']
        verbose_name = _('Nombre de Prenda Predefinido')
        unique_together = ['tenant', 'nombre']

    def __str__(self):
        return self.nombre
