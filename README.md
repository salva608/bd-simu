SaludPlus API – Simulacro BD (PostgreSQL + MongoDB)
Descripción

Este proyecto corresponde al simulacro de migración de datos para el sistema SaludPlus.

La aplicación:

Lee un archivo CSV con información de pacientes, doctores, tratamientos, seguros y citas.

Normaliza y deduplica datos.

Inserta datos maestros en PostgreSQL.

Construye historiales de pacientes en MongoDB.

Ejecuta un proceso de migración idempotente.

Genera estadísticas al finalizar la migración.

Tecnologías Utilizadas

Node.js

Express

PostgreSQL

MongoDB

Mongoose

dotenv

csv-parse

pg

Requisitos Previos

Antes de ejecutar el proyecto, asegúrese de tener instalado:

1. Node.js

Verificar versión:

node -v

Se recomienda Node 18 o superior.

2. PostgreSQL

Verificar:

psql --version

Debe tener el servidor activo.

3. MongoDB

Verificar:

mongod --version

Debe tener el servicio corriendo.

Instalación del Proyecto

Clonar o descargar el proyecto.

Ubicarse en la carpeta raíz:

cd saludplus_api

Instalar dependencias:

npm install

Esto instalará todas las dependencias definidas en package.json.

Variables de Entorno

Crear un archivo .env en la raíz del proyecto con la siguiente estructura:

PORT=3000

POSTGRES_HOST=localhost
POSTGRES_USER=tu_usuario
POSTGRES_PASSWORD=tu_password
POSTGRES_DB=saludplus
POSTGRES_PORT=5432

MONGO_URI=mongodb://localhost:27017/saludplus

FILE_DATA_CSV=./ruta/al/simulacro_saludplus_data.csv

Asegúrese de que la ruta del CSV sea correcta.

Configuración de Base de Datos
1. Crear Base de Datos en PostgreSQL

Antes de ejecutar el proyecto, debe crear la base de datos manualmente:

CREATE DATABASE saludplus;
2. Crear Tablas Necesarias

Es obligatorio que las tablas existan antes de ejecutar la migración.

Las tablas necesarias son:

patients

doctors

treatments

insurances

appointments

Es indispensable que las siguientes columnas tengan restricción UNIQUE para que el proceso idempotente funcione correctamente:

patients.email

doctors.email

treatments.code

insurances.name

appointments.description (o el campo definido como identificador único)

Ejemplo:

email VARCHAR(255) UNIQUE NOT NULL

Si no existen restricciones UNIQUE, el proceso ON CONFLICT fallará.

Ejecución del Proyecto

Para iniciar el servidor y ejecutar la migración:

npm run start

El servidor:

Conecta a PostgreSQL.

Conecta a MongoDB.

Ejecuta la migración.

Muestra estadísticas en consola.

Levanta la API en el puerto configurado.

Proceso de Migración (Bulk Load)

La migración realiza:

Lectura del archivo CSV

Procesa todas las filas.

Omite líneas vacías.

Aplica trim a valores.

Normalización de Datos

Emails en minúsculas.

Conversión de números con parseInt y parseFloat.

Eliminación de duplicados mediante ON CONFLICT.

Deduplicación

Si un paciente aparece múltiples veces en el CSV:

Solo se inserta una vez en PostgreSQL.

Se agregan múltiples citas asociadas.

Distribución de Datos

PostgreSQL:

Datos maestros normalizados.

Citas con referencias a entidades maestras.

MongoDB:

Documento por paciente.

Historial con citas incrustadas.

Idempotencia

El proceso puede ejecutarse múltiples veces sin duplicar datos gracias al uso de:

ON CONFLICT (...) DO NOTHING
Estadísticas Finales

Al finalizar la migración se muestran:

Total de pacientes.

Total de doctores.

Total de tratamientos.

Total de seguros.

Total de citas.

Total de historiales en MongoDB.

Estructura del CSV

Ejemplo:

patient_name,patient_email,patient_phone,patient_address,
doctor_name,doctor_email,specialty,
appointment_id,appointment_date,
treatment_code,treatment_description,treatment_cost,
insurance_provider,coverage_percentage,amount_paid
Buenas Prácticas Aplicadas

Uso de async/await.

Manejo de errores con try/catch.

Upsert en MongoDB.

Uso de transacciones en limpieza inicial.

Separación de configuración (env, postgres, mongodb).

Estructura modular del proyecto.

Posibles Errores Comunes
Error ON CONFLICT

Si aparece el error:

no hay restricción única o de exclusión

Significa que falta la restricción UNIQUE en la tabla correspondiente.

Error de conexión

Verifique:

Credenciales en el archivo .env.

Servicios PostgreSQL y MongoDB activos.

Puerto correcto.