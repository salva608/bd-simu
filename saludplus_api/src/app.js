import express from 'express';
import { pool } from './config/postgres.js';
import { PatientHistory } from './config/mongodb.js';

const app = express();

app.use(express.json());

/* =========================
   GET ALL DOCTORS
========================= */
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

/* =========================
   GET DOCTOR BY ID
========================= */
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

/* =========================
   UPDATE DOCTOR (SQL + Mongo)
========================= */
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

/* =========================
   REVENUE REPORT (SQL)
========================= */
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

/* =========================
   PATIENT HISTORY (Mongo)
========================= */
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