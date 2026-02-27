import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { parse } from 'csv-parse/sync';
import { pool } from '../config/postgres.js';
import { env } from '../config/env.js';
import { PatientHistory } from '../config/mongodb.js';

export async function migrate(clearBefore = false) {
    try {
        const csvPath = resolve(env.fileDataCsv);
        let fileContent = await readFile(csvPath, 'utf-8');
        const rows = parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
        });

        console.log(`Read ${rows.length} rows from CSV file`);

        if (clearBefore) {
            await pool.query('BEGIN');
            await pool.query(`
                TRUNCATE TABLE patients, 
                treatments, insurances, doctors, appointments 
                CASCADE
            `);
            await pool.query('COMMIT');
            console.log('Previous Postgres data cleared');

            await PatientHistory.deleteMany({});
            console.log('Previous MongoDB data cleared');
        }

        // ================================
        // POSTGRES MIGRATION
        // ================================

        for (const row of rows) {

            // ---- PATIENT
            const { rows: patientRows } = await pool.query(
                `SELECT id FROM patients WHERE email = $1`,
                [row.patient_email]
            );

            let patientId;

            if (patientRows.length > 0) {
                patientId = patientRows[0].id;
            } else {
                const { rows: newPatient } = await pool.query(
                    `INSERT INTO patients (email, name, phone, address, created_at, updated_at)
                     VALUES ($1, $2, $3, $4, NOW(), NOW())
                     RETURNING id`,
                    [row.patient_email, row.patient_name, row.patient_phone, row.patient_address]
                );

                patientId = newPatient[0].id;
            }

            // ---- DOCTOR
            const { rows: doctorRows } = await pool.query(
                `SELECT id FROM doctors WHERE email = $1`,
                [row.doctor_email]
            );

            let doctorId;

            if (doctorRows.length > 0) {
                doctorId = doctorRows[0].id;
            } else {
                const { rows: newDoctor } = await pool.query(
                    `INSERT INTO doctors (email, name, specialty, created_at, updated_at)
                     VALUES ($1, $2, $3, NOW(), NOW())
                     RETURNING id`,
                    [row.doctor_email, row.doctor_name, row.specialty]
                );

                doctorId = newDoctor[0].id;
            }

            // ---- TREATMENT
            const { rows: treatmentRows } = await pool.query(
                `SELECT id FROM treatments WHERE code = $1`,
                [row.treatment_code]
            );

            let treatmentId;

            if (treatmentRows.length > 0) {
                treatmentId = treatmentRows[0].id;
            } else {
                const { rows: newTreatment } = await pool.query(
                    `INSERT INTO treatments (code, description, cost, created_at, updated_at)
                     VALUES ($1, $2, $3, NOW(), NOW())
                     RETURNING id`,
                    [row.treatment_code, row.treatment_description, row.treatment_cost]
                );

                treatmentId = newTreatment[0].id;
            }

            // ---- INSURANCE
            const { rows: insuranceRows } = await pool.query(
                `SELECT id FROM insurances WHERE name = $1`,
                [row.insurance_provider]
            );

            let insuranceId;

            if (insuranceRows.length > 0) {
                insuranceId = insuranceRows[0].id;
            } else {
                const { rows: newInsurance } = await pool.query(
                    `INSERT INTO insurances (name, coverage_percentage, created_at, updated_at)
                     VALUES ($1, $2, NOW(), NOW())
                     RETURNING id`,
                    [row.insurance_provider, row.coverage_percentage]
                );

                insuranceId = newInsurance[0].id;
            }

            // ---- APPOINTMENT
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
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW())`,
                [
                    row.appointment_id,
                    patientId,
                    doctorId,
                    treatmentId,
                    insuranceId,
                    row.appointment_date,
                    row.treatment_cost,
                    row.amount_paid
                ]
            );
        }

        // ================================
        // MONGODB MIGRATION
        // ================================

        const historiesByEmail = {};

        for (const row of rows) {

            const email = row.patient_email.toLowerCase().trim();

            if (!historiesByEmail[email]) {
                historiesByEmail[email] = {
                    patientEmail: email,
                    patientName: row.patient_name,
                    appointments: []
                };
            }

            historiesByEmail[email].appointments.push({
                appointmentId: row.appointment_id,
                date: row.appointment_date,
                doctorName: row.doctor_name,
                doctorEmail: row.doctor_email,
                specialty: row.specialty,
                treatmentCode: row.treatment_code,
                treatmenDescription: row.treatment_description,
                treatmentCost: Number(row.treatment_cost),
                insuranceProvider: row.insurance_provider,
                coveragePercentage: Number(row.coverage_percentage),
                amountPaid: Number(row.amount_paid)
            });
        }

        for (const history of Object.values(historiesByEmail)) {
            await PatientHistory.updateOne(
                { patientEmail: history.patientEmail },
                { $set: history },
                { upsert: true }
            );
        }

        console.log("Migration completed successfully");

    } catch (error) {
        console.error("Error migrating data:", error);
        throw error;
    }
}