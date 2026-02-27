# SaludPlus API – Simulacro BD (PostgreSQL + MongoDB)

## Descripción

Este proyecto corresponde al simulacro de migración de datos para el sistema SaludPlus.

La aplicación:

- Lee un archivo CSV con información de pacientes, doctores, tratamientos, seguros y citas.
- Normaliza y deduplica datos.
- Inserta datos maestros en PostgreSQL.
- Construye historiales de pacientes en MongoDB.
- Ejecuta un proceso de migración idempotente.
- Genera estadísticas al finalizar la migración.

---

# Tecnologías Utilizadas

- Node.js
- Express
- PostgreSQL
- MongoDB
- Mongoose
- dotenv
- csv-parse
- pg

---

# Requisitos Previos

Antes de ejecutar el proyecto, asegúrese de tener instalado:

## 1. Node.js

Verificar versión:

```bash
node -v