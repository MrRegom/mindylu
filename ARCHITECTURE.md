# MindyLu - Arquitectura y Guía de Desarrollo

Este documento establece las bases arquitectónicas, de despliegue y las buenas prácticas obligatorias para mantener el proyecto MindyLu como un sistema corporativo escalable, limpio y seguro. **Cualquier desarrollo futuro o Inteligencia Artificial que interactúe con este código debe leer y acatar estrictamente estas reglas.**

---

## 1. Stack Tecnológico (Producción)

- **Frontend:** React + Vite (PWA)
- **Backend:** Django 5 + Django REST Framework (Python 3.12)
- **Base de Datos:** PostgreSQL
- **Servidor Web / Proxy:** Nginx
- **Aplicación de Servidor (WSGI):** Gunicorn gestionado por Systemd
- **Servidor (VPS):** DigitalOcean (Ubuntu 24.04, 1GB RAM + 2GB Swap)
- **Despliegue (Deploy):** Git Bare Repository + Post-Receive Hook

---

## 2. Arquitectura de Despliegue (Git Auto-Deploy)

El proyecto utiliza un sistema de integración continua ligero basado en Git (Push-to-Deploy). 

### Flujo de trabajo:
1. Todos los cambios se realizan en el entorno local (`c:\proyectos\mindylu`).
2. Se prueba localmente (usando `npm run dev` y `python manage.py runserver`).
3. Una vez aprobados los cambios, se ejecutan los comandos Git:
   ```bash
   git add .
   git commit -m "Descripción clara del cambio"
   git push production master
   ```
4. El servidor remoto intercepta el `push` mediante un script `post-receive`.
5. El servidor automáticamente:
   - Descarga el nuevo código.
   - Aplica migraciones de la base de datos (`manage.py migrate`).
   - Recolecta archivos estáticos (`manage.py collectstatic`).
   - Reinicia el backend (`systemctl restart gunicorn`).
   - Re-compila el frontend de React (`npm run build`).

**REGLA:** NUNCA modificar código directamente en el servidor de producción. Todo cambio debe hacerse en local y subirse por Git.

---

## 3. Principios de Arquitectura (Backend Django)

El backend de MindyLu sigue estrictamente principios de Clean Architecture y SOLID.

### 3.1. Separación de Responsabilidades (SRP)
- **Views (Vistas):** Son EXCLUSIVAMENTE orquestadores. Reciben la petición HTTP, llaman a los Servicios (Services/Repositories) y devuelven la respuesta HTTP. **PROHIBIDA la lógica de negocio pesada en las views.**
- **Services (Servicios):** Aquí reside toda la lógica de negocio y los procesos complejos (ej. publicar en Facebook, calcular ganancias, cruzar datos).
- **Models (Modelos):** Representan la estructura de datos y métodos propios del dominio (comportamientos internos del modelo). No deben hacer consultas cruzadas complejas ni ser "Modelos Gordos".

### 3.2. Modularidad (Apps)
Cada dominio del negocio debe tener su propia App en Django. Actualmente se divide en:
- `core`: Autenticación, usuarios y tenants.
- `catalogo`: Inventario, prendas, variantes y ciclo de venta.
- `clientas`: Directorio de clientas e historial.
- `pedidos`: Gestión de ventas, carritos y entregas.
- `cuentas`: Control financiero, bancos y límites de SII.
- `integraciones`: Conexiones externas (WhatsApp, Meta).
- `reportes` (Futuro): Toda la analítica debe ir aquí, no mezclada en el core.

---

## 4. Principios de Arquitectura (Frontend React)

El frontend está construido como una Single Page Application (SPA) convertida en PWA.

### 4.1. Estructura Limpia
- **Sin mezcla de HTML/JS nativo:** Todo se renderiza mediante componentes funcionales de React (`.jsx`). Prohibido usar jQuery o manipulación directa del DOM (salvo fallbacks como el portapapeles en HTTP).
- **CSS Modular/Separado:** Los estilos van en archivos `.css` importados, nunca incrustados masivamente en el JSX (salvo estilos dinámicos muy específicos).
- **Componentes Reutilizables:** Los modales, botones y tarjetas deben abstraerse si se repiten.
- **Llamadas a la API:** Todas las peticiones HTTP pasan exclusivamente por la instancia configurada en `src/services/api.js`. Esta inyecta los tokens de seguridad y apunta dinámicamente al entorno (Desarrollo o Producción mediante `VITE_API_URL`).

---

## 5. Reglas de Escalabilidad y Seguridad

1. **Aislamiento de Cambios:** Al añadir una nueva característica (ej. WhatsApp API), se debe crear un módulo/app independiente. No se debe modificar el código funcional de otras áreas. "Abierto a la extensión, cerrado a la modificación" (Principio OCP).
2. **Variables de Entorno (.env):** Jamás exponer credenciales, contraseñas de Base de Datos o Secret Keys en el código fuente. Todo debe leerse desde archivos `.env`.
3. **Escalabilidad de la Base de Datos:** Las tablas están relacionadas correctamente con Claves Foráneas (Foreign Keys). Para reportes complejos, usar consultas optimizadas (`select_related`, `prefetch_related`) para no sobrecargar la base de datos (Problema N+1).

---

## 6. Firma de Arquitecto

*Al interactuar con este proyecto, prometo honrar esta arquitectura, escribiendo código limpio, escalable, modular y testeable. Toda respuesta y generación de código debe alinearse con estos estándares profesionales de la industria.*
