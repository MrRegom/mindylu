# Reglas y Decisiones de Arquitectura de MindyLu

### 1. Protocolo HTTP en Producción
**REGLA:** NUNCA reactivar `SECURE_SSL_REDIRECT = True` o `SESSION_COOKIE_SECURE = True` en `config/settings/prod.py` de forma forzada a menos que se haya configurado explícitamente un certificado SSL (Let's Encrypt / HTTPS) en Nginx.
**RAZÓN:** El frontend de MindyLu opera actualmente sobre la IP pública `http://157.230.93.24/`. Si se activa la redirección estricta SSL en Django, la API rechaza las conexiones de React mediante un error 301, lo cual provoca que las prendas y categorías desaparezcan silenciosamente de la tienda pública ("Error de Red" / "No hay prendas en esta categoría").
**SOLUCIÓN APLICADA:** Las variables de seguridad SSL en `prod.py` tienen un `default=False`.

### 2. Archivo SQLite Local
**REGLA:** NO utilizar `db_local.sqlite3` bajo ninguna circunstancia en producción. La base de datos es exclusivamente PostgreSQL.
**RAZÓN:** Se causó pérdida de información temporal cuando la tienda hizo fallback a sqlite debido a mala lectura de variables de entorno de gunicorn.
**SOLUCIÓN APLICADA:** Gunicorn ahora arranca con `export DJANGO_SETTINGS_MODULE=config.settings.prod` y Lee la cadena de PostgreSQL de `.env`.

### 3. Modificaciones al CSS
**REGLA:** Nunca asumir que los cambios al CSS en React se reflejan inmediatamente en el navegador del cliente.
**RAZÓN:** El caché agresivo requiere explicarle a la usuaria que debe hacer `Ctrl + F5`.
