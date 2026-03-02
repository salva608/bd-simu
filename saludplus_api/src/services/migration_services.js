/**
 * ARCHIVO: migration_services.js
 * DESCRIPCIÓN: Servicio principal que orquesta la migración de datos desde un archivo CSV
 * hacia dos bases de datos: PostgreSQL (SQL) y MongoDB (NoSQL).
 * Lee el archivo CSV, procesa cada fila, inserta/actualiza registros en ambas BD,
 * y genera estadísticas de la migración realizada.
 */

import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { parse } from 'csv-parse/sync';
import { pool } from '../config/postgres.js';
import { env } from '../config/env.js';
import { PatientHistory } from '../config/mongodb.js';

// ============================================
// FUNCIÓN: migrate(clearBefore = false)
// DESCRIPCIÓN: Función principal que ejecuta el proceso de migración de datos.
// 1. Lee el archivo CSV con los datos de simulación
// 2. Limpia las tablas si clearBefore es true
// 3. Procesa cada fila insertando datos en PostgreSQL (pacientes, doctores, tratamientos, seguros, citas)
// 4. Construye historial de citas en MongoDB agrupado por paciente
// 5. Calcula y retorna estadísticas de la migración
// Parámetros: clearBefore (booleano, si es true limpia datos previos)
// Retorna: Objeto con conteos de registros migrados para cada tabla
// ============================================
export async function migrate(clearBefore = false) {
    try {
        // Lee el archivo CSV especificado en las variables de entorno
        const csvPath = resolve(env.fileDataCsv);
        let fileContent = await readFile(csvPath, 'utf-8');
        // Parse el CSV con opciones: usa encabezados, salta líneas vacías, y elimina espacios
        const rows = parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
        });

        console.log(`Read ${rows.length} rows from CSV file`);

        // Si clearBefore es true, elimina todos los datos previos de ambas BD
        if (clearBefore) {
            // Borra las tablas de PostgreSQL (en cascada para respetar keys)
            await pool.query('BEGIN');
            await pool.query(`
                TRUNCATE TABLE patients, 
                treatments, insurances, doctors, appointments 
                CASCADE
            `);
            await pool.query('COMMIT');
            console.log('Previous Postgres data cleared');

            // Borra todos los documentos de MongoDB
            await PatientHistory.deleteMany({});
            console.log('Previous MongoDB data cleared');
        }

        // ========== PROCESAR CADA FILA DEL CSV ==========
        for (const row of rows) {

            // Normalizar emails a minúsculas para evitar duplicados
            const patientEmail = row.patient_email.toLowerCase().trim();
            const doctorEmail = row.doctor_email.toLowerCase().trim();

            // ---- INSERTAR O RECUPERAR PACIENTE ----
            let patientId;

            const insertPatient = await pool.query(
                `INSERT INTO patients (email, name, phone, address, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, NOW(), NOW())
                 ON CONFLICT (email) DO NOTHING
                 RETURNING id`,
                [patientEmail, row.patient_name, row.patient_phone, row.patient_address]
            );

            // Si el paciente fue insertado, tomar su ID; si no, buscarlo
            if (insertPatient.rows.length > 0) {
                patientId = insertPatient.rows[0].id;
            } else {
                const { rows } = await pool.query(
                    `SELECT id FROM patients WHERE email = $1`,
                    [patientEmail]
                );
                patientId = rows[0].id;
            }

            // ---- INSERTAR O RECUPERAR DOCTOR ----
            let doctorId;

            const insertDoctor = await pool.query(
                `INSERT INTO doctors (email, name, specialty, created_at, updated_at)
                 VALUES ($1, $2, $3, NOW(), NOW())
                 ON CONFLICT (email) DO NOTHING
                 RETURNING id`,
                [doctorEmail, row.doctor_name, row.specialty]
            );

            // Si el doctor fue insertado, tomar su ID; si no, buscarlo
            if (insertDoctor.rows.length > 0) {
                doctorId = insertDoctor.rows[0].id;
            } else {
                const { rows } = await pool.query(
                    `SELECT id FROM doctors WHERE email = $1`,
                    [doctorEmail]
                );
                doctorId = rows[0].id;
            }

            // ---- INSERTAR O ACTUALIZAR TRATAMIENTO ----
            await pool.query(
                `INSERT INTO treatments (code, description, cost, created_at, updated_at)
                 VALUES ($1, $2, $3, NOW(), NOW())
                 ON CONFLICT (code) DO NOTHING`,
                [row.treatment_code, row.treatment_description, parseInt(row.treatment_cost)]
            );

            // ---- INSERTAR O ACTUALIZAR SEGUROS ----
            await pool.query(
                `INSERT INTO insurances (name, coverage_percentage, created_at, updated_at)
                 VALUES ($1, $2, NOW(), NOW())
                 ON CONFLICT (name) DO NOTHING`,
                [row.insurance_provider, parseInt(row.coverage_percentage)]
            );

            // Recuperar el ID del seguro
            const { rows: [insurance] } = await pool.query(
                `SELECT id FROM insurances WHERE name = $1`,
                [row.insurance_provider]
            ); // Cierre de SELECT id FROM insurances

            // Recuperar el ID del tratamiento
            const { rows: [treatment] } = await pool.query(
                `SELECT id FROM treatments WHERE code = $1`,
                [row.treatment_code]
            );

            // ---- INSERTAR CITA (APPOINTMENT) EN POSTGRESQL ----
            await pool.query(
                `INSERT INTO appointments (
                    description,
                    patients_id,
                    doctor_id,
                    treatment_id,
                    insurance_id,
                    appoinment_date,
                    treatment_cost,
                    amount_paid,
                    created_at,
                    updated_at
                )
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW())
                ON CONFLICT (description) DO NOTHING`,
                [
                    row.appointment_id,
                    patientId,
                    doctorId,
                    treatment.id,
                    insurance.id,
                    row.appointment_date,
                    parseInt(row.treatment_cost),
                    parseInt(row.amount_paid)
                ]
            );
        } // Fin del bucle de procesamiento de filas

        // ========== PROCESAR DATOS PARA MONGODB ==========
        // Construir el historial de citas agrupado por email del paciente
        const historiesByEmail = {};

        for (const row of rows) {
            const email = row.patient_email.toLowerCase().trim();

            // Crear entrada para nuevo paciente si no existe
            if (!historiesByEmail[email]) {
                historiesByEmail[email] = {
                    patientEmail: email,
                    patientName: row.patient_name,
                    appointments: []
                };
            }

            // Agregar cita al historial del paciente
            historiesByEmail[email].appointments.push({
                appointmentId: row.appointment_id,
                date: row.appointment_date,
                doctorName: row.doctor_name,
                doctorEmail: row.doctor_email.toLowerCase().trim(),
                specialty: row.specialty,
                treatmentCode: row.treatment_code,
                treatmentDescription: row.treatment_description,
                treatmentCost: parseFloat(row.treatment_cost),
                insuranceProvider: row.insurance_provider,
                coveragePercentage: parseInt(row.coverage_percentage),
                amountPaid: parseFloat(row.amount_paid)
            });
        }

        // Insertar/actualizar cada historial en MongoDB
        for (const history of Object.values(historiesByEmail)) {
            await PatientHistory.updateOne(
                { patientEmail: history.patientEmail },
                { $set: history },
                { upsert: true } // Crear si no existe, actualizar si existe
            );
        }

        // ========== GENERAR Y MOSTRAR ESTADÜSTICAS ==========
        // Contar registros en PostgreSQL
        const { rows: [{ count: pCount }] } = await pool.query('SELECT COUNT(*) FROM patients');
        const { rows: [{ count: dCount }] } = await pool.query('SELECT COUNT(*) FROM doctors');
        const { rows: [{ count: tCount }] } = await pool.query('SELECT COUNT(*) FROM treatments');
        const { rows: [{ count: iCount }] } = await pool.query('SELECT COUNT(*) FROM insurances');
        const { rows: [{ count: aCount }] } = await pool.query('SELECT COUNT(*) FROM appointments');
        
        // Contar documentos en MongoDB
        const hCount = await PatientHistory.countDocuments();

        console.log("===== Migration Stats =====");
        console.log("Patients:", pCount);
        console.log("Doctors:", dCount);
        console.log("Treatments:", tCount);
        console.log("Insurances:", iCount);
        console.log("Appointments:", aCount);
        console.log("Histories (Mongo):", hCount);

        // Retornar resumen de la migración
        return {
            patients: parseInt(pCount),
            doctors: parseInt(dCount),
            treatments: parseInt(tCount),
            insurances: parseInt(iCount),
            appointments: parseInt(aCount),
            histories: hCount,
            csvPath
        };

    } catch (error) {
        console.error("Error migrating data:", error);
        throw error;
    }
}