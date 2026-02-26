✅ 1️⃣ Entrar a PostgreSQL
psql -U postgres

Si quieres entrar directamente a una base específica:

psql -U postgres -d saludplus
✅ 2️⃣ Ver en qué base de datos estás

Dentro de psql:

SELECT current_database();

O más rápido:

\conninfo
✅ 3️⃣ Ver todas las bases de datos
\l

o

\list
✅ 4️⃣ Cambiar de base de datos
\c nombre_base

Ejemplo:

\c saludplus
✅ 5️⃣ Crear una base de datos nueva
CREATE DATABASE nombre_base;

Ejemplo:

CREATE DATABASE saludplus;
✅ 6️⃣ Ver tablas de la base actual
\dt
✅ 7️⃣ Salir de PostgreSQL
\q