import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { usePageEntrance } from '../animations/GsapAnimations';
import { useRealtime } from '../hooks/useRealtime';
import api from '../lib/api';
import { FiFileText, FiCheckSquare, FiSearch, FiFilter, FiRadio } from 'react-icons/fi';
import toast from 'react-hot-toast';

import { useAuth } from '../context/AuthContext';

export default function StudentAssignments() {
    const { user } = useAuth();
    const [assignments, setAssignments] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const pageRef = usePageEntrance();

    const fetchAssignments = useCallback(async () => {
        try {
            const res = await api.get('/assignments');
            setAssignments(res.data.assignments || []);
        } catch (err) {
            console.error('Failed to fetch assignments', err);
        }
    }, []);

    const fetchSubmissions = useCallback(async () => {
        try {
            const res = await api.get('/submissions/my');
            setSubmissions(res.data.submissions || []);
        } catch (err) {
            console.error('Failed to fetch submissions', err);
        }
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            await Promise.all([fetchAssignments(), fetchSubmissions()]);
            setLoading(false);
        };
        fetchData();
    }, [fetchAssignments, fetchSubmissions]);

    // 🔴 Real-time: re-fetch on assignment changes
    useRealtime('assignments', {
        onInsert: useCallback(() => fetchAssignments(), [fetchAssignments]),
        onUpdate: useCallback(() => fetchAssignments(), [fetchAssignments]),
        onDelete: useCallback(() => fetchAssignments(), [fetchAssignments])
    });

    // 🔴 Real-time: re-fetch on submission status changes
    useRealtime('submissions', {
        onUpdate: useCallback(() => fetchSubmissions(), [fetchSubmissions]),
        filter: user?.id ? `student_id=eq.${user.id}` : undefined,
        enabled: !!user?.id
    });

    const relevantAssignments = assignments.filter(a => {
        // If student has no year/section set, show all assignments
        const matchesYear = !a.target_year || !user?.year_of_study || a.target_year === user?.year_of_study;
        const matchesSection = !a.target_section || !user?.section || a.target_section === user?.section;
        return matchesYear && matchesSection;
    });

    const filtered = relevantAssignments.filter(a => {
        const matchSearch = a.title.toLowerCase().includes(search.toLowerCase());
        const submitted = submissions.find(s => s.assignment_id === a.id);
        if (filter === 'pending') return matchSearch && !submitted;
        if (filter === 'submitted') return matchSearch && !!submitted;
        if (filter === 'file') return matchSearch && a.type === 'file';
        if (filter === 'mcq') return matchSearch && a.type === 'mcq';
        return matchSearch;
    });

    return (
        <div ref={pageRef}>
            <div className="page-header animate-section">
                <h1><span className="gradient-text">Assignments</span></h1>
                <p>Browse and submit your assignments</p>
            </div>

            <div className="animate-section" style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: '1 1 300px' }}>
                    <FiSearch style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input className="input-field" style={{ paddingLeft: 42 }} placeholder="Search assignments..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    {['all', 'pending', 'submitted', 'file', 'mcq'].map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            style={{
                                padding: '10px 16px', borderRadius: 10, border: `1px solid ${filter === f ? 'var(--primary)' : 'var(--dark-border)'}`,
                                background: filter === f ? 'rgba(108,99,255,0.12)' : 'transparent',
                                color: filter === f ? 'var(--primary-light)' : 'var(--text-muted)',
                                cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase', transition: 'all 0.3s'
                            }}
                        >{f}</button>
                    ))}
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
                <div className="animate-section" style={{ display: 'grid', gap: 12 }}>
                    {filtered.map(a => {
                        const submitted = submissions.find(s => s.assignment_id === a.id);
                        const isLate = new Date() > new Date(a.deadline) && !submitted;
                        return (
                            <Link to={`/student/assignment/${a.id}`} key={a.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                                <div className="glass-card reveal-item" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                        <div style={{
                                            width: 44, height: 44, borderRadius: 12,
                                            background: a.type === 'mcq' ? 'rgba(0,212,170,0.12)' : 'rgba(0,180,216,0.12)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: a.type === 'mcq' ? 'var(--accent)' : 'var(--info)'
                                        }}>
                                            {a.type === 'mcq' ? <FiCheckSquare size={20} /> : <FiFileText size={20} />}
                                        </div>
                                        <div>
                                            <h3 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 4 }}>{a.title}</h3>
                                            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                                                <span className={`badge badge-${a.type}`}>{a.type.toUpperCase()}</span>
                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                                                    Marks: {a.total_marks}
                                                </span>
                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                                                    Due: {new Date(a.deadline).toLocaleString()}
                                                </span>
                                                {a.users?.full_name && (
                                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                                                        By: {a.users.full_name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        {submitted ? (
                                            <span className={`badge badge-${submitted.status}`}>{submitted.status}</span>
                                        ) : isLate ? (
                                            <span className="badge badge-late">Overdue</span>
                                        ) : (
                                            <span className="badge badge-pending">Pending</span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
