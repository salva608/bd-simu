import { readFile } from 'fs/promises'
import { Pool} from '../config/postgres.js';
import { parse } from 'csv-parse/sync';
import { resolve } from 'path ';
import { env } from '../config/env.js';

export async function migrate(clearBefore = false) {
    try {
        let csv = await readFile(resolve(env.fileDataCsv), 'utf-8');

        const rows = parse(csv,{
            columns: true,
            trim: true,
            skip_empty_lines: true
        });
        console.log(rows);
        //ahora vamos a guardar los datos unicos  con set

        const patientsEmails = new Set();
        const doctorsEmails = new Set ();
        const treatmentsCodes = new Set();
        const insurancesProvidersNames = new Set();


        
    }catch (Error) {console.log(Error)} 
};