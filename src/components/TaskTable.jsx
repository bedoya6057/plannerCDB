import React, { useState } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function TaskTable({ visibleTasks, fetchTasks }) {
    const [loadingIds, setLoadingIds] = useState(new Set());

    const toggleEjecutado = async (id, currentStatus) => {
        setLoadingIds(prev => new Set(prev).add(id));

        const { error } = await supabase
            .from('tareas')
            .update({ ejecutado: !currentStatus })
            .eq('id', id);

        setLoadingIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
        });

        if (error) {
            console.error('Error toggling ejecutado:', error);
            alert('Error de conexión al actualizar la tarea.');
        } else {
            fetchTasks();
        }
    };

    const updateReprogramacion = async (id, newDate) => {
        setLoadingIds(prev => new Set(prev).add(id));

        const { error } = await supabase
            .from('tareas')
            .update({ fecha_reprogramacion: newDate })
            .eq('id', id);

        setLoadingIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
        });

        if (error) {
            console.error('Error updating reprogramacion:', error);
            alert('Error de conexión al reprogramar la tarea.');
        } else {
            fetchTasks();
        }
    };

    return (
        <div className="card table-card">
            <div className="table-header">
                <h3>Lista de Tareas</h3>
                <span className="task-count">{visibleTasks.length} visible(s)</span>
            </div>

            <div className="table-responsive">
                <table className="task-table">
                    <thead>
                        <tr>
                            <th>Ejecutado</th>
                            <th>Asignado A</th>
                            <th>Tarea</th>
                            <th>Fecha Límite</th>
                            <th>Estado</th>
                            <th>Reprogramación</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visibleTasks.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="empty-state">No hay tareas visibles para tu perfil.</td>
                            </tr>
                        ) : (
                            visibleTasks.map(task => {
                                const isLoading = loadingIds.has(task.id);
                                return (
                                    <tr key={task.id} className={task.ejecutado ? 'row-ejecutado' : ''} style={{ opacity: isLoading ? 0.5 : 1 }}>
                                        <td className="col-checkbox">
                                            <button
                                                className={`check-btn ${task.ejecutado ? 'checked' : ''}`}
                                                onClick={() => toggleEjecutado(task.id, task.ejecutado)}
                                                disabled={isLoading}
                                            >
                                                {task.ejecutado ? <CheckCircle2 className="icon-success" /> : <Circle className="icon-muted" />}
                                            </button>
                                        </td>
                                        <td className="col-asignado">
                                            <span className="status-badge">{task.asignadoA}</span>
                                        </td>
                                        <td className="col-tarea">{task.tarea}</td>
                                        <td className="col-date">{task.fechaLimite}</td>
                                        <td className="col-estado">
                                            <span className="status-badge">{task.estado}</span>
                                        </td>
                                        <td className="col-reprog">
                                            <input
                                                type="date"
                                                value={task.fechaReprogramacion}
                                                onChange={(e) => updateReprogramacion(task.id, e.target.value)}
                                                disabled={task.ejecutado || isLoading}
                                            />
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
