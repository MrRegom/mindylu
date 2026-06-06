# Regla Crítica: Prevención de Pérdida de Datos (Catálogo)

## 🚨 El Problema
En los despliegues anteriores, cada vez que se subían cambios al servidor (producción), **el catálogo subido por la clienta desaparecía misteriosamente** y la base de datos volvía a su estado inicial.

## 🔍 La Causa Raíz
El archivo de base de datos local (`backend/db_local.sqlite3`) estaba siendo **rastreado por Git** accidentalmente. 
Dado que el servidor de producción utiliza este mismo archivo SQLite (al no tener configurado un `DATABASE_URL` externo), cada vez que se ejecutaba un `git push`, el archivo de la base de datos local sobrescribía y **destruía** la base de datos de producción con sus datos reales.

## ✅ La Solución (Aplicada permanentemente)
1. He ejecutado `git rm --cached backend/db_local.sqlite3` para que Git ignore y deje de rastrear la base de datos local.
2. He hecho un commit y push de esta corrección.
3. El archivo `.gitignore` ya contiene la regla `db_local.sqlite3`, por lo que **NUNCA MÁS** un push sobrescribirá los datos del servidor.

## 📜 Regla para futuros despliegues
- **JAMÁS** ejecutar `git add backend/db_local.sqlite3` ni forzar el tracking de la base de datos.
- **SIEMPRE** revisar qué archivos se están modificando antes de hacer un commit (`git status`).
- Si el proyecto se escala, lo ideal será configurar un servicio de PostgreSQL externo en producción para independizar completamente el código de la capa de datos y prevenir cualquier riesgo de borrado por manipulación de archivos.
