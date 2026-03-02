/**
 * ARCHIVO: app.js
 * DESCRIPCIÓN: Define todas las rutas (endpoints) de la API REST del sistema SaludPlus.
 * Este archivo contiene los endpoints para consultar y gestionar doctores, pacientes,
 * historial de citas, reportes de ingresos, y más. Integra tanto PostgreSQL como MongoDB.
 */

import express from 'express';
import { pool } from './config/postgres.js';
import { PatientHistory } from './config/mongodb.js';

const app = express();

app.use(express.json());

// ============================================
// FUNCIÓN: GET /api/doctors
// DESCRIPCIÓN: Obtiene la lista de todos los doctores.
// Parámetros opcionales: specialty (especialidad del doctor)
// Retorna: Array de doctores o filtrados por especialidad
// ============================================
app.get('/api/doctors', async (req, res) => {
  const { specialty } = req.query;

  const query = specialty
    ? 'SELECT * FROM doctors WHERE specialty = $1'
    : 'SELECT * FROM doctors';

  const values = specialty ? [specialty] : [];

  const result = await pool.query(query, values);

  res.json({
    ok: true,
    doctors: result.rows
  });
});

// ============================================
// FUNCIÓN: GET /api/doctors/:id
// DESCRIPCIÓN: Obtiene los detalles de un doctor específico por su ID.
// Parámetro: id (ID único del doctor)
// Retorna: Datos del doctor o error 404 si no existe
// ============================================
app.get('/api/doctors/:id', async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM doctors WHERE id = $1',
    [req.params.id]
  );

  if (!result.rows.length) {
    return res.status(404).json({
      ok: false,
      error: 'Doctor not found'
    });
  }

  res.json({
    ok: true,
    doctor: result.rows[0]
  });
});

// ============================================
// FUNCIÓN: PUT /api/doctors/:id
// DESCRIPCIÓN: Actualiza los datos de un doctor por su ID.
// También sincroniza los cambios en MongoDB para mantener
// la consistencia de datos entre las dos bases de datos.
// Parámetros: id (ID del doctor a actualizar)
// Body: { name, email, specialty }
// Retorna: Doctor actualizado
// ============================================
app.put('/api/doctors/:id', async (req, res) => {
  const { name, email, specialty } = req.body;

  const old = await pool.query(
    'SELECT * FROM doctors WHERE id = $1',
    [req.params.id]
  );

  if (!old.rows.length) {
    return res.status(404).json({
      ok: false,
      error: 'Doctor not found'
    });
  }

  const updated = await pool.query(
    `UPDATE doctors 
     SET name=$1, email=$2, specialty=$3 
     WHERE id=$4 
     RETURNING *`,
    [name, email, specialty, req.params.id]
  );

  // Propagar cambios a Mongo usando Mongoose
  await PatientHistory.updateMany(
    { "appointments.doctorEmail": old.rows[0].email },
    {
      $set: {
        "appointments.$[e].doctorName": name,
        "appointments.$[e].doctorEmail": email,
        "appointments.$[e].specialty": specialty
      }
    },
    {
      arrayFilters: [{ "e.doctorEmail": old.rows[0].email }]
    }
  );

  res.json({
    ok: true,
    doctor: updated.rows[0]
  });
});

// ============================================
// FUNCIÓN: GET /api/reports/revenue
// DESCRIPCIÓN: Genera un reporte de ingresos por citas y seguros.
// Parámetros opcionales: startDate, endDate (para filtrar por rango de fechas)
// Retorna: Ingresos totales y desglose por compañía de seguros
// ============================================
app.get('/api/reports/revenue', async (req, res) => {
  const { startDate, endDate } = req.query;

  const where = startDate && endDate
    ? 'WHERE appointment_date BETWEEN $1 AND $2'
    : '';

  const values = startDate && endDate ? [startDate, endDate] : [];

  const total = await pool.query(
    `SELECT SUM(amount_paid) FROM appointments ${where}`,
    values
  );

  const byInsurance = await pool.query(
    `SELECT i.name, SUM(a.amount_paid) total, COUNT(*) count
     FROM appointments a
     JOIN insurances i ON a.insurance_id = i.id
     ${where}
     GROUP BY i.name`,
    values
  );

  res.json({
    ok: true,
    report: {
      totalRevenue: Number(total.rows[0].sum) || 0,
      byInsurance: byInsurance.rows
    }
  });
});

// ============================================
// FUNCIÓN: GET /api/patients/:email/history
// DESCRIPCIÓN: Obtiene el historial completo de citas de un paciente
// desde MongoDB. Incluye todos los detalles de las citas del paciente.
// Parámetro: email (Email único del paciente)
// Retorna: Datos del paciente y array de todas sus citas
// ============================================
app.get('/api/patients/:email/history', async (req, res) => {
  const history = await PatientHistory.findOne({
    patientEmail: req.params.email
  });

  if (!history) {
    return res.status(404).json({
      ok: false,
      error: 'Patient not found'
    });
  }

  res.json({
    ok: true,
    patient: {
      email: history.patientEmail,
      name: history.patientName
    },
    appointments: history.appointments
  });
});

export default app;