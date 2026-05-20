import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, UserRound, LogOut, Settings, Calendar, Shield } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function Navbar({ user, onLogout, adminView, setAdminView }) {
    const [clientName, setClientName] = useState('');

    useEffect(() => {
        if (user && user.rol === 'Cliente' && user.cliente_id) {
            supabase
                .from('clientes')
                .select('nombre')
                .eq('id', user.cliente_id)
                .single()
                .then(({ data }) => {
                    if (data) setClientName(data.nombre);
                });
        }
    }, [user]);

    return (
        <nav className="navbar">
            <div className="container flex-between nav-content">
                <div className="brand flex-center">
                    <LayoutDashboard className="brand-icon" />
                    <span className="brand-text">CDB Planner</span>
                </div>

                {/* View toggles for administrators (Jefaturas) */}
                {user.rol === 'Jefaturas' && setAdminView && (
                    <div className="view-selector-tabs" style={{ display: 'flex', gap: '4px', background: 'var(--bg-gray)', padding: '4px', borderRadius: 'var(--radius-full)' }}>
                        <button
                            onClick={() => setAdminView('planner')}
                            className={`role-btn ${adminView === 'planner' ? 'active' : ''}`}
                            style={{ 
                                padding: '0.35rem 1rem', 
                                borderRadius: 'var(--radius-full)', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '4px',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                backgroundColor: adminView === 'planner' ? 'white' : 'transparent',
                                color: adminView === 'planner' ? 'var(--primary)' : 'var(--text-secondary)',
                                boxShadow: adminView === 'planner' ? 'var(--shadow-sm)' : 'none'
                            }}
                        >
                            <Calendar size={14} /> Planificador
                        </button>
                        <button
                            onClick={() => setAdminView('admin')}
                            className={`role-btn ${adminView === 'admin' ? 'active' : ''}`}
                            style={{ 
                                padding: '0.35rem 1rem', 
                                borderRadius: 'var(--radius-full)', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '4px',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                backgroundColor: adminView === 'admin' ? 'white' : 'transparent',
                                color: adminView === 'admin' ? 'var(--primary)' : 'var(--text-secondary)',
                                boxShadow: adminView === 'admin' ? 'var(--shadow-sm)' : 'none'
                            }}
                        >
                            <Settings size={14} /> Administración
                        </button>
                    </div>
                )}

                <div className="role-selector flex-center" style={{ gap: '1rem', padding: '0.25rem 0.75rem' }}>
                    <div className="flex-center" style={{ gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        {user.rol === 'Jefaturas' ? (
                            <Shield size={18} style={{ color: 'var(--status-vigente)' }} />
                        ) : user.rol === 'Cliente' ? (
                            <Building size={18} style={{ color: 'var(--primary)' }} />
                        ) : (
                            <Users size={18} />
                        )}
                        <span style={{ fontWeight: 600 }}>{user.nombre}</span>
                        <span 
                            className="badge" 
                            style={{ 
                                transform: 'scale(0.85)',
                                padding: '0.15rem 0.5rem',
                                borderRadius: 'var(--radius-full)',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                backgroundColor: user.rol === 'Jefaturas' ? 'var(--status-vigente-bg)' : user.rol === 'Cliente' ? 'var(--status-vencido-bg)' : 'var(--status-por-vencer-bg)',
                                color: user.rol === 'Jefaturas' ? 'var(--status-vigente)' : user.rol === 'Cliente' ? 'var(--status-vencido)' : 'var(--status-por-vencer)'
                            }}
                        >
                            {user.rol === 'Cliente' && clientName ? `Cliente: ${clientName}` : user.rol}
                        </span>
                    </div>

                    <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--border-color)' }}></div>

                    <button
                        onClick={onLogout}
                        className="btn flex-center"
                        style={{ color: 'var(--status-vencido)', padding: '0.25rem 0.5rem' }}
                        title="Cerrar Sesión"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </nav>
    );
}
