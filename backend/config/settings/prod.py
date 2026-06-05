from .base import *
from decouple import config
import dj_database_url
import os

# Entorno de Producción
DEBUG = config('DEBUG', default=False, cast=bool)

# Permite cargar los hosts desde una variable (ej: .onrender.com, mi-dominio.cl)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='*').split(',')

# Configuración de Base de Datos para Producción usando DATABASE_URL
# Si no hay DATABASE_URL, hace fallback a sqlite local (por seguridad)
DATABASES = {
    'default': dj_database_url.config(
        default=config('DATABASE_URL', default=f'sqlite:///{os.path.join(BASE_DIR, "db_local.sqlite3")}'),
        conn_max_age=600
    )
}

# Configuración de Whitenoise para servir archivos estáticos (CSS/JS/Imágenes base)
MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')

STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATIC_URL = '/static/'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Configuración de CORS en producción (qué dominios de React pueden llamar a esta API)
CORS_ALLOWED_ORIGINS = config('CORS_ALLOWED_ORIGINS', default='').split(',')
CORS_ALLOW_ALL_ORIGINS = config('CORS_ALLOW_ALL_ORIGINS', default=False, cast=bool)

# Seguridad extra (HTTPS) - Por defecto en False para no bloquear la IP pública (HTTP)
SECURE_SSL_REDIRECT = config('SECURE_SSL_REDIRECT', default=False, cast=bool)
SESSION_COOKIE_SECURE = config('SESSION_COOKIE_SECURE', default=False, cast=bool)
CSRF_COOKIE_SECURE = config('CSRF_COOKIE_SECURE', default=False, cast=bool)
