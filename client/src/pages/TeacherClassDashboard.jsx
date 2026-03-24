import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { usePageEntrance, AnimatedCounter } from '../animations/GsapAnimations';
import { useRealtime } from '../hooks/useRealtime';
import api from '../lib/api';
import {
    FiUsers, FiArrowLeft, FiBarChart2, FiFileText, FiCheckSquare,
    FiClock, FiPlusCircle, FiArrowRight, FiTrendingUp, FiPercent,
    FiRefreshCw, FiUser
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function TeacherClassDashboard() {
    const { year, section } = useParams();
    const navigate = useNavigate();
    const [analytics, setAnalytics] = useState(null);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reassignModal, setReassignModal] = useState(null);
    const [reassignLoading, setReassignLoading] = useState(false);
    const pageRef = usePageEntrance();

    const fetchData = async () => {
        try {
            const [analyticsRes, activitiesRes] = await Promise.all([
                api.get(`/teacher/classes/${encodeURIComponent(year)}/${encodeURIComponent(section)}/analytics`),
                api.get(`/teacher/classes/${encodeURIComponent(year)}/${encodeURIComponent(section)}/activities`)
            ]);
            setAnalytics(analyticsRes.data.analytics);
            setActivities(activitiesRes.data.activities || []);
        } catch (err) {
            toast.error('Failed to load class data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [year, section]);

    // Realtime: submissions for this class
    useRealtime('submissions', {
        onInsert: useCallback(() => {
            toast('New submission!', { icon: '📤', style: { background: '#fff', color: '#1E1B3A', border: '1px solid #E5E0F6', borderRadius: 12 }, duration: 3000 });
            fetchData(); // Refresh analytics on new submission
        }, [year, section])
    });

    const handleReassign = async (assignmentId) => {
        setReassignLoading(true);
        try {
            await api.post('/teacher/reassign', {
                assignment_id: assignmentId,
                year,
                section
            });
            toast.success('Assignment reassigned for entire class');
            setReassignModal(null);
            fetchData();
        } catch (err) {
            toast.error('Failed to reassign');
        } finally {
            setReassignLoading(false);
        }
    };

    if (loading) {
        return (
            <div ref={pageRef}>
                <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)' }}>Loading class dashboard...</p>
                </div>
            </div>
        );
    }

    const a = analytics || {};

    return (
        <div ref={pageRef}>
            {/* Header */}
            <div className="page-header animate-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <button
                            onClick={() => navigate('/teacher')}
                            className="btn-secondary"
                            style={{ padding: '10px 12px', display: 'flex', alignItems: 'center' }}
                        >
                            <FiArrowLeft size={18} />
                        </button>
                        <div>
                            <h1><span className="gradient-text">{year} Year - Section {section}</span></h1>
                            <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>Class Dashboard & Analytics</p>
                        </div>
                    </div>
                    <Link
                        to={`/teacher/create?year=${encodeURIComponent(year)}&section=${encodeURIComponent(section)}`}
                        className="btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}
                    >
                        <FiPlusCircle size={18} />
                        <span>Assign Activity</span>
                    </Link>
                </div>
            </div>

            {/* ── Section A: Summary Cards ── */}
            <div className="animate-section" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 28 }}>
                {/* Total Students */}
                <div className="glass-card" style={{ padding: '20px 22px', textAlign: 'center' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(124,58,237,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: 'var(--primary)' }}>
                        <FiUsers size={20} />
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '1.5rem', fontFamily: 'Outfit', color: 'var(--primary)' }}>
                        <AnimatedCounter value={a.total_students || 0} />
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Students</div>
                </div>

                {/* Boys - Clickable */}
                <div
                    className="glass-card class-card-hover"
                    style={{ padding: '20px 22px', textAlign: 'center', cursor: 'pointer' }}
                    onClick={() => navigate(`/teacher/class/${encodeURIComponent(year)}/${encodeURIComponent(section)}/boys`)}
                >
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: '#3B82F6' }}>
                        <FiUser size={20} />
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '1.5rem', fontFamily: 'Outfit', color: '#3B82F6' }}>
                        <AnimatedCounter value={a.boys || 0} />
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Boys</div>
                    <div style={{ fontSize: '0.72rem', color: '#3B82F6', marginTop: 4, fontWeight: 500 }}>View List →</div>
                </div>

                {/* Girls - Clickable */}
                <div
                    className="glass-card class-card-hover"
                    style={{ padding: '20px 22px', textAlign: 'center', cursor: 'pointer' }}
                    onClick={() => navigate(`/teacher/class/${encodeURIComponent(year)}/${encodeURIComponent(section)}/girls`)}
                >
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(236,72,153,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: '#EC4899' }}>
                        <FiUser size={20} />
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '1.5rem', fontFamily: 'Outfit', color: '#EC4899' }}>
                        <AnimatedCounter value={a.girls || 0} />
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Girls</div>
                    <div style={{ fontSize: '0.72rem', color: '#EC4899', marginTop: 4, fontWeight: 500 }}>View List →</div>
                </div>

                {/* Assignments */}
                <div className="glass-card" style={{ padding: '20px 22px', textAlign: 'center' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: '#10B981' }}>
                        <FiFileText size={20} />
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '1.5rem', fontFamily: 'Outfit', color: '#10B981' }}>
                        <AnimatedCounter value={a.total_assignments || 0} />
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Assignments</div>
                </div>

                {/* Active */}
                <div className="glass-card" style={{ padding: '20px 22px', textAlign: 'center' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: '#F59E0B' }}>
                        <FiClock size={20} />
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '1.5rem', fontFamily: 'Outfit', color: '#F59E0B' }}>
                        <AnimatedCounter value={a.active_assignments || 0} />
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Active</div>
                </div>
            </div>

            {/* ── Section B: Analytics ── */}
            <div className="animate-section" style={{ marginBottom: 28 }}>
                <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.15rem', marginBottom: 16 }}>Performance Analytics</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                    {/* Avg Score */}
                    <div className="glass-card" style={{ padding: '22px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(124,58,237,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                <FiTrendingUp size={18} />
                            </div>
                            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Avg Score</span>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '2rem', fontFamily: 'Outfit', color: 'var(--primary)' }}>
                            {a.avg_score || 0}%
                        </div>
                        <div style={{ marginTop: 10, height: 6, borderRadius: 3, background: 'rgba(124,58,237,0.1)' }}>
                            <div style={{ height: '100%', borderRadius: 3, background: 'var(--primary)', width: `${a.avg_score || 0}%`, transition: 'width 1s ease' }} />
                        </div>
                    </div>

                    {/* Completion Rate */}
                    <div className="glass-card" style={{ padding: '22px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
                                <FiPercent size={18} />
                            </div>
                            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Completion Rate</span>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '2rem', fontFamily: 'Outfit', color: '#10B981' }}>
                            {a.completion_rate || 0}%
                        </div>
                        <div style={{ marginTop: 10, height: 6, borderRadius: 3, background: 'rgba(16,185,129,0.1)' }}>
                            <div style={{ height: '100%', borderRadius: 3, background: '#10B981', width: `${a.completion_rate || 0}%`, transition: 'width 1s ease' }} />
                        </div>
                    </div>

                    {/* Late Rate */}
                    <div className="glass-card" style={{ padding: '22px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}>
                                <FiClock size={18} />
                            </div>
                            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Late Rate</span>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '2rem', fontFamily: 'Outfit', color: '#EF4444' }}>
                            {a.late_rate || 0}%
                        </div>
                        <div style={{ marginTop: 10, height: 6, borderRadius: 3, background: 'rgba(239,68,68,0.1)' }}>
                            <div style={{ height: '100%', borderRadius: 3, background: '#EF4444', width: `${a.late_rate || 0}%`, transition: 'width 1s ease' }} />
                        </div>
                    </div>

                    {/* Submissions Stats */}
                    <div className="glass-card" style={{ padding: '22px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6' }}>
                                <FiCheckSquare size={18} />
                            </div>
                            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Submissions</span>
                        </div>
                        <div style={{ display: 'flex', gap: 20, marginTop: 8 }}>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '1.4rem', fontFamily: 'Outfit', color: '#3B82F6' }}>{a.total_submissions || 0}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total</div>
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '1.4rem', fontFamily: 'Outfit', color: '#10B981' }}>{a.evaluated_count || 0}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Evaluated</div>
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '1.4rem', fontFamily: 'Outfit', color: '#F59E0B' }}>{a.pending_count || 0}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pending</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Section C: Activities / Assignments list ── */}
            <div className="animate-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.15rem' }}>Class Activities</h2>
                    <Link
                        to={`/teacher/create?year=${encodeURIComponent(year)}&section=${encodeURIComponent(section)}`}
                        style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                        <FiPlusCircle size={14} /> New Activity
                    </Link>
                </div>

                {activities.length === 0 ? (
                    <div className="glass-card" style={{ padding: 50, textAlign: 'center' }}>
                        <FiFileText size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
                        <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>No activities assigned to this class</p>
                        <Link
                            to={`/teacher/create?year=${encodeURIComponent(year)}&section=${encodeURIComponent(section)}`}
                            className="btn-primary" style={{ textDecoration: 'none' }}
                        >
                            <span>Create First Activity</span>
                        </Link>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: 12 }}>
                        {activities.map(act => {
                            const isActive = new Date(act.deadline) > new Date();
                            const stats = a.assignment_stats?.find(s => s.id === act.id);
                            return (
                                <div key={act.id} className="glass-card reveal-item" style={{ padding: '18px 22px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
                                            <div style={{
                                                width: 42, height: 42, borderRadius: 10,
                                                background: act.type === 'mcq' ? 'rgba(0,212,170,0.12)' : 'rgba(59,130,246,0.12)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: act.type === 'mcq' ? '#10B981' : '#3B82F6', flexShrink: 0
                                            }}>
                                                {act.type === 'mcq' ? <FiCheckSquare size={18} /> : <FiFileText size={18} />}
                                            </div>
                                            <div>
                                                <h3 style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 4 }}>{act.title}</h3>
                                                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                                    <span className={`badge badge-${act.type}`}>{act.type.toUpperCase()}</span>
                                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                                        {act.total_marks} marks
                                                    </span>
                                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                                        Due: {new Date(act.deadline).toLocaleDateString()}
                                                    </span>
                                                    <span className={`badge ${isActive ? 'badge-approved' : 'badge-late'}`} style={{ fontSize: '0.72rem' }}>
                                                        {isActive ? 'Active' : 'Closed'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Stats + Actions */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                                            {stats && (
                                                <div style={{ display: 'flex', gap: 16, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                                    <span>{stats.submissions_count}/{stats.expected} submitted</span>
                                                    <span style={{ color: '#10B981', fontWeight: 600 }}>{stats.completion}%</span>
                                                </div>
                                            )}
                                            <Link
                                                to={`/teacher/submissions/${act.id}`}
                                                className="btn-secondary"
                                                style={{ padding: '6px 14px', fontSize: '0.8rem', textDecoration: 'none', whiteSpace: 'nowrap' }}
                                            >
                                                View Submissions
                                            </Link>
                                            <button
                                                onClick={() => setReassignModal(act)}
                                                className="btn-secondary"
                                                style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4, color: '#F59E0B' }}
                                                title="Reassign to entire class"
                                            >
                                                <FiRefreshCw size={14} /> Reassign
                                            </button>
                                        </div>
                                    </div>

                                    {/* Progress bar */}
                                    {stats && (
                                        <div style={{ marginTop: 12, height: 4, borderRadius: 2, background: 'rgba(124,58,237,0.08)' }}>
                                            <div style={{
                                                height: '100%', borderRadius: 2,
                                                background: stats.completion >= 80 ? '#10B981' : stats.completion >= 50 ? '#F59E0B' : '#EF4444',
                                                width: `${stats.completion}%`, transition: 'width 0.8s ease'
                                            }} />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Reassign Modal ── */}
            {reassignModal && (
                <div className="modal-overlay" onClick={() => setReassignModal(null)}>
                    <div className="glass" style={{ maxWidth: 450, width: '90%', padding: 32 }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, marginBottom: 8 }}>
                            <span className="gradient-text">Reassign Activity</span>
                        </h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 8 }}>
                            <strong>{reassignModal.title}</strong>
                        </p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 24, lineHeight: 1.5 }}>
                            This will reset all submissions for <strong>{year} Year Section {section}</strong> students,
                            allowing them to resubmit. This action cannot be undone.
                        </p>

                        <div style={{ display: 'flex', gap: 12 }}>
                            <button
                                onClick={() => handleReassign(reassignModal.id)}
                                className="btn-primary"
                                style={{ flex: 1, background: '#F59E0B' }}
                                disabled={reassignLoading}
                            >
                                <span>{reassignLoading ? 'Reassigning...' : 'Reassign to Entire Class'}</span>
                            </button>
                            <button onClick={() => setReassignModal(null)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
