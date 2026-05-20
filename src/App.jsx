import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import TaskForm from './components/TaskForm';
import TaskTable from './components/TaskTable';
import TaskFooterStats from './components/TaskFooterStats';
import NotesSection from './components/NotesSection';
import Login from './components/Login';
import ClientDashboard from './components/ClientDashboard';
import AdminPanel from './components/AdminPanel';
import { supabase } from './supabaseClient';

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('cdb_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [adminView, setAdminView] = useState('planner'); // 'planner' or 'admin'

  useEffect(() => {
    if (currentUser) {
      if (currentUser.rol !== 'Cliente') {
        fetchTasks();
        fetchNotes();
      }
    }
  }, [currentUser]);

  const handleLogin = (user) => {
    localStorage.setItem('cdb_user', JSON.stringify(user));
    setCurrentUser(user);
    setAdminView('planner');
  };

  const handleLogout = () => {
    localStorage.removeItem('cdb_user');
    setCurrentUser(null);
  };

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
        creadorNombre: t.creador_nombre,
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
    return <Login onLogin={handleLogin} />;
  }

  // Si es un cliente, renderizamos ÚNICAMENTE el Dashboard de cliente
  if (currentUser.rol === 'Cliente') {
    return (
      <>
        <Navbar user={currentUser} onLogout={handleLogout} />
        <ClientDashboard currentUser={currentUser} />
      </>
    );
  }

  const visibleTasks = tasks.filter(task => {
    // Si la tarea está asignada específicamente a mí, siempre la veo
    if (task.asignadoA === currentUser.nombre) return true;

    // Si yo creé la tarea (para mí mismo o para otros), la veo
    if (task.creadorNombre === currentUser.nombre) return true;

    return false;
  });

  return (
    <>
      <Navbar 
        user={currentUser} 
        onLogout={handleLogout} 
        adminView={adminView} 
        setAdminView={setAdminView} 
      />

      <main className="container main-content">
        {adminView === 'admin' && currentUser.rol === 'Jefaturas' ? (
          <AdminPanel />
        ) : (
          <>
            <div className="section-header">
              <h2>Mi Planner - {currentUser.rol}</h2>
              <p className="subtitle">Bienvenido(a), {currentUser.nombre}. Gestiona tus tareas y fechas límite en tiempo real.</p>
            </div>

            <div className="planner-grid">
              <div className="form-column">
                <TaskForm currentUser={currentUser} fetchTasks={fetchTasks} />
              </div>
              <div className="table-column">
                <TaskTable 
                  currentUser={currentUser} 
                  allTasks={tasks} 
                  visibleTasks={visibleTasks} 
                  fetchTasks={fetchTasks} 
                />
              </div>
            </div>

            <div className="notes-container">
              <NotesSection notes={notes} fetchNotes={fetchNotes} />
            </div>
          </>
        )}
      </main>

      {adminView !== 'admin' && <TaskFooterStats tasks={visibleTasks} />}
    </>
  )
}

export default App;
