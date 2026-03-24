import React, { useState } from 'react';
import { CheckCircle2, Circle, Clock, BarChart3 } from 'lucide-react';
import { supabase } from '../supabaseClient';

export const getVigenciaStatus = (fechaLimite) => {
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

export default function TaskTable({ currentUser, allTasks, visibleTasks, fetchTasks }) {
    const [loadingIds, setLoadingIds] = useState(new Set());
    const [viewMode, setViewMode] = useState('Personal'); // 'Personal' or 'Global'
    const [statusFilter, setStatusFilter] = useState('Pendientes'); // 'Pendientes' or 'Ejecutados'

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

    const isJefatura = currentUser?.rol === 'Jefaturas' || currentUser?.email === 'dcarreon@cdb.com';

    let contentToRender;

    if (viewMode === 'Global' && isJefatura) {
        // --- GLOBAL SUMMARY VIEW ---
        
        // 1. Get tasks matching statusFilter
        const filteredGlobalTasks = (allTasks || []).filter(task => {
            if (task.asignadoA === currentUser?.nombre) return false; // Exclude tasks assigned to current user
            if (statusFilter === 'Pendientes') return !task.ejecutado;
            if (statusFilter === 'Ejecutados') return task.ejecutado;
            return true;
        });

        // 2. Group by asignadoA
        const grouped = filteredGlobalTasks.reduce((acc, task) => {
            const assignee = task.asignadoA || 'Sin Asignar';
            if (!acc[assignee]) acc[assignee] = [];
            acc[assignee].push(task);
            return acc;
        }, {});

        // 3. Render grouped tasks
        let globalGrandTotals = { vencido: 0, porVencer: 0, vigente: 0, ejecutado: 0 };
        
        const summaryNodes = Object.keys(grouped).sort().map(assignee => {
            const tasksUser = grouped[assignee];
            let userTotals = { vencido: 0, porVencer: 0, vigente: 0, ejecutado: 0 };

            const taskRows = tasksUser.map(task => {
                const vigenciaInfo = getVigenciaStatus(task.fechaLimite);
                
                if (task.ejecutado) {
                    userTotals.ejecutado++;
                } else {
                    if (vigenciaInfo.text === 'Vencido') userTotals.vencido++;
                    else if (vigenciaInfo.text === 'Por vencer') userTotals.porVencer++;
                    else userTotals.vigente++;
                }

                return (
                    <tr key={task.id} className={task.ejecutado ? 'row-ejecutado row-resumen' : 'row-resumen'} style={{ opacity: loadingIds.has(task.id) ? 0.5 : 1 }}>
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
                        <td className="col-tarea">{task.tarea}</td>
                        <td className="col-date">{task.fechaLimite}</td>
                        <td className="col-estado">
                            <span className="status-badge">{task.estado}</span>
                        </td>
                        <td className="col-creador">{task.creadorNombre}</td>
                    </tr>
                );
            });

            // Add to grand global totals
            globalGrandTotals.vencido += userTotals.vencido;
            globalGrandTotals.porVencer += userTotals.porVencer;
            globalGrandTotals.vigente += userTotals.vigente;
            globalGrandTotals.ejecutado += userTotals.ejecutado;

            return (
                <div key={assignee} className="user-summary-group">
                    <h4 className="user-summary-header">Tareas de {assignee} ({tasksUser.length})</h4>
                    <div className="table-responsive">
                        <table className="task-table summary-table">
                            <thead>
                                <tr>
                                    <th>Vigencia</th>
                                    <th>Tarea</th>
                                    <th>Fecha Límite</th>
                                    <th>Estado</th>
                                    <th>Creado por</th>
                                </tr>
                            </thead>
                            <tbody>
                                {taskRows}
                            </tbody>
                        </table>
                    </div>
                    <div className="user-summary-metrics">
                        <strong>Resumen del Usuario:</strong>
                        {statusFilter === 'Pendientes' ? (
                            <>
                                <span className="metric-badge status-vencido" style={{ backgroundColor: 'var(--status-vencido-bg)', color: 'var(--status-vencido)' }}>{userTotals.vencido} Vencidas</span>
                                <span className="metric-badge status-por-vencer" style={{ backgroundColor: 'var(--status-por-vencer-bg)', color: 'var(--status-por-vencer)' }}>{userTotals.porVencer} Por Vencer</span>
                                <span className="metric-badge status-vigente" style={{ backgroundColor: 'var(--status-vigente-bg)', color: 'var(--status-vigente)' }}>{userTotals.vigente} Vigentes</span>
                            </>
                        ) : (
                            <span className="metric-badge status-ejecutado" style={{ backgroundColor: 'var(--status-ejecutado)', color: 'white' }}>{userTotals.ejecutado} Finalizadas</span>
                        )}
                    </div>
                </div>
            );
        });

        contentToRender = (
            <div className="global-summary-container">
                {Object.keys(grouped).length === 0 ? (
                    <div className="empty-state">No hay tareas empresariales de tipo {statusFilter.toLowerCase()} en el sistema.</div>
                ) : (
                    <>
                        {summaryNodes}
                        <div className="grand-total-summary">
                            <h3>Resumen General de la Empresa ({statusFilter})</h3>
                            <div className="grand-metrics">
                                {statusFilter === 'Pendientes' ? (
                                    <>
                                        <div className="metric-box box-vencido">
                                            <span className="metric-number">{globalGrandTotals.vencido}</span>
                                            <span className="metric-label">Vencidas</span>
                                        </div>
                                        <div className="metric-box box-por-vencer">
                                            <span className="metric-number">{globalGrandTotals.porVencer}</span>
                                            <span className="metric-label">Por Vencer</span>
                                        </div>
                                        <div className="metric-box box-vigente">
                                            <span className="metric-number">{globalGrandTotals.vigente}</span>
                                            <span className="metric-label">Vigentes</span>
                                        </div>
                                        <div className="metric-box box-total">
                                            <span className="metric-number">{globalGrandTotals.vencido + globalGrandTotals.porVencer + globalGrandTotals.vigente}</span>
                                            <span className="metric-label">Total Pendientes</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="metric-box box-total" style={{ backgroundColor: 'var(--status-ejecutado)', borderColor: 'var(--status-ejecutado)' }}>
                                        <span className="metric-number">{globalGrandTotals.ejecutado}</span>
                                        <span className="metric-label">Total Ejecutadas</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        );

    } else {
        // --- NORMAL VIEW ---
        let baseTasks = visibleTasks || [];
        if (isJefatura) {
            baseTasks = baseTasks.filter(task => task.asignadoA === currentUser?.nombre);
        }

        const filteredTasks = baseTasks.filter(task => {
            if (statusFilter === 'Pendientes') return !task.ejecutado;
            if (statusFilter === 'Ejecutados') return task.ejecutado;
            return true;
        });

        contentToRender = (
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
                                <td colSpan="7" className="empty-state">No hay tareas de tipo {statusFilter.toLowerCase()} visibles.</td>
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
        );
    }

    return (
        <div className="card table-card">
            <div className="table-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '1rem', paddingBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <h3>Lista de Tareas</h3>
                    {isJefatura && (
                        <div className="view-mode-toggles" style={{ display: 'flex', gap: '4px', background: 'var(--bg-gray)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
                            <button
                                className={`btn ${viewMode === 'Personal' ? 'btn-primary' : 'btn-ghost'}`}
                                onClick={() => { setViewMode('Personal'); setStatusFilter('Pendientes'); }}
                                style={{ padding: '0.4rem 1rem', display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: viewMode === 'Personal' ? 'var(--primary-color)' : 'transparent', color: viewMode === 'Personal' ? 'white' : 'var(--text-secondary)', border: 'none' }}
                            >
                                <CheckCircle2 size={16} /> Mis Tareas
                            </button>
                            <button
                                className={`btn ${viewMode === 'Global' ? 'btn-primary' : 'btn-ghost'}`}
                                onClick={() => { setViewMode('Global'); setStatusFilter('Pendientes'); }}
                                style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.4rem 1rem', backgroundColor: viewMode === 'Global' ? 'var(--primary-color)' : 'transparent', color: viewMode === 'Global' ? 'white' : 'var(--text-secondary)', border: 'none' }}
                            >
                                <BarChart3 size={16} /> Resumen Global
                            </button>
                        </div>
                    )}
                </div>

                <div className="table-filters" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                            className={`btn ${statusFilter === 'Pendientes' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setStatusFilter('Pendientes')}
                        >
                            Pendientes
                        </button>
                        <button 
                            className={`btn ${statusFilter === 'Ejecutados' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setStatusFilter('Ejecutados')}
                        >
                            Ejecutados
                        </button>
                    </div>

                    {viewMode === 'Personal' && (
                        <span className="task-count">{((isJefatura ? (visibleTasks || []).filter(task => task.asignadoA === currentUser?.nombre) : (visibleTasks || []))).filter(task => {
                            if (statusFilter === 'Pendientes') return !task.ejecutado;
                            if (statusFilter === 'Ejecutados') return task.ejecutado;
                            return true;
                        }).length} visible(s)</span>
                    )}
                </div>
            </div>

            {contentToRender}
        </div>
    );
}
