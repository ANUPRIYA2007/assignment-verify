import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { usePageEntrance } from '../animations/GsapAnimations';
import { useRealtime } from '../hooks/useRealtime';
import api from '../lib/api';
import { FiUsers, FiTrash2, FiEdit2, FiSearch, FiFilter, FiArrowRight, FiUserCheck, FiPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editModal, setEditModal] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [moveModal, setMoveModal] = useState(null);
    const [moveForm, setMoveForm] = useState({ year_of_study: '1st', section: '' });
    const [createModal, setCreateModal] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [createForm, setCreateForm] = useState({
        full_name: '',
        email: '',
        password: '',
        role: 'student',
        register_number: '',
        year_of_study: '1st',
        section: '',
        gender: ''
    });
    const [filterRole, setFilterRole] = useState('');
    const [filterYear, setFilterYear] = useState('');
    const [search, setSearch] = useState('');
    const pageRef = usePageEntrance();

    const fetchUsers = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (filterRole) params.set('role', filterRole);
            if (filterYear) params.set('year', filterYear);
            const res = await api.get('/admin/users?' + params.toString());
            setUsers(res.data.users || []);
        } catch (err) {
            toast.error('Failed to load users');
        } finally { setLoading(false); }
    }, [filterRole, filterYear]);

    useEffect(() => {
        fetchUsers();
        
        // Also refresh every 3 seconds for live updates
        const interval = setInterval(fetchUsers, 3000);
        return () => clearInterval(interval);
    }, [fetchUsers]);

    // Real-time subscriptions for user changes
    useRealtime('users', { onInsert: fetchUsers, onUpdate: fetchUsers, onDelete: fetchUsers, enabled: true });

    const handleDelete = async (id) => {
        if (!confirm('Delete this user? This action cannot be undone.')) return;
        try {
            await api.delete('/admin/users/' + id);
            toast.success('User deleted');
            setUsers(prev => prev.filter(u => u.id !== id));
        } catch (err) {
            toast.error('Failed to delete');
        }
    };

    const handleUpdateUser = async () => {
        try {
            await api.put('/admin/users/' + editModal.id, editForm);
            toast.success('User updated');
            setEditModal(null);
            fetchUsers();
        } catch (err) {
            toast.error('Failed to update user');
        }
    };

    const handleMoveStudent = async () => {
        if (!moveForm.section) return toast.error('Section is required');
        try {
            await api.patch('/admin/users/' + moveModal.id + '/move', moveForm);
            toast.success('Student moved to ' + moveForm.year_of_study + ' ' + moveForm.section);
            setMoveModal(null);
            fetchUsers();
        } catch (err) {
            toast.error('Failed to move student');
        }
    };

    const handleCreateUser = async () => {
        if (!createForm.full_name || !createForm.email || !createForm.password) {
            return toast.error('Name, email and password are required');
        }
        if (createForm.password.length < 6) {
            return toast.error('Password must be at least 6 characters');
        }
        if (createForm.role === 'student' && (!createForm.year_of_study || !createForm.section)) {
            return toast.error('Student requires year and section');
        }

        setCreateLoading(true);
        try {
            console.log('📝 Creating user:', createForm);
            const response = await api.post('/admin/users', {
                full_name: createForm.full_name,
                email: createForm.email,
                password: createForm.password,
                role: createForm.role,
                register_number: createForm.register_number || null,
                year_of_study: createForm.role === 'student' ? createForm.year_of_study : null,
                section: createForm.role === 'student' ? createForm.section.toUpperCase() : null,
                gender: createForm.gender || null
            });
            console.log('✅ User created successfully:', response.data);
            toast.success('User created');
            setCreateModal(false);
            setCreateForm({
                full_name: '',
                email: '',
                password: '',
                role: 'student',
                register_number: '',
                year_of_study: '1st',
                section: '',
                gender: ''
            });
            fetchUsers();
        } catch (err) {
            console.error('❌ User creation error:', err.response?.data || err.message);
            toast.error(err.response?.data?.error || 'Failed to create user');
        } finally {
            setCreateLoading(false);
        }
    };

    const openEditModal = (user) => {
        setEditModal(user);
        setEditForm({
            role: user.role,
            full_name: user.full_name,
            year_of_study: user.year_of_study || '',
            section: user.section || '',
            gender: user.gender || '',
            register_number: user.register_number || ''
        });
    };

    const filtered = users.filter(u =>
        u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.register_number?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div ref={pageRef}>
            <div className="page-header animate-section">
                <h1><span className="gradient-text">Manage Users</span></h1>
                <p>View, edit, move and manage all registered users</p>
            </div>

            <div className="glass-card animate-section" style={{ padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <FiFilter size={16} style={{ color: 'var(--text-muted)' }} />
                <button
                    onClick={() => setCreateModal(true)}
                    className="btn-primary"
                    style={{ height: 38, display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px' }}
                >
                    <FiPlus size={14} /> <span>Create User</span>
                </button>
                <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
                    className="input-field" style={{ width: 140, height: 38, fontSize: '0.82rem' }}>
                    <option value="">All Roles</option>
                    <option value="student">Students</option>
                    <option value="teacher">Teachers</option>
                    <option value="admin">Admins</option>
                </select>
                <select value={filterYear} onChange={e => setFilterYear(e.target.value)}
                    className="input-field" style={{ width: 140, height: 38, fontSize: '0.82rem' }}>
                    <option value="">All Years</option>
                    <option value="1st">1st Year</option>
                    <option value="2nd">2nd Year</option>
                    <option value="3rd">3rd Year</option>
                    <option value="Final">Final Year</option>
                </select>
                <div style={{ position: 'relative', marginLeft: 'auto' }}>
                    <FiSearch size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
                        className="input-field" style={{ paddingLeft: 34, width: 240, height: 38, fontSize: '0.82rem' }} />
                </div>
            </div>

            <div style={{ marginBottom: 12, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Showing {filtered.length} user{filtered.length !== 1 ? 's' : ''}
            </div>

            {loading ? (
                <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}><p style={{ color: 'var(--text-muted)' }}>Loading...</p></div>
            ) : filtered.length === 0 ? (
                <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
                    <FiUsers size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
                    <p style={{ color: 'var(--text-muted)' }}>No users found</p>
                </div>
            ) : (
                <div className="glass-card animate-section" style={{ overflow: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr><th>Name</th><th>Email</th><th>Role</th><th>Reg No</th><th>Class</th><th>Gender</th><th>Joined</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {filtered.map(u => (
                                <tr key={u.id} className="reveal-item">
                                    <td style={{ fontWeight: 500 }}>
                                        {u.role === 'student' ? (
                                            <Link to={'/admin/student/' + u.id} style={{ color: 'inherit', textDecoration: 'none' }}>
                                                {u.full_name}
                                            </Link>
                                        ) : u.full_name}
                                    </td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>{u.email}</td>
                                    <td><span className={'badge badge-' + u.role}>{u.role}</span></td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>{u.register_number || '—'}</td>
                                    <td style={{ fontSize: '0.83rem' }}>{u.year_of_study ? u.year_of_study + ' ' + (u.section || '') : '—'}</td>
                                    <td>
                                        {u.gender ? (
                                            <span style={{ fontSize: '0.78rem', padding: '2px 8px', borderRadius: 6,
                                                background: u.gender === 'male' ? 'rgba(59,130,246,0.1)' : 'rgba(236,72,153,0.1)',
                                                color: u.gender === 'male' ? '#3B82F6' : '#EC4899' }}>
                                                {u.gender === 'male' ? '♂' : '♀'}
                                            </span>
                                        ) : '—'}
                                    </td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button onClick={() => openEditModal(u)} className="btn-secondary"
                                                style={{ padding: '5px 10px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 3 }}>
                                                <FiEdit2 size={12} /> Edit
                                            </button>
                                            {u.role === 'student' && (
                                                <button onClick={() => { setMoveModal(u); setMoveForm({ year_of_study: u.year_of_study || '1st', section: u.section || '' }); }}
                                                    className="btn-secondary" style={{ padding: '5px 10px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 3 }}>
                                                    <FiArrowRight size={12} /> Move
                                                </button>
                                            )}
                                            <button onClick={() => handleDelete(u.id)} className="btn-danger"
                                                style={{ padding: '5px 10px', fontSize: '0.78rem' }}>
                                                <FiTrash2 size={12} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Edit Modal */}
            {editModal && (
                <div className="modal-overlay" onClick={() => setEditModal(null)}>
                    <div className="glass-card" style={{ maxWidth: 440, width: '90%', padding: 32 }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, marginBottom: 4 }}><span className="gradient-text">Edit User</span></h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: 18, fontSize: '0.85rem' }}>{editModal.email}</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                            <div>
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Full Name</label>
                                <input type="text" className="input-field" value={editForm.full_name || ''} onChange={e => setEditForm({...editForm, full_name: e.target.value})} style={{ width: '100%' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Role</label>
                                <select className="input-field" value={editForm.role || ''} onChange={e => setEditForm({...editForm, role: e.target.value})} style={{ width: '100%' }}>
                                    <option value="student">Student</option>
                                    <option value="teacher">Teacher</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Year</label>
                                    <select className="input-field" value={editForm.year_of_study || ''} onChange={e => setEditForm({...editForm, year_of_study: e.target.value})} style={{ width: '100%' }}>
                                        <option value="">—</option>
                                        {['1st','2nd','3rd','Final'].map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Section</label>
                                    <input type="text" className="input-field" value={editForm.section || ''} onChange={e => setEditForm({...editForm, section: e.target.value.toUpperCase()})} style={{ width: '100%' }} />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Gender</label>
                                    <select className="input-field" value={editForm.gender || ''} onChange={e => setEditForm({...editForm, gender: e.target.value})} style={{ width: '100%' }}>
                                        <option value="">—</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Register No</label>
                                    <input type="text" className="input-field" value={editForm.register_number || ''} onChange={e => setEditForm({...editForm, register_number: e.target.value})} style={{ width: '100%' }} />
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button onClick={handleUpdateUser} className="btn-primary" style={{ flex: 1 }}><span>Update</span></button>
                            <button onClick={() => setEditModal(null)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Move Student Modal */}
            {moveModal && (
                <div className="modal-overlay" onClick={() => setMoveModal(null)}>
                    <div className="glass-card" style={{ maxWidth: 400, width: '90%', padding: 32 }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, marginBottom: 4 }}><span className="gradient-text">Move Student</span></h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: 18, fontSize: '0.85rem' }}>{moveModal.full_name}</p>
                        <div style={{ marginBottom: 14 }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>New Year</label>
                            <select className="input-field" value={moveForm.year_of_study} onChange={e => setMoveForm({...moveForm, year_of_study: e.target.value})} style={{ width: '100%' }}>
                                {['1st','2nd','3rd','Final'].map(y => <option key={y} value={y}>{y} Year</option>)}
                            </select>
                        </div>
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>New Section</label>
                            <input type="text" className="input-field" placeholder="E.g. A, B, CS1" value={moveForm.section}
                                onChange={e => setMoveForm({...moveForm, section: e.target.value.toUpperCase()})} style={{ width: '100%' }} />
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button onClick={handleMoveStudent} className="btn-primary" style={{ flex: 1 }}><span>Move</span></button>
                            <button onClick={() => setMoveModal(null)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {createModal && (
                <div className="modal-overlay" onClick={() => setCreateModal(false)}>
                    <div className="glass-card" style={{ maxWidth: 500, width: '92%', padding: 30 }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, marginBottom: 4 }}><span className="gradient-text">Create User</span></h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: 18, fontSize: '0.85rem' }}>Add a new student, teacher, or admin account</p>

                        <div style={{ display: 'grid', gap: 12, marginBottom: 18 }}>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Full name"
                                value={createForm.full_name}
                                onChange={e => setCreateForm({ ...createForm, full_name: e.target.value })}
                            />
                            <input
                                type="email"
                                className="input-field"
                                placeholder="Email"
                                value={createForm.email}
                                onChange={e => setCreateForm({ ...createForm, email: e.target.value })}
                            />
                            <input
                                type="password"
                                className="input-field"
                                placeholder="Password"
                                value={createForm.password}
                                onChange={e => setCreateForm({ ...createForm, password: e.target.value })}
                            />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <select
                                    className="input-field"
                                    value={createForm.role}
                                    onChange={e => setCreateForm({ ...createForm, role: e.target.value })}
                                >
                                    <option value="student">Student</option>
                                    <option value="teacher">Teacher</option>
                                    <option value="admin">Admin</option>
                                </select>
                                <select
                                    className="input-field"
                                    value={createForm.gender}
                                    onChange={e => setCreateForm({ ...createForm, gender: e.target.value })}
                                >
                                    <option value="">Gender (optional)</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            {createForm.role === 'student' && (
                                <>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="Register number (optional)"
                                        value={createForm.register_number}
                                        onChange={e => setCreateForm({ ...createForm, register_number: e.target.value })}
                                    />
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                        <select
                                            className="input-field"
                                            value={createForm.year_of_study}
                                            onChange={e => setCreateForm({ ...createForm, year_of_study: e.target.value })}
                                        >
                                            {['1st', '2nd', '3rd', 'Final'].map(y => <option key={y} value={y}>{y} Year</option>)}
                                        </select>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="Section"
                                            value={createForm.section}
                                            onChange={e => setCreateForm({ ...createForm, section: e.target.value.toUpperCase() })}
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: 12 }}>
                            <button onClick={handleCreateUser} className="btn-primary" style={{ flex: 1 }} disabled={createLoading}>
                                <span>{createLoading ? 'Creating...' : 'Create'}</span>
                            </button>
                            <button onClick={() => setCreateModal(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
