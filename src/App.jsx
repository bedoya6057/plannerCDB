import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import TaskForm from './components/TaskForm';
import TaskTable from './components/TaskTable';
import TaskFooterStats from './components/TaskFooterStats';
import NotesSection from './components/NotesSection';
import Login from './components/Login';
import { supabase } from './supabaseClient';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    if (currentUser) {
      fetchTasks();
      fetchNotes();
    }
  }, [currentUser]);

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tareas')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
    } else {
      const formattedTasks = data.map(t => ({
        id: t.id,
        tarea: t.tarea,
        fechaLimite: t.fecha_limite,
        estado: t.estado,
        creadorRole: t.creador_role,
        asignadoA: t.asignado_a,
        fechaReprogramacion: t.fecha_reprogramacion || '',
        ejecutado: t.ejecutado
      }));
      setTasks(formattedTasks);
    }
  };

  const fetchNotes = async () => {
    const { data, error } = await supabase
      .from('notas')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notes:', error);
    } else {
      const formattedNotes = data.map(n => ({
        id: n.id,
        text: n.texto,
        timestamp: new Date(n.created_at).toLocaleString()
      }));
      setNotes(formattedNotes);
    }
  };

  if (!currentUser) {
    return <Login onLogin={setCurrentUser} />;
  }

  const visibleTasks = tasks.filter(task => {
    if (currentUser.rol === 'Jefaturas') {
      return task.creadorRole === 'Jefaturas' || task.asignadoA === 'Jefaturas';
    } else {
      return task.asignadoA === 'Administrativos' || task.asignadoA === currentUser.nombre;
    }
  });

  return (
    <>
      <Navbar user={currentUser} onLogout={() => setCurrentUser(null)} />

      <main className="container main-content">
        <div className="section-header">
          <h2>Mi Planner - {currentUser.rol}</h2>
          <p className="subtitle">Bienvenido(a), {currentUser.nombre}. Gestiona tus tareas y fechas límite en tiempo real.</p>
        </div>

        <div className="planner-grid">
          <div className="form-column">
            <TaskForm userRole={currentUser.rol} fetchTasks={fetchTasks} />
          </div>
          <div className="table-column">
            <TaskTable visibleTasks={visibleTasks} fetchTasks={fetchTasks} />
          </div>
        </div>

        <div className="notes-container">
          <NotesSection notes={notes} fetchNotes={fetchNotes} />
        </div>
      </main>

      <TaskFooterStats tasks={visibleTasks} />
    </>
  )
}

export default App;
