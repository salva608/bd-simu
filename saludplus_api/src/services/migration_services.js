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

        for (const row of rows) {

            const patientEmail = row.patient_email.toLowerCase().trim();
            const doctorEmail = row.doctor_email.toLowerCase().trim();

        
            let patientId;

            const insertPatient = await pool.query(
                `INSERT INTO patients (email, name, phone, address, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, NOW(), NOW())
                 ON CONFLICT (email) DO NOTHING
                 RETURNING id`,
                [patientEmail, row.patient_name, row.patient_phone, row.patient_address]
            );

            if (insertPatient.rows.length > 0) {
                patientId = insertPatient.rows[0].id;
            } else {
                const { rows } = await pool.query(
                    `SELECT id FROM patients WHERE email = $1`,
                    [patientEmail]
                );
                patientId = rows[0].id;
            }

        
            let doctorId;

            const insertDoctor = await pool.query(
                `INSERT INTO doctors (email, name, specialty, created_at, updated_at)
                 VALUES ($1, $2, $3, NOW(), NOW())
                 ON CONFLICT (email) DO NOTHING
                 RETURNING id`,
                [doctorEmail, row.doctor_name, row.specialty]
            );

            if (insertDoctor.rows.length > 0) {
                doctorId = insertDoctor.rows[0].id;
            } else {
                const { rows } = await pool.query(
                    `SELECT id FROM doctors WHERE email = $1`,
                    [doctorEmail]
                );
                doctorId = rows[0].id;
            }

        
            await pool.query(
                `INSERT INTO treatments (code, description, cost, created_at, updated_at)
                 VALUES ($1, $2, $3, NOW(), NOW())
                 ON CONFLICT (code) DO NOTHING`,
                [row.treatment_code, row.treatment_description, parseInt(row.treatment_cost)]
            );



            await pool.query(
                `INSERT INTO insurances (name, coverage_percentage, created_at, updated_at)
                 VALUES ($1, $2, NOW(), NOW())
                 ON CONFLICT (name) DO NOTHING`,
                [row.insurance_provider, parseInt(row.coverage_percentage)]
            );

            const { rows: [insurance] } = await pool.query(
                `SELECT id FROM insurances WHERE name = $1`,
                [row.insurance_provider]
            );

            const { rows: [treatment] } = await pool.query(
                `SELECT id FROM treatments WHERE code = $1`,
                [row.treatment_code]
            );

            


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
        }


        // MONGODB HISTORIES
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

        for (const history of Object.values(historiesByEmail)) {
            await PatientHistory.updateOne(
                { patientEmail: history.patientEmail },
                { $set: history },
                { upsert: true }
            );
        }


        // STATISTICS
        const { rows: [{ count: pCount }] } = await pool.query('SELECT COUNT(*) FROM patients');
        const { rows: [{ count: dCount }] } = await pool.query('SELECT COUNT(*) FROM doctors');
        const { rows: [{ count: tCount }] } = await pool.query('SELECT COUNT(*) FROM treatments');
        const { rows: [{ count: iCount }] } = await pool.query('SELECT COUNT(*) FROM insurances');
        const { rows: [{ count: aCount }] } = await pool.query('SELECT COUNT(*) FROM appointments');
        const hCount = await PatientHistory.countDocuments();

        console.log("===== Migration Stats =====");
        console.log("Patients:", pCount);
        console.log("Doctors:", dCount);
        console.log("Treatments:", tCount);
        console.log("Insurances:", iCount);
        console.log("Appointments:", aCount);
        console.log("Histories (Mongo):", hCount);

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