import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePageEntrance, AnimatedCounter } from '../animations/GsapAnimations';
import { useRealtime } from '../hooks/useRealtime';
import api from '../lib/api';
import { FiFileText, FiCheckSquare, FiClock, FiAward, FiArrowRight, FiInfo, FiRadio } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function StudentDashboard() {
    const { user } = useAuth();
    const [assignments, setAssignments] = useState([]);
    const [submissions, setSubmissions] = useState([]);
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

    // 🔴 Real-time: re-fetch assignments from API on any change
    useRealtime('assignments', {
        onInsert: useCallback(() => {
            console.log('[StudentDashboard] Assignment INSERT — re-fetching');
            fetchAssignments();
            toast('📝 New assignment posted!', {
                icon: '🔔',
                style: { background: '#fff', color: '#1E1B3A', border: '1px solid #E5E0F6', borderRadius: 12 },
                duration: 4000
            });
        }, [fetchAssignments]),
        onUpdate: useCallback(() => {
            console.log('[StudentDashboard] Assignment UPDATE — re-fetching');
            fetchAssignments();
        }, [fetchAssignments]),
        onDelete: useCallback(() => {
            console.log('[StudentDashboard] Assignment DELETE — re-fetching');
            fetchAssignments();
        }, [fetchAssignments])
    });

    // 🔴 Real-time: re-fetch submissions when evaluated/updated
    useRealtime('submissions', {
        onInsert: useCallback(() => fetchSubmissions(), [fetchSubmissions]),
        onUpdate: useCallback(() => {
            console.log('[StudentDashboard] Submission UPDATE — re-fetching');
            fetchSubmissions();
        }, [fetchSubmissions]),
        filter: user?.id ? `student_id=eq.${user.id}` : undefined,
        enabled: !!user?.id
    });

    // Filter assignments based on student's year and section
    const relevantAssignments = assignments.filter(a => {
        const matchesYear = !a.target_year || a.target_year === user?.year_of_study;
        const matchesSection = !a.target_section || a.target_section === user?.section;
        return matchesYear && matchesSection;
    });

    const pending = relevantAssignments.filter(a => !submissions.find(s => s.assignment_id === a.id));
    const evaluated = submissions.filter(s => s.status === 'evaluated');

    const stats = [
        { icon: FiFileText, label: 'Available', value: relevantAssignments.length, color: 'var(--primary)', bg: 'rgba(108,99,255,0.12)' },
        { icon: FiClock, label: 'Pending', value: pending.length, color: 'var(--warning)', bg: 'rgba(255,184,0,0.12)' },
        { icon: FiCheckSquare, label: 'Submitted', value: submissions.length, color: 'var(--success)', bg: 'rgba(0,214,143,0.12)' },
        { icon: FiAward, label: 'Evaluated', value: evaluated.length, color: 'var(--info)', bg: 'rgba(0,180,216,0.12)' },
    ];

    return (
        <div ref={pageRef}>
            <div className="page-header animate-section">
                <div className="flex justify-between items-end">
                    <div>
                        <h1><span className="gradient-text">Welcome, {user?.full_name?.split(' ')[0]}</span> 👋</h1>
                        <p>Class: <strong>{user?.year_of_study} Year</strong> {user?.section ? `| Section: ${user?.section}` : ''}</p>
                    </div>
                    {user?.register_number && (
                        <div className="text-right pb-1">
                            <span className="text-xs text-slate-500 block">Register Number</span>
                            <span className="font-bold text-primary-light">{user.register_number}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="stats-grid animate-section" style={{ marginBottom: 32 }}>
                {stats.map((s, i) => (
                    <div key={i} className="glass-card stat-card reveal-item">
                        <div className="stat-icon" style={{ background: s.bg, color: s.color }}>
                            <s.icon size={22} />
                        </div>
                        <div className="stat-value" style={{ color: s.color }}>
                            <AnimatedCounter value={loading ? 0 : s.value} />
                        </div>
                        <div className="stat-label">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Recent Assignments for My Class */}
            <div className="animate-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.2rem' }}>Assignments for My Class</h2>
                    <Link to="/student/assignments" style={{ color: 'var(--primary-light)', textDecoration: 'none', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                        View All <FiArrowRight size={14} />
                    </Link>
                </div>

                {loading ? (
                    <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}>
                        <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
                    </div>
                ) : relevantAssignments.length === 0 ? (
                    <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}>
                        <FiFileText size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
                        <p style={{ color: 'var(--text-muted)' }}>No assignments available for your class yet</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: 12 }}>
                        {relevantAssignments.slice(0, 5).map((a) => {
                            const submitted = submissions.find(s => s.assignment_id === a.id);
                            const isLate = new Date() > new Date(a.deadline);
                            return (
                                <Link to={`/student/assignment/${a.id}`} key={a.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <div className="glass-card reveal-item" style={{ padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                            <div style={{
                                                width: 40, height: 40, borderRadius: 10,
                                                background: a.type === 'mcq' ? 'rgba(0,212,170,0.12)' : 'rgba(0,180,216,0.12)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: a.type === 'mcq' ? 'var(--accent)' : 'var(--info)'
                                            }}>
                                                {a.type === 'mcq' ? <FiCheckSquare size={18} /> : <FiFileText size={18} />}
                                            </div>
                                            <div>
                                                <h3 style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 3 }}>{a.title}</h3>
                                                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                                    <span className={`badge badge-${a.type}`}>{a.type.toUpperCase()}</span>
                                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                                                        Due: {new Date(a.deadline).toLocaleDateString()}
                                                    </span>
                                                    {a.target_section && (
                                                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">Sec {a.target_section} Only</span>
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
        </div>
    );
}
