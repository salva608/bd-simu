/**
 * ARCHIVO: server.js
 * DESCRIPCIÓN: Punto de entrada principal de la aplicación.
 * Orquesta la inicialización de las conexiones a las bases de datos (PostgreSQL y MongoDB),
 * ejecuta la migración de datos desde el CSV, e inicia el servidor Express.
 */

import {createTables} from './config/postgres.js';
import app from './app.js';
import { env } from './config/env.js';
import { migrate } from './services/migration_services.js';
import { connectMongo } from './config/mongodb.js';

try {
    // Conectar y crear tablas en PostgreSQL
    console.log("Conecting to postgres..."); 
    await createTables();
    console.log("connect to postgres successfully!"); 

    // Conectar a MongoDB
    console.log("Connecting to MongoDB...");
    await connectMongo();
    console.log("Connected to MongoDB successfully!");

    // Ejecutar la migración de datos desde el archivo CSV
    console.log("migrating data...");
    await migrate(true);
    console.log("data migrated successfully!");

    // Iniciar el servidor Express en el puerto configurado
    app.listen(env.port, () => {
        console.log(`Server is running on port ${env.port}`);
    });
    
}catch (error) {
    console.error("Error starting server", error);
    process.exit(1);
};