# ─────────────────────────────────────────────────────────────
# apps/core/admin.py
# Registro de modelos core en el panel de administración Django.
# ─────────────────────────────────────────────────────────────

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from apps.core.models import Tenant, Usuario


@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'slug', 'plan', 'activo', 'fecha_registro']
    list_filter = ['plan', 'activo']
    search_fields = ['nombre', 'slug']
    prepopulated_fields = {'slug': ('nombre',)}


@admin.register(Usuario)
class UsuarioAdmin(BaseUserAdmin):
    list_display = ['email', 'nombre', 'rol', 'tenant', 'is_active']
    list_filter = ['rol', 'is_active', 'tenant']
    search_fields = ['email', 'nombre']
    ordering = ['email']

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Información personal', {'fields': ('nombre', 'rol', 'tenant')}),
        ('Permisos', {'fields': ('is_active', 'is_staff', 'is_superuser')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'nombre', 'tenant', 'rol', 'password1', 'password2'),
        }),
    )
