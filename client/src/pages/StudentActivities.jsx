import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { usePageEntrance } from '../animations/GsapAnimations';
import { useRealtime } from '../hooks/useRealtime';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import {
    FiFileText, FiCheckSquare, FiClock, FiUsers, FiCalendar,
    FiAward, FiPlay, FiEye, FiSearch, FiFilter, FiActivity
} from 'react-icons/fi';

export default function StudentActivities() {
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
        const load = async () => {
            await Promise.all([fetchAssignments(), fetchSubmissions()]);
            setLoading(false);
        };
        load();
    }, [fetchAssignments, fetchSubmissions]);

    // Realtime updates
    useRealtime('assignments', {
        onInsert: useCallback(() => fetchAssignments(), [fetchAssignments]),
        onUpdate: useCallback(() => fetchAssignments(), [fetchAssignments]),
        onDelete: useCallback(() => fetchAssignments(), [fetchAssignments])
    });

    useRealtime('submissions', {
        onUpdate: useCallback(() => fetchSubmissions(), [fetchSubmissions]),
        filter: user?.id ? `student_id=eq.${user.id}` : undefined,
        enabled: !!user?.id
    });

    // Filter to relevant assignments for this student
    const relevant = assignments.filter(a => {
        const matchesYear = !a.target_year || a.target_year === user?.year_of_study;
        const matchesSection = !a.target_section || a.target_section === user?.section;
        return matchesYear && matchesSection;
    });

    // Categorize each assignment
    const now = new Date();
    const categorized = relevant.map(a => {
        const deadline = new Date(a.deadline);
        const submitted = submissions.find(s => s.assignment_id === a.id);
        let status;
        if (submitted) {
            status = 'submitted';
        } else if (now > deadline) {
            status = 'closed';
        } else {
            status = 'live';
        }
        return { ...a, status, submitted, deadline };
    });

    // Sort: live → closed with no submission (upcoming/overdue) → submitted
    const sortOrder = { live: 0, closed: 1, submitted: 2 };
    const sorted = [...categorized].sort((a, b) => {
        const diff = sortOrder[a.status] - sortOrder[b.status];
        if (diff !== 0) return diff;
        return new Date(b.created_at) - new Date(a.created_at);
    });

    // Apply search + filter
    const filtered = sorted.filter(a => {
        const matchSearch = a.title.toLowerCase().includes(search.toLowerCase()) ||
            (a.description || '').toLowerCase().includes(search.toLowerCase());
        if (filter === 'live') return matchSearch && a.status === 'live';
        if (filter === 'submitted') return matchSearch && a.status === 'submitted';
        if (filter === 'closed') return matchSearch && a.status === 'closed';
        if (filter === 'file') return matchSearch && a.type === 'file';
        if (filter === 'mcq') return matchSearch && a.type === 'mcq';
        return matchSearch;
    });

    const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
    });
    const formatTime = (d) => new Date(d).toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit'
    });

    const statusConfig = {
        live: { label: 'Live', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
        submitted: { label: 'Submitted', color: '#7C3AED', bg: 'rgba(124,58,237,0.10)' },
        closed: { label: 'Closed', color: '#EF4444', bg: 'rgba(239,68,68,0.10)' }
    };

    const liveCount = categorized.filter(a => a.status === 'live').length;
    const submittedCount = categorized.filter(a => a.status === 'submitted').length;
    const closedCount = categorized.filter(a => a.status === 'closed').length;

    return (
        <div ref={pageRef}>
            <div className="page-header animate-section">
                <h1><span className="gradient-text">Activities</span></h1>
                <p>All your assignments at a glance</p>
            </div>

            {/* Summary Stats */}
            <div className="animate-section" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
                <div className="glass-card" style={{ padding: '18px 20px', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
                        <FiPlay size={18} />
                    </div>
                    <div>
                        <p style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10B981' }}>{liveCount}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Live</p>
                    </div>
                </div>
                <div className="glass-card" style={{ padding: '18px 20px', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(124,58,237,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7C3AED' }}>
                        <FiCheckSquare size={18} />
                    </div>
                    <div>
                        <p style={{ fontSize: '1.4rem', fontWeight: 800, color: '#7C3AED' }}>{submittedCount}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Submitted</p>
                    </div>
                </div>
                <div className="glass-card" style={{ padding: '18px 20px', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(239,68,68,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}>
                        <FiClock size={18} />
                    </div>
                    <div>
                        <p style={{ fontSize: '1.4rem', fontWeight: 800, color: '#EF4444' }}>{closedCount}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Closed</p>
                    </div>
                </div>
                <div className="glass-card" style={{ padding: '18px 20px', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(59,130,246,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6' }}>
                        <FiActivity size={18} />
                    </div>
                    <div>
                        <p style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>{categorized.length}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total</p>
                    </div>
                </div>
            </div>

            {/* Search + Filter */}
            <div className="animate-section" style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: '1 1 280px' }}>
                    <FiSearch style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input className="input-field" style={{ paddingLeft: 42 }} placeholder="Search activities..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['all', 'live', 'submitted', 'closed', 'file', 'mcq'].map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            style={{
                                padding: '10px 16px', borderRadius: 10,
                                border: `1px solid ${filter === f ? 'var(--primary)' : 'var(--dark-border)'}`,
                                background: filter === f ? 'rgba(124,58,237,0.12)' : 'transparent',
                                color: filter === f ? 'var(--primary)' : 'var(--text-muted)',
                                cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', transition: 'all 0.3s'
                            }}
                        >{f}</button>
                    ))}
                </div>
            </div>

            {/* Card Grid */}
            {loading ? (
                <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)' }}>Loading activities...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
                    <FiActivity size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
                    <p style={{ color: 'var(--text-muted)' }}>No activities found</p>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 20
                }} className="activities-grid animate-section">
                    {filtered.map(a => {
                        const sc = statusConfig[a.status];
                        const questionsCount = a.type === 'mcq' && a.mcq_duration ? `${a.mcq_duration} min` : null;

                        return (
                            <div key={a.id} className="glass-card activity-card" style={{
                                padding: 0, borderRadius: 16, overflow: 'hidden',
                                border: a.status === 'live' ? '1.5px solid rgba(16,185,129,0.30)' : '1px solid var(--dark-border)',
                                transition: 'all 0.3s ease', cursor: 'pointer',
                                position: 'relative'
                            }}>
                                {/* Status Badge + Created Date */}
                                <div style={{ padding: '16px 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 6,
                                        padding: '5px 12px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700,
                                        background: sc.bg, color: sc.color, textTransform: 'uppercase', letterSpacing: '0.5px'
                                    }}>
                                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.color, display: 'inline-block' }}></span>
                                        {sc.label}
                                    </span>
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                        {formatDate(a.created_at)}
                                    </span>
                                </div>

                                {/* Title + Description */}
                                <div style={{ padding: '0 20px 14px' }}>
                                    <h3 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 4, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                                        {a.title}
                                    </h3>
                                    {a.description && (
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {a.description}
                                        </p>
                                    )}
                                </div>

                                {/* Meta Info Row */}
                                <div style={{ padding: '0 20px 14px', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                                    <span className={`badge badge-${a.type}`} style={{ fontSize: '0.7rem' }}>
                                        {a.type === 'mcq' ? <><FiCheckSquare size={11} style={{ marginRight: 4 }} />MCQ</> : <><FiFileText size={11} style={{ marginRight: 4 }} />File</>}
                                    </span>
                                    {questionsCount && (
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <FiClock size={12} /> {questionsCount}
                                        </span>
                                    )}
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <FiAward size={12} /> {a.total_marks} marks
                                    </span>
                                    {a.points_ontime > 0 && (
                                        <span style={{ fontSize: '0.75rem', color: 'var(--accent, #10B981)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                            +{a.points_ontime} pts
                                        </span>
                                    )}
                                </div>

                                {/* Deadline Row */}
                                <div style={{ padding: '12px 20px', background: 'rgba(124,58,237,0.04)', borderTop: '1px solid var(--dark-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <FiCalendar size={13} style={{ color: 'var(--text-muted)' }} />
                                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                            Due: {formatDate(a.deadline)} at {formatTime(a.deadline)}
                                        </span>
                                    </div>
                                </div>

                                {/* Teacher + Points */}
                                <div style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--dark-border)' }}>
                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <FiUsers size={13} />
                                        {a.users?.full_name || 'Instructor'}
                                    </span>
                                    {a.submitted && (
                                        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#7C3AED' }}>
                                            {a.submitted.marks !== null ? `${a.submitted.marks}/${a.total_marks}` : 'Pending review'}
                                        </span>
                                    )}
                                </div>

                                {/* Action Button */}
                                <div style={{ padding: '12px 20px 16px' }}>
                                    <Link to={`/student/assignment/${a.id}`} style={{ textDecoration: 'none' }}>
                                        <button className="btn-primary" style={{
                                            width: '100%', padding: '11px 16px', borderRadius: 10,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                            fontSize: '0.85rem', fontWeight: 700,
                                            background: a.status === 'live'
                                                ? 'linear-gradient(135deg, #7C3AED, #6D28D9)'
                                                : 'rgba(124,58,237,0.08)',
                                            color: a.status === 'live' ? '#fff' : 'var(--primary)',
                                            border: a.status === 'live' ? 'none' : '1px solid var(--dark-border)',
                                            cursor: 'pointer'
                                        }}>
                                            {a.status === 'live' ? <><FiPlay size={14} /> Start</> :
                                             a.status === 'submitted' ? <><FiEye size={14} /> View Details</> :
                                             <><FiEye size={14} /> View</>}
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
