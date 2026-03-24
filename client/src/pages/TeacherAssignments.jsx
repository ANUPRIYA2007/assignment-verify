import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePageEntrance } from '../animations/GsapAnimations';
import api from '../lib/api';
import { FiFileText, FiCheckSquare, FiTrash2, FiPlusCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function TeacherAssignments() {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const pageRef = usePageEntrance();

    const fetchAssignments = async () => {
        try {
            const res = await api.get('/assignments');
            setAssignments(res.data.assignments || []);
        } catch (err) {
            toast.error('Failed to load');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAssignments(); }, []);

    const handleDelete = async (id) => {
        if (!confirm('Delete this assignment?')) return;
        try {
            await api.delete(`/assignments/${id}`);
            toast.success('Assignment deleted');
            setAssignments(prev => prev.filter(a => a.id !== id));
        } catch (err) {
            toast.error('Failed to delete');
        }
    };

    return (
        <div ref={pageRef}>
            <div className="page-header animate-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1><span className="gradient-text">My Assignments</span></h1>
                        <p>Manage your created assignments</p>
                    </div>
                    <Link to="/teacher/create" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                        <FiPlusCircle size={18} /><span>New Assignment</span>
                    </Link>
                </div>
            </div>

            {loading ? (
                <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}><p style={{ color: 'var(--text-muted)' }}>Loading...</p></div>
            ) : assignments.length === 0 ? (
                <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
                    <FiFileText size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
                    <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>No assignments yet</p>
                    <Link to="/teacher/create" className="btn-primary" style={{ textDecoration: 'none' }}><span>Create First Assignment</span></Link>
                </div>
            ) : (
                <div className="glass-card animate-section" style={{ overflow: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr><th>Title</th><th>Target</th><th>Type</th><th>Marks</th><th>Deadline</th><th>Status</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {assignments.map(a => {
                                const isActive = new Date(a.deadline) > new Date();
                                return (
                                    <tr key={a.id} className="reveal-item">
                                        <td style={{ fontWeight: 500 }}>{a.title}</td>
                                        <td>
                                            <div className="text-xs font-bold text-primary-light">
                                                {a.target_year || 'Agnostic'}
                                                {a.target_section ? ` | Sec ${a.target_section}` : ''}
                                            </div>
                                        </td>
                                        <td><span className={`badge badge-${a.type}`}>{a.type.toUpperCase()}</span></td>
                                        <td>{a.total_marks}</td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{new Date(a.deadline).toLocaleString()}</td>
                                        <td><span className={`badge ${isActive ? 'badge-approved' : 'badge-late'}`}>{isActive ? 'Active' : 'Closed'}</span></td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <Link to={`/teacher/submissions/${a.id}`} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', textDecoration: 'none' }}>Submissions</Link>
                                                <button onClick={() => handleDelete(a.id)} className="btn-danger" style={{ padding: '6px 12px', fontSize: '0.8rem' }}><FiTrash2 size={14} /></button>
                                            </div>
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
