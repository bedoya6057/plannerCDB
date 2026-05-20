import React, { useState, useEffect } from 'react';
import { Briefcase, Activity, CheckCircle, Clock, Database } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function ClientDashboard({ currentUser }) {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [clientName, setClientName] = useState('');

    useEffect(() => {
        if (currentUser && currentUser.cliente_id) {
            fetchClientAndProjects();
        }
    }, [currentUser]);

    const fetchClientAndProjects = async () => {
        setLoading(true);
        try {
            // 1. Get client name
            const { data: clientData, error: clientError } = await supabase
                .from('clientes')
                .select('nombre')
                .eq('id', currentUser.cliente_id)
                .single();

            if (clientError) throw clientError;
            if (clientData) setClientName(clientData.nombre);

            // 2. Get client projects
            const { data: projectsData, error: projectsError } = await supabase
                .from('proyectos')
                .select('*')
                .eq('cliente_id', currentUser.cliente_id)
                .order('created_at', { ascending: false });

            if (projectsError) throw projectsError;
            setProjects(projectsData || []);

        } catch (error) {
            console.error('Error fetching client dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate metrics
    const totalProjects = projects.length;
    const inProcessProjects = projects.filter(p => p.estado === 'En proceso').length;
    const completedProjects = projects.filter(p => p.estado === 'Completado').length;
    const plannedProjects = projects.filter(p => p.estado === 'Planeado').length;

    if (loading) {
        return (
            <div className="client-dashboard-loading flex-center" style={{ minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
                <Activity className="animate-spin text-primary" size={40} style={{ color: 'var(--primary)', animation: 'spin 2s linear infinite' }} />
                <p style={{ color: 'var(--text-secondary)' }}>Cargando dashboard de proyectos...</p>
                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <main className="container main-content">
            <div className="section-header">
                <h2>Dashboard de Proyectos - {clientName}</h2>
                <p className="subtitle">Bienvenido(a), {currentUser.nombre}. Visualiza el estado en tiempo real de tus proyectos corporativos.</p>
            </div>

            {/* Metrics cards */}
            <div className="client-metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <div className="metric-card shadow-sm" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: 'white', padding: '1.5rem', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                        <Briefcase size={28} />
                    </div>
                    <div>
                        <div style={{ fontSize: '1.875rem', fontWeight: 700, lineHeight: 1 }}>{totalProjects}</div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.7, fontWeight: 500, marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Proyectos Totales</div>
                    </div>
                </div>

                <div className="metric-card shadow-sm" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ backgroundColor: 'var(--status-por-vencer-bg)', color: 'var(--status-por-vencer)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                        <Activity size={28} />
                    </div>
                    <div>
                        <div style={{ fontSize: '1.875rem', fontWeight: 700, lineHeight: 1, color: 'var(--text-primary)' }}>{inProcessProjects}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>En Proceso</div>
                    </div>
                </div>

                <div className="metric-card shadow-sm" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ backgroundColor: 'var(--status-vigente-bg)', color: 'var(--status-vigente)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                        <CheckCircle size={28} />
                    </div>
                    <div>
                        <div style={{ fontSize: '1.875rem', fontWeight: 700, lineHeight: 1, color: 'var(--text-primary)' }}>{completedProjects}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Completados</div>
                    </div>
                </div>

                <div className="metric-card shadow-sm" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ backgroundColor: 'var(--secondary)', color: 'var(--primary)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                        <Clock size={28} />
                    </div>
                    <div>
                        <div style={{ fontSize: '1.875rem', fontWeight: 700, lineHeight: 1, color: 'var(--text-primary)' }}>{plannedProjects}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Planeados</div>
                    </div>
                </div>
            </div>

            {/* Projects Section */}
            <div className="card" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--secondary)', paddingBottom: '0.75rem' }}>
                    <Database style={{ color: 'var(--primary)' }} />
                    <h3 style={{ margin: 0, border: 'none', padding: 0 }}>Mis Proyectos Corporativos</h3>
                </div>

                {projects.length === 0 ? (
                    <div className="empty-state" style={{ padding: '3rem 1rem' }}>
                        No hay proyectos asociados a tu empresa actualmente.
                    </div>
                ) : (
                    <div className="projects-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                        {projects.map(project => {
                            let badgeStyle = { backgroundColor: 'var(--bg-gray)', color: 'var(--text-secondary)' };
                            if (project.estado === 'Completado') {
                                badgeStyle = { backgroundColor: 'var(--status-vigente-bg)', color: 'var(--status-vigente)' };
                            } else if (project.estado === 'En proceso') {
                                badgeStyle = { backgroundColor: 'var(--status-por-vencer-bg)', color: 'var(--status-por-vencer)' };
                            } else if (project.estado === 'Planeado') {
                                badgeStyle = { backgroundColor: 'var(--secondary)', color: 'var(--primary)' };
                            }

                            return (
                                <div 
                                    key={project.id} 
                                    className="project-card" 
                                    style={{ 
                                        border: '1px solid var(--border-color)', 
                                        borderRadius: 'var(--radius-lg)', 
                                        padding: '1.5rem', 
                                        backgroundColor: 'var(--bg-card)',
                                        boxShadow: 'var(--shadow-sm)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', gap: '0.5rem' }}>
                                            <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{project.nombre}</h4>
                                            <span 
                                                className="status-badge" 
                                                style={{ 
                                                    ...badgeStyle,
                                                    padding: '0.25rem 0.6rem',
                                                    fontSize: '0.7rem',
                                                    borderRadius: 'var(--radius-full)',
                                                    fontWeight: 700,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px',
                                                    flexShrink: 0
                                                }}
                                            >
                                                {project.estado}
                                            </span>
                                        </div>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem', minHeight: '60px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                                            {project.descripcion || 'Sin descripción detallada.'}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                        <span>ID: {project.id.substring(0, 8)}...</span>
                                        <span>Registrado: {new Date(project.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            
            {/* Custom styles hover */}
            <style>{`
                .project-card:hover {
                    transform: translateY(-4px);
                    box-shadow: var(--shadow-md) !important;
                    border-color: var(--primary) !important;
                }
            `}</style>
        </main>
    );
}
