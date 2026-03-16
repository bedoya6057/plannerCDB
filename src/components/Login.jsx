import React, { useState } from 'react';
import { LayoutDashboard, LogIn } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function Login({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { data, error: dbError } = await supabase
                .from('usuarios')
                .select('*')
                .ilike('email', email.trim())
                .eq('password', password)
                .single();

            if (dbError || !data) {
                throw new Error('Credenciales incorrectas');
            }

            // Update last connection time
            await supabase
                .from('usuarios')
                .update({ ultima_conexion: new Date().toISOString() })
                .eq('id', data.id);

            onLogin(data);
        } catch (err) {
            setError('Correo o contraseña incorrectos. Por favor, intenta de nuevo.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card card">
                <div className="login-header flex-center">
                    <LayoutDashboard className="brand-icon" size={32} />
                    <h2>CDB Planner</h2>
                </div>

                <p className="login-subtitle">Inicia sesión en tu cuenta</p>

                <form onSubmit={handleLogin} className="login-form">
                    {error && <div className="login-error-alert">{error}</div>}

                    <div className="form-group">
                        <label>Correo Electrónico</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="ejemplo@cdb.com"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label>Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            disabled={loading}
                        />
                    </div>

                    <button type="submit" className="btn btn-primary flex-center login-btn" disabled={loading}>
                        <LogIn size={20} className="icon-mr" />
                        {loading ? 'Verificando...' : 'Ingresar'}
                    </button>
                </form>
            </div>
        </div>
    );
}
