# ─────────────────────────────────────────────────────────────
# config/settings/local.py
# Configuración exclusiva para desarrollo local.
# Usa SQLite para evitar dependencias externas en dev.
# En producción (VPS) se usará PostgreSQL.
# ─────────────────────────────────────────────────────────────

from .base import *

DEBUG = True

# SQLite para desarrollo local — sin instalar nada extra
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db_local.sqlite3',
    }
}

# Mostrar queries SQL en consola durante desarrollo
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'django.db.backends': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
    },
}

# Habilitar CORS para pruebas en red local local (mobile demo)
CORS_ALLOW_ALL_ORIGINS = True

