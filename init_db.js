import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres.mvqenckylaxznlrtqqjm:cbnmpp2344&&@aws-1-us-east-2.pooler.supabase.com:5432/postgres';

const client = new Client({
    connectionString,
});

async function runSQL() {
    try {
        await client.connect();
        console.log('Connected to PostgreSQL successfully.');

        const createTareasTableQuery = `
      CREATE TABLE IF NOT EXISTS tareas (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        tarea TEXT NOT NULL,
        fecha_limite TEXT NOT NULL,
        estado TEXT NOT NULL,
        creador_role TEXT NOT NULL,
        asignado_a TEXT NOT NULL,
        fecha_reprogramacion TEXT,
        ejecutado BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

        const createNotasTableQuery = `
      CREATE TABLE IF NOT EXISTS notas (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        texto TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

        console.log('Creating tareas table...');
        await client.query(createTareasTableQuery);
        console.log('Tareas table ready.');

        console.log('Creating notas table...');
        await client.query(createNotasTableQuery);
        console.log('Notas table ready.');

    } catch (err) {
        console.error('Error executing query:', err.stack);
    } finally {
        await client.end();
    }
}

runSQL();
