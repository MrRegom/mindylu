# ─────────────────────────────────────────────────────────────
# apps/core/models.py
# Modelos base del sistema: Tenant y Usuario personalizado.
# Principio SRP — cada modelo tiene una sola responsabilidad.
# ─────────────────────────────────────────────────────────────

from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


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
