import { useState, useEffect, useCallback } from 'react';
import { usePageEntrance } from '../animations/GsapAnimations';
import { useRealtime } from '../hooks/useRealtime';
import api from '../lib/api';
import { FiFileText, FiCheckSquare, FiTrash2, FiSearch, FiFilter, FiInbox } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function AdminAssignments() {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const pageRef = usePageEntrance();

    const fetchAssignments = useCallback(async () => {
        try {
            const res = await api.get('/admin/assignments');
            setAssignments(res.data.assignments || []);
        } catch (err) {
            toast.error('Failed to load assignments');
        } finally { setLoading(false); }
    }, []);

    useEffect(() => {
        fetchAssignments();
        
        // Refresh every 3 seconds for live updates
        const interval = setInterval(fetchAssignments, 3000);
        return () => clearInterval(interval);
    }, [fetchAssignments]);

    useRealtime('assignments', {
        onInsert: fetchAssignments,
        onUpdate: fetchAssignments,
        onDelete: fetchAssignments,
        enabled: true
    });

    useRealtime('submissions', { onInsert: fetchAssignments, onUpdate: fetchAssignments, enabled: true });

    const handleDelete = async (id, title) => {
        if (!confirm('Delete "' + title + '" and ALL its submissions? This cannot be undone.')) return;
        try {
            await api.delete('/admin/assignments/' + id);
            toast.success('Assignment deleted');
            setAssignments(prev => prev.filter(a => a.id !== id));
        } catch (err) {
            toast.error('Failed to delete assignment');
        }
    };

    const filtered = assignments.filter(a => {
        if (search && !(a.title?.toLowerCase().includes(search.toLowerCase()) || a.users?.full_name?.toLowerCase().includes(search.toLowerCase()))) return false;
        if (filterType && a.type !== filterType) return false;
        if (filterStatus === 'active' && new Date(a.deadline) <= new Date()) return false;
        if (filterStatus === 'closed' && new Date(a.deadline) > new Date()) return false;
        return true;
    });

    return (
        <div ref={pageRef}>
            <div className="page-header animate-section">
                <h1><span className="gradient-text">All Assignments</span></h1>
                <p>Manage all assignments across the platform</p>
            </div>

            <div className="glass-card animate-section" style={{ padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <FiFilter size={16} style={{ color: 'var(--text-muted)' }} />
                <select value={filterType} onChange={e => setFilterType(e.target.value)}
                    className="input-field" style={{ width: 140, height: 38, fontSize: '0.82rem' }}>
                    <option value="">All Types</option>
                    <option value="file">File Upload</option>
                    <option value="mcq">MCQ</option>
                </select>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                    className="input-field" style={{ width: 140, height: 38, fontSize: '0.82rem' }}>
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="closed">Closed</option>
                </select>
                <div style={{ position: 'relative', marginLeft: 'auto' }}>
                    <FiSearch size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
                        className="input-field" style={{ paddingLeft: 34, width: 220, height: 38, fontSize: '0.82rem' }} />
                </div>
            </div>

            {loading ? (
                <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}><p style={{ color: 'var(--text-muted)' }}>Loading...</p></div>
            ) : filtered.length === 0 ? (
                <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
                    <FiFileText size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
                    <p style={{ color: 'var(--text-muted)' }}>No assignments found</p>
                </div>
            ) : (
                <div className="glass-card animate-section" style={{ overflow: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr><th>Title</th><th>Type</th><th>Teacher</th><th>Class</th><th>Subject</th><th>Marks</th><th>Submissions</th><th>Deadline</th><th>Status</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {filtered.map(a => {
                                const isActive = new Date(a.deadline) > new Date();
                                return (
                                    <tr key={a.id} className="reveal-item">
                                        <td style={{ fontWeight: 500 }}>{a.title}</td>
                                        <td><span className={'badge badge-' + a.type}>{a.type?.toUpperCase()}</span></td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{a.users?.full_name || 'N/A'}</td>
                                        <td style={{ fontSize: '0.83rem' }}>{a.target_year || ''} {a.target_section || ''}</td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>{a.subject || '—'}</td>
                                        <td>{a.total_marks}</td>
                                        <td>
                                            <span style={{ fontWeight: 600, color: '#7C3AED', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <FiInbox size={13} /> {a.submission_count || 0}
                                            </span>
                                        </td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>{new Date(a.deadline).toLocaleDateString()}</td>
                                        <td><span className={'badge ' + (isActive ? 'badge-approved' : 'badge-late')}>{isActive ? 'Active' : 'Closed'}</span></td>
                                        <td>
                                            <button onClick={() => handleDelete(a.id, a.title)} className="btn-danger"
                                                style={{ padding: '6px 10px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <FiTrash2 size={13} /> Delete
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
    );
}
