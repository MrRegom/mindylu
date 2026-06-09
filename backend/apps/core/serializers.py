# ─────────────────────────────────────────────────────────────
# apps/core/serializers.py
# Serializers para autenticación y gestión de usuarios.
# ─────────────────────────────────────────────────────────────

from rest_framework import serializers
from django.contrib.auth import authenticate
from django.utils.translation import gettext_lazy as _
from apps.core.models import Usuario, Tenant, ErrorLog, ConfiguracionTienda
from slugify import slugify


class RegistroTenantSerializer(serializers.Serializer):
    """
    Serializer para el registro inicial de una vendedora.
    Crea el Tenant y el Usuario owner en una sola operación.
    """
    nombre_tienda = serializers.CharField(max_length=150)
    nombre_usuario = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)

    def validate_email(self, value):
        """Verifica que el email no esté registrado."""
        if Usuario.objects.filter(email=value).exists():
            raise serializers.ValidationError(_('Este email ya está registrado.'))
        return value

    def validate_nombre_tienda(self, value):
        """Verifica que el slug generado sea único."""
        slug = slugify(value)
        if Tenant.objects.filter(slug=slug).exists():
            raise serializers.ValidationError(_('Ya existe una tienda con ese nombre.'))
        return value

    def create(self, validated_data):
        """
        Crea el Tenant y el Usuario owner asociado.
        Responsabilidad de creación centralizada aquí (SRP).
        """
        nombre_tienda = validated_data['nombre_tienda']
        slug = slugify(nombre_tienda)

        # 1. Crear el tenant
        tenant = Tenant.objects.create(
            nombre=nombre_tienda,
            slug=slug,
        )

        # 2. Crear el usuario owner
        usuario = Usuario.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            nombre=validated_data['nombre_usuario'],
            tenant=tenant,
            rol=Usuario.Rol.OWNER,
        )

        return usuario


class LoginSerializer(serializers.Serializer):
    """Serializer para autenticación por email y contraseña."""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(
            request=self.context.get('request'),
            username=attrs['email'],
            password=attrs['password'],
        )
        if not user:
            raise serializers.ValidationError(_('Credenciales incorrectas.'))
        if not user.is_active:
            raise serializers.ValidationError(_('Usuario inactivo.'))
        attrs['user'] = user
        return attrs


class UsuarioSerializer(serializers.ModelSerializer):
    """Serializer de lectura y actualización para el perfil del usuario."""
    tenant_nombre = serializers.CharField(source='tenant.nombre', read_only=True)
    tenant_slug = serializers.CharField(source='tenant.slug', read_only=True)
    tenant_plan = serializers.CharField(source='tenant.plan', read_only=True)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Usuario
        fields = [
            'id', 'email', 'nombre', 'rol', 'telefono', 'avatar',
            'tenant_nombre', 'tenant_slug', 'tenant_plan',
            'fecha_registro', 'password'
        ]
        read_only_fields = [
            'id', 'email', 'rol', 'tenant_nombre', 
            'tenant_slug', 'tenant_plan', 'fecha_registro'
        ]

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)
        return super().update(instance, validated_data)

class ErrorLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ErrorLog
        fields = '__all__'

class ConfiguracionTiendaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConfiguracionTienda
        fields = [
            'marquesina_texto', 'marquesina_velocidad', 'banner_imagen', 
            'polaroid_1_imagen', 'polaroid_2_imagen', 'polaroid_3_imagen',
            'banner_titulo', 'banner_titulo_cursiva', 'banner_subtitulo', 'whatsapp_numero', 'tienda_nombre',
            'envios_texto'
        ]

