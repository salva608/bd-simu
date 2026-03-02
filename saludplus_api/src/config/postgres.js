/**
 * ARCHIVO: postgres.js
 * DESCRIPCIÓN: Configura la conexión a la base de datos PostgreSQL
 * y define la creación de todas las tablas necesarias para el sistema.
 * Utiliza el pool de conexiones de pg para manejar múltiples conexiones eficientemente.
 */

import pg from 'pg';
import { env } from "./env.js";

const { Pool } = pg;

// ============================================
// POOL DE CONEXIONES: PostgreSQL
// DESCRIPCIÓN: Crea un pool de conexiones reutilizables a PostgreSQL
// Esto mejora el rendimiento al no crear nueva conexión para cada query
// ============================================
export const pool = new Pool({
	connectionString: env.postgresUri
});

// ============================================
// FUNCIÓN: createTables()
// DESCRIPCIÓN: Crea todas las tablas del sistema en PostgreSQL si no existen
// Las tablas incluyen:
// - PATIENTS: Información de los pacientes
// - DOCTORS: Información de los doctores
// - INSURANCES: Compañías de seguros
// - TREATMENTS: Tratamientos médicos disponibles
// - APPOINTMENTS: Citas médicas (con relaciones a las otras tablas)
// ============================================
export async function createTables() {
	const client = await pool.connect();
	try {
		// Iniciar transacción para garantizar atomicidad
		await client.query("BEGIN");

		// ============ TABLA PATIENTS ============
		// Almacena información básica de los pacientes
		await client.query(`
	CREATE TABLE IF NOT EXISTS PATIENTS(
	"id" serial NOT NULL PRIMARY KEY,
	"email" varchar(100) NOT NULL UNIQUE,
	"name" varchar(100) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"address" varchar(150) NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL
	);`);

		// ============ TABLA DOCTORS ============
		// Almacena información de los doctores (nombre, especialidad, etc.)
		await client.query(`
	CREATE TABLE IF NOT EXISTS DOCTORS (
	"id" serial NOT NULL PRIMARY KEY,
	"email" varchar(100) NOT NULL UNIQUE,
	"name" varchar(100) NOT NULL,
	"specialty" varchar(100) NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL
	);`);

		// ============ TABLA INSURANCES ============
		// Almacena información de compañías aseguradoras
		await client.query(`
	CREATE TABLE IF NOT EXISTS INSURANCES (
	"id" serial NOT NULL PRIMARY KEY,
	"name" varchar(100) NOT NULL UNIQUE,
	"coverage_percentage" NUMERIC(10,2) NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL
	);`);

		// ============ TABLA TREATMENTS ============
		// Almacena información de tratamientos médicos disponibles
		await client.query(`
	CREATE TABLE IF NOT EXISTS TREATMENTS (
	"id" serial NOT NULL PRIMARY KEY,
	"code" varchar(20) NOT NULL UNIQUE,
	"description" varchar(255) NOT NULL,
	"cost" NUMERIC(10,2) NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL
	);`);

		await client.query(`
	CREATE TABLE IF NOT EXISTS APPOINTMENTS (
	"id" serial NOT NULL PRIMARY KEY,
	"description" varchar(255) NOT NULL,
	"patients_id" int NOT NULL,
	"doctor_id" int NOT NULL,
	"treatment_id" int NOT NULL,
	"insurance_id" int NOT NULL,
	"appoinment_date" date NOT NULL,
	"treatment_cost" NUMERIC(10,2) NOT NULL,
	"amount_paid" NUMERIC(10,2) NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL,
	FOREIGN KEY("patients_id") REFERENCES PATIENTS ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	FOREIGN KEY("doctor_id") REFERENCES DOCTORS ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	FOREIGN KEY("insurance_id") REFERENCES INSURANCES ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
	FOREIGN KEY("treatment_id") REFERENCES TREATMENTS ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
	);`);

		await client.query(`CREATE INDEX IF NOT EXISTS idx_appointments_patient ON APPOINTMENTS(patients_id)`);
		await client.query(`CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON APPOINTMENTS(doctor_id)`);
		await client.query(`CREATE INDEX IF NOT EXISTS idx_appointments_treatment ON APPOINTMENTS(treatment_id)`);
		await client.query(`CREATE INDEX IF NOT EXISTS idx_appointments_insurance ON APPOINTMENTS(insurance_id)`);

		await client.query("COMMIT");
		console.log("Tables created successfully");

	} catch (error) {
		console.error("Error creating tables", error);
		await client.query("ROLLBACK");
	} finally {
		client.release();
	}
	}