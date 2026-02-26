	import pg from 'pg';
	import { env } from "./env.js";

	const { Pool } = pg;

	export const pool = new Pool({
	connectionString: env.postgresUri
	});

	export async function createTables() {
	const client = await pool.connect();
	try {
		await client.query("BEGIN");

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

		await client.query(`
	CREATE TABLE IF NOT EXISTS DOCTORS (
	"id" serial NOT NULL PRIMARY KEY,
	"email" varchar(100) NOT NULL UNIQUE,
	"name" varchar(100) NOT NULL,
	"specialty" varchar(100) NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL
	);`);

		await client.query(`
	CREATE TABLE IF NOT EXISTS INSURANCES (
	"id" serial NOT NULL PRIMARY KEY,
	"name" varchar(100) NOT NULL UNIQUE,
	"coverage_percentage" NUMERIC(10,2) NOT NULL,
	"created_at" TIMESTAMPTZ NOT NULL,
	"updated_at" TIMESTAMPTZ NOT NULL
	);`);

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