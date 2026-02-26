import {createTables} from './config/postgres.js';
import app from './app.js';
import { env } from './config/env.js';
import { migrate } from './services/migration_services.js';

try {
    console.log("Conecting to postgres...") 
    await createTables();
    console.log("connect to postgres successfully!") 

    console.log("migrating data...");
    await migrate(true);
    console.log("data migrated successfully!");

    app.listen(env.port, () => {
        console.log(`Server is running on port ${env.port}`);
    });
    
}catch (error) {
    console.error("Error starting server", error);
    process.exit(1);
};