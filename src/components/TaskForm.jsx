import React, { useState, useEffect } from 'react';
import { PlusCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function TaskForm({ currentUser, fetchTasks }) {
    const [tarea, setTarea] = useState('');
    const [fechaLimite, setFechaLimite] = useState('');
    const [asignadoA, setAsignadoA] = useState(currentUser.nombre);
    const [loading, setLoading] = useState(false);
    const [assignableUsers, setAssignableUsers] = useState([]);
    const [adminConnections, setAdminConnections] = useState([]);

    useEffect(() => {
        setAsignadoA(currentUser.nombre);
        fetchUsersData();
    }, [currentUser]);

    const fetchUsersData = async () => {
        const { data, error } = await supabase
            .from('usuarios')
            .select('nombre, rol, ultima_conexion')
            .order('rol');
        
        if (error) {
            console.error('Error fetching users:', error);
        } else {
            setAssignableUsers(data);
            setAdminConnections(data.filter(u => u.rol === 'Administrativos'));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!tarea || !fechaLimite) return;
        setLoading(true);

        const { error } = await supabase
            .from('tareas')
            .insert([
                {
                    tarea,
                    fecha_limite: fechaLimite,
                    estado: 'Pendiente',
                    creador_role: currentUser.rol,
                    creador_nombre: currentUser.nombre,
                    asignado_a: asignadoA,
                    ejecutado: false
                }
            ]);

        setLoading(false);

        if (error) {
            console.error('Error inserting task:', error);
            alert('Hubo un error al guardar la tarea.');
            return;
        }

        setTarea('');
        setFechaLimite('');
        setAsignadoA(currentUser.nombre);
        fetchTasks();
    };

    return (
        <div className="card form-card">
            <h3>Nueva Tarea</h3>
            <form onSubmit={handleSubmit} className="task-form">
                <div className="form-group">
                    <label>Descripción de la Tarea</label>
                    <textarea
                        value={tarea}
                        onChange={(e) => setTarea(e.target.value)}
                        placeholder="Ej. Revisar reporte mensual..."
                        required
                        rows={3}
                        disabled={loading}
                    />
                </div>

                {currentUser.rol === 'Jefaturas' && (
                    <div className="form-group">
                        <label>Asignar a</label>
                        <select value={asignadoA} onChange={(e) => setAsignadoA(e.target.value)} disabled={loading}>
                            <option value="Jefaturas">Jefaturas (General)</option>
                            <option value="Administrativos">Administrativos (General)</option>
                            {assignableUsers.map(user => (
                                <option key={user.nombre} value={user.nombre}>
                                    {user.nombre} ({user.rol})
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="form-group">
                    <label>Fecha Límite</label>
                    <input
                        type="date"
                        value={fechaLimite}
                        onChange={(e) => setFechaLimite(e.target.value)}
                        required
                        disabled={loading}
                    />
                </div>

                <div className="form-group connection-info-group">
                    <label>Última Conexión (Administrativos)</label>
                    <div className="connection-list">
                        {adminConnections.map(user => (
                            <div key={user.nombre} className="connection-item">
                                <span className="conn-name">{user.nombre}</span>
                                <span className="conn-time">
                                    {user.ultima_conexion 
                                        ? new Date(user.ultima_conexion).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) 
                                        : 'Nunca'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <button type="submit" className="btn btn-primary flex-center" disabled={loading}>
                    <PlusCircle size={20} className="icon-mr" />
                    {loading ? 'Guardando...' : 'Agregar Tarea'}
                </button>
            </form>
        </div>
    );
}
