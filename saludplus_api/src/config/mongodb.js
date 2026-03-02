/**
 * ARCHIVO: mongodb.js
 * DESCRIPCIÓN: Configura la conexión a MongoDB y define los esquemas de datos
 * para almacenar el historial de citas de los pacientes.
 * Utiliza Mongoose como ODM (Object Data Modeling) para facilitar las operaciones
 * con la base de datos NoSQL.
 */

import mongoose from "mongoose";
import { env } from "./env.js";

// ============================================
// ESQUEMA: Appointment (Cita Médica)
// DESCRIPCIÓN: Define la estructura de una cita médica
// Este esquema se anida dentro del esquema PatientHistory para almacenar
// el historial completo de citas de cada paciente
// ============================================
const appointmentSchema = new mongoose.Schema({
  // ID único de la cita (generalmente del CSV)
  appointmentId: {type: String, required: true},
  
  // Fecha y hora de la cita
  date: {type: Date, required: true},
  
  // Nombre del doctor que atendió la cita
  doctorName: {type: String, required: true}, 
  
  // Email del doctor para contacto
  doctorEmail: {type: String, required: true},
  
  // Especialidad del doctor (cardiología, pediatría, etc.)
  specialty: {type: String, required: true},
  
  // Código del tratamiento realizado
  treatmentCode: {type: String},
  
  // Descripción detallada del tratamiento
  treatmenDescription: {type: String},
  
  // Costo total del tratamiento en dinero
  treatmentCost: {type: Number, required: true},
  
  // Nombre de la compañía aseguradora del paciente
  insuranceProvider: {type: String, required: true},
  
  // Porcentaje de cobertura del seguro (ej: 80%)
  coveragePercentage: {type: Number, required: true},
  
  // Monto que fue pagado por el paciente
  amountPaid: {type: Number, required: true}
  
}, {_id: false}); // No generar ID automaticamente para subdocumentos 

// ============================================
// ESQUEMA: PatientHistory (Historial del Paciente)
// DESCRIPCIÓN: Define la estructura principal del historial de un paciente
// Almacena información básica del paciente y su array de citas médicas
// ============================================
const patientHistorySchema = new mongoose.Schema({
  // Email único del paciente (clave principal para búsquedas)
  patientEmail: {type: String, 
    required: true, 
    unique: true, 
    match: /^\S+@\S+\.\S+$/}, // Validación de formato de email
  
  // Nombre completo del paciente
  patientName: {type: String, required: true},
  
  // Array de citas médicas (usa el esquema Appointment definido arriba)
  // Por defecto es un array vacío
  appointments: {
    type: [appointmentSchema],
    default: []
  }
}, {timestamps: true}); // Añade automáticamente createdAt y updatedAt

// ============================================
// MODELO: PatientHistory
// DESCRIPCIÓN: Crea el modelo Mongoose basado en el esquema patientHistorySchema
// Se usa para realizar operaciones CRUD en la colección 'PatientHistories' de MongoDB
// Exportado para ser usado en otros archivos
// ============================================
export const PatientHistory = 
    mongoose.model("PatientHistory", 
        patientHistorySchema);

// ============================================
// FUNCIÓN: connectMongo()
// DESCRIPCIÓN: Establece la conexión a la base de datos MongoDB
// Utiliza la URL de conexión (mongoUri) especificada en las variables de entorno
// Retorna: Una promesa que se resuelve al conectar exitosamente
// Lanza: Error si no puede conectar a MongoDB
// ============================================
export async function connectMongo(){
    try{
        // Conectar a MongoDB usando la URL de env
        await mongoose.connect(env.mongoUri);
        console.log("Connected to MongoDB");
    } catch (error) {
        // Si hay error, mostrar en consola y relanzar el error
        console.error("Error connecting to MongoDB:", error);
        throw error; 
    }
}
