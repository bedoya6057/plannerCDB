import React, { useState, useEffect } from 'react';
import { PlusCircle, Users, Briefcase, UserPlus, Building, Trash2 } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function AdminPanel() {
    const [activeTab, setActiveTab] = useState('clientes'); // 'clientes', 'proyectos', 'usuarios'
    
    // Data lists
    const [clients, setClients] = useState([]);
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form inputs: Clients
    const [newClientName, setNewClientName] = useState('');
    
    // Form inputs: Projects
    const [newProjName, setNewProjName] = useState('');
    const [newProjDesc, setNewProjDesc] = useState('');
    const [newProjState, setNewProjState] = useState('En proceso');
    const [newProjClientId, setNewProjClientId] = useState('');

    // Form inputs: Users
    const [newUserNombre, setNewUserNombre] = useState('');
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserRole, setNewUserRole] = useState('Administrativos');
    const [newUserClientId, setNewUserClientId] = useState('');

    // Form Loading statuses
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Clients
            const { data: clientsData, error: ce } = await supabase
                .from('clientes')
                .select('*')
                .order('nombre');
            if (ce) throw ce;
            setClients(clientsData || []);
            if (clientsData && clientsData.length > 0) {
                setNewProjClientId(clientsData[0].id);
                setNewUserClientId(clientsData[0].id);
            }

            // 2. Fetch Projects
            const { data: projectsData, error: pe } = await supabase
                .from('proyectos')
                .select('proyectos.*, clientes.nombre as cliente_nombre')
                .order('created_at', { ascending: false });
            
            // Wait, supabase join works if there is foreign key defined
            // Let's do projects with client info
            const { data: pData, error: pError } = await supabase
                .from('proyectos')
                .select(`
                    id,
                    nombre,
                    descripcion,
                    estado,
                    created_at,
                    cliente_id
                `)
                .order('created_at', { ascending: false });
            
            if (pError) throw pError;
            setProjects(pData || []);

            // 3. Fetch Users
            const { data: usersData, error: ue } = await supabase
                .from('usuarios')
                .select('*')
                .order('created_at', { ascending: false });
            if (ue) throw ue;
            setUsers(usersData || []);

        } catch (error) {
            console.error('Error fetching admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Add Client Handler
    const handleAddClient = async (e) => {
        e.preventDefault();
        if (!newClientName.trim()) return;
        setActionLoading(true);

        try {
            const { error } = await supabase
                .from('clientes')
                .insert([{ nombre: newClientName.trim() }]);

            if (error) {
                if (error.code === '23505') {
                    alert('Este cliente ya se encuentra registrado.');
                } else {
                    throw error;
                }
            } else {
                setNewClientName('');
                await fetchAllData();
            }
        } catch (error) {
            console.error('Error adding client:', error);
            alert('Error al registrar el cliente.');
        } finally {
            setActionLoading(false);
        }
    };

    // Add Project Handler
    const handleAddProject = async (e) => {
        e.preventDefault();
        if (!newProjName.trim() || !newProjClientId) return;
        setActionLoading(true);

        try {
            const { error } = await supabase
                .from('proyectos')
                .insert([{
                    nombre: newProjName.trim(),
                    descripcion: newProjDesc.trim(),
                    estado: newProjState,
                    cliente_id: newProjClientId
                }]);

            if (error) throw error;

            setNewProjName('');
            setNewProjDesc('');
            setNewProjState('En proceso');
            await fetchAllData();
        } catch (error) {
            console.error('Error adding project:', error);
            alert('Error al registrar el proyecto.');
        } finally {
            setActionLoading(false);
        }
    };

    // Add User Handler
    const handleAddUser = async (e) => {
        e.preventDefault();
        if (!newUserNombre.trim() || !newUserEmail.trim() || !newUserPassword.trim()) return;
        setActionLoading(true);

        try {
            const userPayload = {
                nombre: newUserNombre.trim(),
                email: newUserEmail.trim().toLowerCase(),
                password: newUserPassword,
                rol: newUserRole,
                cliente_id: newUserRole === 'Cliente' ? newUserClientId : null
            };

            const { error } = await supabase
                .from('usuarios')
                .insert([userPayload]);

            if (error) {
                if (error.code === '23505') {
                    alert('El correo electrónico ya está en uso.');
                } else {
                    throw error;
                }
            } else {
                setNewUserNombre('');
                setNewUserEmail('');
                setNewUserPassword('');
                setNewUserRole('Administrativos');
                await fetchAllData();
            }
        } catch (error) {
            console.error('Error adding user:', error);
            alert('Error al registrar el usuario.');
        } finally {
            setActionLoading(false);
        }
    };

    // Delete handlers
    const handleDeleteClient = async (id) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este cliente? Esto también eliminará todos los proyectos y usuarios vinculados a él.')) return;
        try {
            const { error } = await supabase.from('clientes').delete().eq('id', id);
            if (error) throw error;
            await fetchAllData();
        } catch (error) {
            console.error('Error deleting client:', error);
            alert('Error al eliminar el cliente.');
        }
    };

    const handleDeleteProject = async (id) => {
        if (!confirm('¿Estás seguro de eliminar este proyecto?')) return;
        try {
            const { error } = await supabase.from('proyectos').delete().eq('id', id);
            if (error) throw error;
            await fetchAllData();
        } catch (error) {
            console.error('Error deleting project:', error);
            alert('Error al eliminar el proyecto.');
        }
    };

    const handleDeleteUser = async (id, isCurrentUser) => {
        if (isCurrentUser) {
            alert('No puedes eliminar tu propio usuario.');
            return;
        }
        if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
        try {
            const { error } = await supabase.from('usuarios').delete().eq('id', id);
            if (error) throw error;
            await fetchAllData();
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Error al eliminar el usuario.');
        }
    };

    const getClientName = (id) => {
        const client = clients.find(c => c.id === id);
        return client ? client.nombre : 'Sin asignar';
    };

    return (
        <div className="planner-grid" style={{ gridTemplateColumns: '1fr' }}>
            <div className="card" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '2px solid var(--secondary)', paddingBottom: '1rem' }}>
                    <div>
                        <h3 style={{ margin: 0, border: 'none', padding: 0 }}>Panel de Control Administrativo</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>Gestiona de forma centralizada los Clientes, Proyectos y Roles de usuario.</p>
                    </div>
                </div>

                {/* Tabs selection */}
                <div className="admin-tabs" style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', background: 'var(--bg-gray)', padding: '0.4rem', borderRadius: 'var(--radius-lg)', width: 'fit-content' }}>
                    <button
                        onClick={() => setActiveTab('clientes')}
                        className={`btn ${activeTab === 'clientes' ? 'btn-primary' : ''}`}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 1.25rem',
                            backgroundColor: activeTab === 'clientes' ? 'var(--primary)' : 'transparent',
                            color: activeTab === 'clientes' ? 'white' : 'var(--text-secondary)',
                            borderRadius: 'var(--radius-md)',
                            border: 'none',
                            fontWeight: 600
                        }}
                    >
                        <Building size={16} /> Clientes
                    </button>
                    <button
                        onClick={() => setActiveTab('proyectos')}
                        className={`btn ${activeTab === 'proyectos' ? 'btn-primary' : ''}`}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 1.25rem',
                            backgroundColor: activeTab === 'proyectos' ? 'var(--primary)' : 'transparent',
                            color: activeTab === 'proyectos' ? 'white' : 'var(--text-secondary)',
                            borderRadius: 'var(--radius-md)',
                            border: 'none',
                            fontWeight: 600
                        }}
                    >
                        <Briefcase size={16} /> Proyectos
                    </button>
                    <button
                        onClick={() => setActiveTab('usuarios')}
                        className={`btn ${activeTab === 'usuarios' ? 'btn-primary' : ''}`}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 1.25rem',
                            backgroundColor: activeTab === 'usuarios' ? 'var(--primary)' : 'transparent',
                            color: activeTab === 'usuarios' ? 'white' : 'var(--text-secondary)',
                            borderRadius: 'var(--radius-md)',
                            border: 'none',
                            fontWeight: 600
                        }}
                    >
                        <Users size={16} /> Usuarios
                    </button>
                </div>

                {loading ? (
                    <div className="empty-state" style={{ minHeight: '30vh' }}>Cargando datos administrativos...</div>
                ) : (
                    <div className="admin-content-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
                        
                        {/* TAB 1: CLIENTES */}
                        {activeTab === 'clientes' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                                    <div className="card" style={{ margin: 0, padding: '1.5rem', borderStyle: 'dashed' }}>
                                        <h4 style={{ color: 'var(--primary)', marginBottom: '1rem', fontWeight: 600 }}>Añadir Nuevo Cliente</h4>
                                        <form onSubmit={handleAddClient} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            <div className="form-group" style={{ margin: 0 }}>
                                                <label>Nombre del Cliente / Empresa</label>
                                                <input
                                                    type="text"
                                                    value={newClientName}
                                                    onChange={(e) => setNewClientName(e.target.value)}
                                                    placeholder="Ej. Sodexo S.A."
                                                    required
                                                    disabled={actionLoading}
                                                />
                                            </div>
                                            <button type="submit" className="btn btn-primary flex-center" disabled={actionLoading} style={{ padding: '0.6rem 1rem' }}>
                                                <PlusCircle size={18} className="icon-mr" />
                                                {actionLoading ? 'Registrando...' : 'Registrar Cliente'}
                                            </button>
                                        </form>
                                    </div>

                                    <div>
                                        <h4 style={{ marginBottom: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Clientes Registrados ({clients.length})</h4>
                                        {clients.length === 0 ? (
                                            <p className="empty-state">No hay clientes registrados en el sistema.</p>
                                        ) : (
                                            <div style={{ maxHeight: '350px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                                                <table className="task-table" style={{ margin: 0 }}>
                                                    <thead>
                                                        <tr>
                                                            <th>Nombre de Cliente</th>
                                                            <th style={{ textAlign: 'right' }}>Acción</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {clients.map(c => (
                                                            <tr key={c.id}>
                                                                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.nombre}</td>
                                                                <td style={{ textAlign: 'right' }}>
                                                                    <button 
                                                                        onClick={() => handleDeleteClient(c.id)}
                                                                        className="btn-delete"
                                                                        title="Eliminar Cliente"
                                                                        style={{ color: 'var(--status-vencido)' }}
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: PROYECTOS */}
                        {activeTab === 'proyectos' && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                                <div className="card" style={{ margin: 0, padding: '1.5rem', borderStyle: 'dashed' }}>
                                    <h4 style={{ color: 'var(--primary)', marginBottom: '1rem', fontWeight: 600 }}>Añadir Nuevo Proyecto</h4>
                                    <form onSubmit={handleAddProject} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <div className="form-group" style={{ margin: 0 }}>
                                            <label>Nombre del Proyecto</label>
                                            <input
                                                type="text"
                                                value={newProjName}
                                                onChange={(e) => setNewProjName(e.target.value)}
                                                placeholder="Ej. App de Optimización VRP"
                                                required
                                                disabled={actionLoading}
                                            />
                                        </div>
                                        <div className="form-group" style={{ margin: 0 }}>
                                            <label>Descripción</label>
                                            <textarea
                                                value={newProjDesc}
                                                onChange={(e) => setNewProjDesc(e.target.value)}
                                                placeholder="Módulo o funcionalidad principal..."
                                                rows={3}
                                                disabled={actionLoading}
                                            />
                                        </div>
                                        <div className="form-group" style={{ margin: 0 }}>
                                            <label>Cliente Asociado</label>
                                            {clients.length === 0 ? (
                                                <p style={{ fontSize: '0.85rem', color: 'var(--status-vencido)' }}>Debes registrar al menos un cliente primero.</p>
                                            ) : (
                                                <select value={newProjClientId} onChange={(e) => setNewProjClientId(e.target.value)} disabled={actionLoading}>
                                                    {clients.map(c => (
                                                        <option key={c.id} value={c.id}>{c.nombre}</option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                        <div className="form-group" style={{ margin: 0 }}>
                                            <label>Estado Inicial</label>
                                            <select value={newProjState} onChange={(e) => setNewProjState(e.target.value)} disabled={actionLoading}>
                                                <option value="Planeado">Planeado</option>
                                                <option value="En proceso">En proceso</option>
                                                <option value="Completado">Completado</option>
                                            </select>
                                        </div>
                                        <button type="submit" className="btn btn-primary flex-center" disabled={actionLoading || clients.length === 0} style={{ padding: '0.6rem 1rem' }}>
                                            <PlusCircle size={18} className="icon-mr" />
                                            {actionLoading ? 'Registrando...' : 'Registrar Proyecto'}
                                        </button>
                                    </form>
                                </div>

                                <div>
                                    <h4 style={{ marginBottom: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Proyectos en el Sistema ({projects.length})</h4>
                                    {projects.length === 0 ? (
                                        <p className="empty-state">No hay proyectos registrados.</p>
                                    ) : (
                                        <div style={{ maxHeight: '450px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                                            <table className="task-table" style={{ margin: 0 }}>
                                                <thead>
                                                    <tr>
                                                        <th>Proyecto</th>
                                                        <th>Cliente</th>
                                                        <th>Estado</th>
                                                        <th style={{ textAlign: 'right' }}>Acción</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {projects.map(p => (
                                                        <tr key={p.id}>
                                                            <td style={{ fontWeight: 600 }}>{p.nombre}</td>
                                                            <td>
                                                                <span className="status-badge" style={{ backgroundColor: 'var(--secondary)', color: 'var(--primary)', fontWeight: 600 }}>{getClientName(p.cliente_id)}</span>
                                                            </td>
                                                            <td>
                                                                <span className="status-badge" style={{ 
                                                                    backgroundColor: p.estado === 'Completado' ? 'var(--status-vigente-bg)' : p.estado === 'En proceso' ? 'var(--status-por-vencer-bg)' : 'var(--bg-gray)',
                                                                    color: p.estado === 'Completado' ? 'var(--status-vigente)' : p.estado === 'En proceso' ? 'var(--status-por-vencer)' : 'var(--text-secondary)',
                                                                    fontWeight: 700
                                                                }}>
                                                                    {p.estado}
                                                                </span>
                                                            </td>
                                                            <td style={{ textAlign: 'right' }}>
                                                                    <button 
                                                                        onClick={() => handleDeleteProject(p.id)}
                                                                        className="btn-delete"
                                                                        title="Eliminar Proyecto"
                                                                        style={{ color: 'var(--status-vencido)' }}
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* TAB 3: USUARIOS */}
                        {activeTab === 'usuarios' && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                                <div className="card" style={{ margin: 0, padding: '1.5rem', borderStyle: 'dashed' }}>
                                    <h4 style={{ color: 'var(--primary)', marginBottom: '1rem', fontWeight: 600 }}>Registrar Nuevo Usuario</h4>
                                    <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <div className="form-group" style={{ margin: 0 }}>
                                            <label>Nombre Completo</label>
                                            <input
                                                type="text"
                                                value={newUserNombre}
                                                onChange={(e) => setNewUserNombre(e.target.value)}
                                                placeholder="Ej. Juan Pérez"
                                                required
                                                disabled={actionLoading}
                                            />
                                        </div>
                                        <div className="form-group" style={{ margin: 0 }}>
                                            <label>Correo Electrónico</label>
                                            <input
                                                type="email"
                                                value={newUserEmail}
                                                onChange={(e) => setNewUserEmail(e.target.value)}
                                                placeholder="ejemplo@cdb.com"
                                                required
                                                disabled={actionLoading}
                                            />
                                        </div>
                                        <div className="form-group" style={{ margin: 0 }}>
                                            <label>Contraseña</label>
                                            <input
                                                type="text"
                                                value={newUserPassword}
                                                onChange={(e) => setNewUserPassword(e.target.value)}
                                                placeholder="Contraseña segura..."
                                                required
                                                disabled={actionLoading}
                                            />
                                        </div>
                                        <div className="form-group" style={{ margin: 0 }}>
                                            <label>Rol de Usuario</label>
                                            <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)} disabled={actionLoading}>
                                                <option value="Jefaturas">Jefaturas</option>
                                                <option value="Administrativos">Administrativos</option>
                                                <option value="Cliente">Cliente (Externo)</option>
                                            </select>
                                        </div>
                                        
                                        {/* CRITICAL FEATURE: DYNAMIC DROPDOWN FOR CLIENT SELECTOR */}
                                        {newUserRole === 'Cliente' && (
                                            <div className="form-group" style={{ margin: 0, padding: '0.75rem', backgroundColor: 'var(--bg-gray)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                                                <label style={{ color: 'var(--primary)', fontWeight: 600 }}>Seleccionar Cliente / Empresa Vinculada</label>
                                                {clients.length === 0 ? (
                                                    <p style={{ fontSize: '0.8rem', color: 'var(--status-vencido)', margin: 0 }}>Debes registrar al menos un cliente para poder crear usuarios de rol cliente.</p>
                                                ) : (
                                                    <select value={newUserClientId} onChange={(e) => setNewUserClientId(e.target.value)} disabled={actionLoading} style={{ backgroundColor: 'white' }}>
                                                        {clients.map(c => (
                                                            <option key={c.id} value={c.id}>{c.nombre}</option>
                                                        ))}
                                                    </select>
                                                )}
                                            </div>
                                        )}

                                        <button type="submit" className="btn btn-primary flex-center" disabled={actionLoading || (newUserRole === 'Cliente' && clients.length === 0)} style={{ padding: '0.6rem 1rem' }}>
                                            <UserPlus size={18} className="icon-mr" />
                                            {actionLoading ? 'Registrando...' : 'Registrar Usuario'}
                                        </button>
                                    </form>
                                </div>

                                <div>
                                    <h4 style={{ marginBottom: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Usuarios Registrados ({users.length})</h4>
                                    {users.length === 0 ? (
                                        <p className="empty-state">No hay usuarios registrados.</p>
                                    ) : (
                                        <div style={{ maxHeight: '450px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                                            <table className="task-table" style={{ margin: 0 }}>
                                                <thead>
                                                    <tr>
                                                        <th>Usuario</th>
                                                        <th>Rol / Empresa</th>
                                                        <th style={{ textAlign: 'right' }}>Acción</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {users.map(u => {
                                                        let roleBadgeClass = 'badge-vigente'; // default jefaturas
                                                        if (u.rol === 'Administrativos') roleBadgeClass = 'badge-por-vencer';
                                                        if (u.rol === 'Cliente') roleBadgeClass = 'badge-vencido';

                                                        return (
                                                            <tr key={u.id}>
                                                                <td>
                                                                    <div style={{ fontWeight: 600 }}>{u.nombre}</div>
                                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{u.email}</div>
                                                                </td>
                                                                <td>
                                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-start' }}>
                                                                        <span className="status-badge" style={{ 
                                                                            fontSize: '0.7rem',
                                                                            fontWeight: 700,
                                                                            backgroundColor: u.rol === 'Jefaturas' ? 'var(--status-vigente-bg)' : u.rol === 'Cliente' ? 'var(--status-vencido-bg)' : 'var(--status-por-vencer-bg)',
                                                                            color: u.rol === 'Jefaturas' ? 'var(--status-vigente)' : u.rol === 'Cliente' ? 'var(--status-vencido)' : 'var(--status-por-vencer)',
                                                                        }}>{u.rol}</span>
                                                                        {u.rol === 'Cliente' && u.cliente_id && (
                                                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)' }}>↳ {getClientName(u.cliente_id)}</span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td style={{ textAlign: 'right' }}>
                                                                    <button 
                                                                        onClick={() => handleDeleteUser(u.id, u.email === 'juan@sodexo.com' || u.email === 'lchu@cdb.com')}
                                                                        className="btn-delete"
                                                                        title="Eliminar Usuario"
                                                                        style={{ color: 'var(--status-vencido)' }}
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
