/**
 * ARCHIVO: env.js
 * DESCRIPCIÓN: Gestiona la carga y validación de variables de entorno desde el archivo .env.
 * Este archivo asegura que todas las variables requeridas estén presentes antes de iniciar
 * la aplicación, evitando errores por falta de configuración.
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { error } from 'console';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Cargar variables de entorno desde archivo .env
config({ path: resolve(__dirname, '../../.env') });

// Lista de variables de entorno requeridas para que la aplicación funcione
const required = ["MONGO_URI", "POSTGRES_URI"];

// ============================================
// VALIDACIÓN: Verificar que todas las variables requeridas estén definidas
// Si falta alguna variable, la aplicación detiene su inicio
// ============================================
for (const key of required) {
    if (!process.env[key]) {
        console.log(`Error: Missing required environment variable ${key}`);
        throw error();
    }
}

// ============================================
// EXPORTAR OBJETO DE CONFIGURACIÓN
// DESCRIPCIÓN: Expone un objeto con todas las variables de entorno necesarias
// para que el resto de la aplicación acceda a ellas de forma centralizada
// ============================================
export const env = {
    // Puerto en el que se ejecuta el servidor Express (por defecto 3000)
    port : process.env.PORT ?? 3000, 
    
    // URL de conexión a la base de datos MongoDB
    mongoUri : process.env.MONGO_URI,
    
    // URL de conexión a la base de datos PostgreSQL
    postgresUri : process.env.POSTGRES_URI,
    
    // Ruta al archivo CSV con los datos de simulación a migrar
    fileDataCsv : process.env.FILE_DATA_CSV ?? "./data/simulation_saludplus_data.csv"
}

