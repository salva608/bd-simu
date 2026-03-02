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

------------------------------------------------------------------------------------------------------------------

🔐 1️⃣ Conexión y base de datos
psql -U postgres
psql -U postgres -d nombre_base
\conninfo
SELECT current_database();
\l
\l+
\c nombre_base
CREATE DATABASE nombre_base;
📂 2️⃣ Tablas
\dt
\dt+
\d nombre_tabla
\d+
\di
\dv
👤 3️⃣ Usuarios y roles (SEGURIDAD)
\du
CREATE USER nombre_usuario WITH PASSWORD 'contraseña';
ALTER USER nombre_usuario WITH PASSWORD 'nueva_contraseña';
DROP USER nombre_usuario;
🔑 4️⃣ Permisos
\z
\dp
GRANT ALL PRIVILEGES ON DATABASE nombre_base TO usuario;
REVOKE ALL PRIVILEGES ON DATABASE nombre_base FROM usuario;
GRANT SELECT, INSERT, UPDATE, DELETE ON nombre_tabla TO usuario;
🧠 5️⃣ Información del sistema
SELECT version();
SHOW all;
SHOW data_directory;
SHOW config_file;
📊 6️⃣ Conexiones activas
SELECT * FROM pg_stat_activity;
📏 7️⃣ Tamaño de base de datos y tablas
SELECT pg_size_pretty(pg_database_size('nombre_base'));
SELECT pg_size_pretty(pg_relation_size('nombre_tabla'));
🔎 8️⃣ Índices
\di
CREATE INDEX nombre_indice ON nombre_tabla (columna);
🧩 9️⃣ Estructura avanzada
SELECT * FROM information_schema.tables;
SELECT * FROM information_schema.columns WHERE table_name = 'nombre_tabla';
🛑 🔟 Salir
\q
🛡️ SI QUIERES NIVEL PROFESIONAL DE VERIFICACIÓN

Estos son los más importantes para auditoría y control:

\l+
\dt+
\d nombre_tabla
\du
\z
SELECT * FROM pg_stat_activity;
SELECT version();