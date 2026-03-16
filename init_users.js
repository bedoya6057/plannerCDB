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

    const createUsuariosTable = `
      CREATE TABLE IF NOT EXISTS usuarios (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        nombre TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        rol TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    console.log('Creating usuarios table...');
    await client.query(createUsuariosTable);

    // Clear existing to avoid unique constraint errors if re-run
    await client.query(`DELETE FROM usuarios WHERE email IN ('Lchu@cbd.com', 'Dcarreon@cdb.com', 'Mbravo@cdb.com', 'lchu@cdb.com', 'dcarreon@cdb.com', 'mbravo@cdb.com', 'prutte@cdb.com', 'dzecevic@cdb.com');`);

    const insertUsers = `
      INSERT INTO usuarios (nombre, email, password, rol) VALUES
      ('Luis Eduardo Chu', 'lchu@cdb.com', 'lchucdb', 'Jefaturas'),
      ('Daniela Carreon', 'dcarreon@cdb.com', 'dcarreoncdb', 'Jefaturas'),
      ('Marco Bravo', 'mbravo@cdb.com', 'mbravocdb', 'Administrativos'),
      ('Prutte', 'prutte@cdb.com', 'prutte', 'Administrativos'),
      ('Dzecevic', 'dzecevic@cdb.com', 'dzecevic', 'Jefaturas');
    `;

    console.log('Inserting predefined users...');
    await client.query(insertUsers);

    console.log('Usuarios table initialized successfully.');

  } catch (err) {
    console.error('Error executing query:', err.stack);
  } finally {
    await client.end();
  }
}

runSQL();
