import React, { useState } from 'react';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function TaskTable({ visibleTasks, fetchTasks }) {
    const [loadingIds, setLoadingIds] = useState(new Set());
    const [filterState, setFilterState] = useState('Pendientes'); // 'Pendientes' or 'Ejecutados'

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

    const getVigenciaStatus = (fechaLimite) => {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0); // Reset time to midnight for accurate day comparison
        
        // Parse the YYYY-MM-DD string to a Date object safely using local time
        const [year, month, day] = fechaLimite.split('-');
        const limite = new Date(year, month - 1, day);
        
        const diffTime = limite.getTime() - hoy.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return { text: 'Vencido', className: 'status-vencido' };
        } else if (diffDays <= 1) { // Today (0) or Tomorrow (1)
            return { text: 'Por vencer', className: 'status-por-vencer' };
        } else {
            return { text: 'Vigente', className: 'status-vigente' };
        }
    };

    const filteredTasks = visibleTasks.filter(task => {
        if (filterState === 'Pendientes') return !task.ejecutado;
        if (filterState === 'Ejecutados') return task.ejecutado;
        return true;
    });

    return (
        <div className="card table-card">
            <div className="table-header">
                <h3>Lista de Tareas</h3>
                <div className="table-filters" style={{ display: 'flex', gap: '8px' }}>
                    <button 
                        className={`btn ${filterState === 'Pendientes' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setFilterState('Pendientes')}
                    >
                        Pendientes
                    </button>
                    <button 
                        className={`btn ${filterState === 'Ejecutados' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setFilterState('Ejecutados')}
                    >
                        Ejecutados
                    </button>
                </div>
                <span className="task-count">{filteredTasks.length} visible(s)</span>
            </div>

            <div className="table-responsive">
                <table className="task-table">
                    <thead>
                        <tr>
                            <th>Vigencia</th>
                            <th>Asignado A</th>
                            <th>Tarea</th>
                            <th>Fecha Límite</th>
                            <th>Estado</th>
                            <th>Reprogramación</th>
                            <th>Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTasks.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="empty-state">No hay tareas de tipo {filterState.toLowerCase()} visibles.</td>
                            </tr>
                        ) : (
                            filteredTasks.map(task => {
                                const isLoading = loadingIds.has(task.id);
                                const vigenciaInfo = getVigenciaStatus(task.fechaLimite);
                                
                                return (
                                    <tr key={task.id} className={task.ejecutado ? 'row-ejecutado' : ''} style={{ opacity: isLoading ? 0.5 : 1 }}>
                                        <td className="col-vigencia">
                                            {task.ejecutado ? (
                                                <span className="status-badge" style={{ backgroundColor: 'var(--status-ejecutado)', color: 'white' }}>Finalizado</span>
                                            ) : (
                                                <span className={`status-badge ${vigenciaInfo.className}`} style={{ backgroundColor: `var(--${vigenciaInfo.className}-bg)`, color: `var(--${vigenciaInfo.className})` }}>
                                                    {vigenciaInfo.text === 'Vencido' ? <Clock size={12} className="icon-mr" /> : null}
                                                    {vigenciaInfo.text}
                                                </span>
                                            )}
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
                                        <td className="col-accion">
                                            <button
                                                className={`check-btn ${task.ejecutado ? 'checked' : ''}`}
                                                onClick={() => toggleEjecutado(task.id, task.ejecutado)}
                                                disabled={isLoading}
                                                title={task.ejecutado ? "Marcar como pendiente" : "Marcar como ejecutada"}
                                            >
                                                {task.ejecutado ? <CheckCircle2 className="icon-success" /> : <Circle className="icon-muted" />}
                                            </button>
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
