import React from 'react';
import { LayoutDashboard, Users, UserRound, LogOut } from 'lucide-react';

export default function Navbar({ user, onLogout }) {
    return (
        <nav className="navbar">
            <div className="container flex-between nav-content">
                <div className="brand flex-center">
                    <LayoutDashboard className="brand-icon" />
                    <span className="brand-text">CDB Planner</span>
                </div>

                <div className="role-selector flex-center" style={{ gap: '1rem', padding: '0.25rem 0.5rem' }}>
                    <div className="flex-center" style={{ gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        {user.rol === 'Jefaturas' ? <UserRound size={18} /> : <Users size={18} />}
                        <span style={{ fontWeight: 600 }}>{user.nombre}</span>
                        <span className="badge badge-vigente" style={{ transform: 'scale(0.8)' }}>{user.rol}</span>
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
