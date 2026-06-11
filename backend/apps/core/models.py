# ─────────────────────────────────────────────────────────────
# apps/core/models.py
# Modelos base del sistema: Tenant y Usuario personalizado.
# Principio SRP — cada modelo tiene una sola responsabilidad.
# ─────────────────────────────────────────────────────────────

from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from PIL import Image, ImageOps
from io import BytesIO
from django.core.files.uploadedfile import InMemoryUploadedFile
import sys


class Tenant(models.Model):
    """
    Representa una tienda/vendedora en el sistema SaaS.
    Es la unidad de aislamiento de datos multi-tenant.
    """

    class Plan(models.TextChoices):
        FREE = 'free', _('Gratis')
        STARTER = 'starter', _('Starter')
        PRO = 'pro', _('Pro')

    nombre = models.CharField(
        max_length=150,
        verbose_name=_('Nombre de la tienda')
    )
    slug = models.SlugField(
        unique=True,
        max_length=100,
        verbose_name=_('Identificador único')
    )
    plan = models.CharField(
        max_length=20,
        choices=Plan.choices,
        default=Plan.FREE,
        verbose_name=_('Plan')
    )
    activo = models.BooleanField(default=True, verbose_name=_('Activo'))
    fecha_registro = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Tenant')
        verbose_name_plural = _('Tenants')
        ordering = ['-fecha_registro']

    def __str__(self):
        return f'{self.nombre} ({self.plan})'


class UsuarioManager(BaseUserManager):
    """Manager personalizado para el modelo Usuario."""

    def create_user(self, email, password=None, **extra_fields):
        """Crea y guarda un usuario normal."""
        if not email:
            raise ValueError(_('El email es obligatorio'))
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """Crea y guarda un superusuario con todos los permisos."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('rol', Usuario.Rol.OWNER)
        return self.create_user(email, password, **extra_fields)


class Usuario(AbstractBaseUser, PermissionsMixin):
    """
    Usuario del sistema. Puede ser dueña de una tienda (owner)
    o asistente. Se autentica con email en lugar de username.
    """

    class Rol(models.TextChoices):
        OWNER = 'owner', _('Dueña')
        ASSISTANT = 'assistant', _('Asistente')

    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name='usuarios',
        null=True,
        blank=True,
        verbose_name=_('Tienda')
    )
    email = models.EmailField(
        unique=True,
        verbose_name=_('Correo electrónico')
    )
    nombre = models.CharField(max_length=150, verbose_name=_('Nombre'))
    rol = models.CharField(
        max_length=20,
        choices=Rol.choices,
        default=Rol.OWNER,
        verbose_name=_('Rol')
    )
    telefono = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        verbose_name=_('Teléfono')
    )
    avatar = models.ImageField(
        upload_to='avatars/',
        null=True,
        blank=True,
        verbose_name=_('Foto de perfil')
    )
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    fecha_registro = models.DateTimeField(default=timezone.now)

    objects = UsuarioManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['nombre']

    class Meta:
        verbose_name = _('Usuario')
        verbose_name_plural = _('Usuarios')

    def __str__(self):
        return f'{self.nombre} <{self.email}>'

class ErrorLog(models.Model):
    TIPO_CHOICES = (
        ('FRONTEND', 'Frontend'),
        ('BACKEND', 'Backend'),
    )
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    mensaje = models.TextField()
    stack_trace = models.TextField(blank=True, null=True)
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha']
        verbose_name = 'Log de Error'
        verbose_name_plural = 'Logs de Errores'

    def __str__(self):
        return f"[{self.tipo}] {self.fecha.strftime('%Y-%m-%d %H:%M:%S')} - {self.mensaje[:50]}"

class ConfiguracionTienda(models.Model):
    tenant = models.OneToOneField(Tenant, on_delete=models.CASCADE, related_name='configuracion')
    marquesina_texto = models.CharField(
        max_length=255, 
        default='NUEVA COLECCIÓN 2025 • NUEVA COLECCIÓN 2025 • NUEVA COLECCIÓN 2025',
        verbose_name=_('Texto de la marquesina')
    )
    marquesina_velocidad = models.IntegerField(
        default=25,
        verbose_name=_('Velocidad de Marquesina (segundos)')
    )
    banner_imagen = models.ImageField(
        upload_to='banners/', 
        null=True, blank=True,
        verbose_name=_('Imagen del Banner')
    )
    polaroid_1_imagen = models.ImageField(
        upload_to='banners/', 
        null=True, blank=True,
        verbose_name=_('Imagen Polaroid 1')
    )
    polaroid_2_imagen = models.ImageField(
        upload_to='banners/', 
        null=True, blank=True,
        verbose_name=_('Imagen Polaroid 2')
    )
    polaroid_3_imagen = models.ImageField(
        upload_to='banners/', 
        null=True, blank=True,
        verbose_name=_('Imagen Polaroid 3')
    )
    banner_titulo = models.CharField(
        max_length=255, 
        default='Moda femenina seleccionada especialmente para ti',
        verbose_name=_('Título del Banner')
    )
    banner_titulo_cursiva = models.CharField(
        max_length=255,
        default='Tu Mindy Lu.',
        verbose_name=_('Título Cursiva del Banner'),
        blank=True
    )
    banner_subtitulo = models.TextField(
        default='Prendas únicas, elegantes y exclusivas.\nCada pieza seleccionada con amor y estilo.',
        verbose_name=_('Subtítulo del Banner')
    )
    whatsapp_numero = models.CharField(
        max_length=20, 
        default='56972677820', 
        blank=True,
        verbose_name=_('Número de WhatsApp')
    )
    tienda_nombre = models.CharField(
        max_length=100,
        default='MindyLu',
        verbose_name=_('Nombre de la Tienda (UI)')
    )
    envios_texto = models.TextField(
        default='Envíos a Viña del Mar $2500\nValparaíso $2500\nCurauma Placilla $2500\nQuilpué Villa Alemana $2500\n\nRegiones envío por Starken por pagar',
        verbose_name=_('Información de Envíos')
    )

    class Meta:
        verbose_name = _('Configuración de Tienda')
        verbose_name_plural = _('Configuraciones de Tienda')

    def __str__(self):
        return f'Configuración de {self.tenant.nombre}'

    def _compress_image(self, image_field, max_size=(1600, 1600)):
        if not image_field:
            return
        
        # Si no es un archivo subido en memoria temporal (ej. ya estaba guardado), lo omitimos
        if not hasattr(image_field, 'file') or not hasattr(image_field.file, 'content_type'):
            return

        try:
            img = Image.open(image_field)
            img = ImageOps.exif_transpose(img)
            
            if img.mode != 'RGB':
                img = img.convert('RGB')
                
            img.thumbnail(max_size, Image.Resampling.LANCZOS)
            
            output = BytesIO()
            img.save(output, format='JPEG', quality=85, optimize=True)
            output.seek(0)
            
            name = f"{image_field.name.split('.')[0]}.jpg"
            image_field.file = InMemoryUploadedFile(
                output, 'ImageField', name, 'image/jpeg',
                sys.getsizeof(output), None
            )
            image_field.name = name
        except Exception as e:
            print("Error comprimiendo imagen de configuracion:", e)

    def save(self, *args, **kwargs):
        self._compress_image(self.banner_imagen, max_size=(1920, 1080))
        self._compress_image(self.polaroid_1_imagen, max_size=(800, 800))
        self._compress_image(self.polaroid_2_imagen, max_size=(800, 800))
        self._compress_image(self.polaroid_3_imagen, max_size=(800, 800))
        super().save(*args, **kwargs)
