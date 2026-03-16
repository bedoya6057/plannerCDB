import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mvqenckylaxznlrtqqjm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12cWVuY2t5bGF4em5scnRxcWptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4MDQ2MTcsImV4cCI6MjA4NzM4MDYxN30.AArHEdsgbjb3QNaLJnwk-mhxSyRVsCIq7qjYafbwums';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyData() {
    console.log('--- Verificando conexión a Supabase ---');

    const { data: tareas, error: errorTareas } = await supabase
        .from('tareas')
        .select('*');

    if (errorTareas) {
        console.error('Error al obtener tareas:', errorTareas);
    } else {
        console.log('\n✅ TAREAS EN BASE DE DATOS:');
        console.log(`Total de tareas persistidas: ${tareas.length}`);
        tareas.forEach(t => console.log(`- [${t.estado}] ${t.tarea} (Asignado a: ${t.asignado_a}) | Ejecutado: ${t.ejecutado}`));
    }

    const { data: notas, error: errorNotas } = await supabase
        .from('notas')
        .select('*');

    if (errorNotas) {
        console.error('Error al obtener notas:', errorNotas);
    } else {
        console.log('\n✅ NOTAS EN BASE DE DATOS:');
        console.log(`Total de notas persistidas: ${notas.length}`);
        notas.forEach(n => console.log(`- "${n.texto}" (Creada: ${n.created_at})`));
    }
}

verifyData();
