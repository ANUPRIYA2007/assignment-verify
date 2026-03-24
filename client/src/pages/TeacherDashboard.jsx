import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePageEntrance, AnimatedCounter } from '../animations/GsapAnimations';
import { useRealtime } from '../hooks/useRealtime';
import api from '../lib/api';
import { FiUsers, FiPlusCircle, FiArrowRight, FiBookOpen, FiLayers } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function TeacherDashboard() {
    const { user } = useAuth();
    const [classes, setClasses] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const pageRef = usePageEntrance();

    const isAssignmentForClass = (assignment, cls) => (
        assignment.target_year === cls.year && (!assignment.target_section || assignment.target_section === cls.section)
    );

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [classesRes, asgnRes] = await Promise.all([
                    api.get('/teacher/classes'),
                    api.get('/assignments')
                ]);
                setClasses(classesRes.data.classes || []);
                setAssignments(asgnRes.data.assignments || []);
            } catch (err) {
                toast.error('Failed to load dashboard');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Realtime: new submissions
    useRealtime('submissions', {
        onInsert: useCallback(() => {
            toast('New submission received!', {
                icon: '📤',
                style: { background: '#fff', color: '#1E1B3A', border: '1px solid #E5E0F6', borderRadius: 12 },
                duration: 3000
            });
        }, [])
    });

    // Realtime: assignment changes
    useRealtime('assignments', {
        onInsert: useCallback((r) => setAssignments(prev => prev.find(a => a.id === r.id) ? prev : [r, ...prev]), []),
        onUpdate: useCallback((r) => setAssignments(prev => prev.map(a => a.id === r.id ? { ...a, ...r } : a)), []),
        onDelete: useCallback((r) => setAssignments(prev => prev.filter(a => a.id !== r.id)), [])
    });

    const filteredAssignments = assignments.filter(a =>
        classes.some(cls => isAssignmentForClass(a, cls))
    );

    const totalStudents = classes.reduce((s, c) => s + (c.total_boys || 0) + (c.total_girls || 0), 0);

    // Color palette for class cards
    const cardColors = [
        { bg: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)', light: 'rgba(124,58,237,0.08)' },
        { bg: 'linear-gradient(135deg, #3B82F6 0%, #93C5FD 100%)', light: 'rgba(59,130,246,0.08)' },
        { bg: 'linear-gradient(135deg, #06B6D4 0%, #67E8F9 100%)', light: 'rgba(6,182,212,0.08)' },
        { bg: 'linear-gradient(135deg, #10B981 0%, #6EE7B7 100%)', light: 'rgba(16,185,129,0.08)' },
        { bg: 'linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%)', light: 'rgba(245,158,11,0.08)' },
        { bg: 'linear-gradient(135deg, #EF4444 0%, #FCA5A5 100%)', light: 'rgba(239,68,68,0.08)' },
    ];

    return (
        <div ref={pageRef}>
            <div className="page-header animate-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                        <h1><span className="gradient-text">Welcome, {user?.full_name?.split(' ')[0]}</span></h1>
                        <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>Select a class to manage assignments and students</p>
                    </div>
                    <Link to="/teacher/create" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                        <FiPlusCircle size={18} />
                        <span>New Assignment</span>
                    </Link>
                </div>
            </div>

            {/* Quick Stats Bar */}
            <div className="animate-section" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
                <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(124,58,237,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                        <FiLayers size={20} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '1.4rem', color: 'var(--primary)', fontFamily: 'Outfit' }}>
                            <AnimatedCounter value={loading ? 0 : classes.length} />
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Total Classes</div>
                    </div>
                </div>
                <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6' }}>
                        <FiUsers size={20} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '1.4rem', color: '#3B82F6', fontFamily: 'Outfit' }}>
                            <AnimatedCounter value={loading ? 0 : totalStudents} />
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Total Students</div>
                    </div>
                </div>
                <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
                        <FiBookOpen size={20} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '1.4rem', color: '#10B981', fontFamily: 'Outfit' }}>
                            <AnimatedCounter value={loading ? 0 : filteredAssignments.length} />
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Total Assignments</div>
                    </div>
                </div>
            </div>

            {/* Section heading */}
            <div className="animate-section" style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.2rem' }}>Your Classes</h2>
                <Link to="/teacher/assignments" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                    All Assignments <FiArrowRight size={14} />
                </Link>
            </div>

            {/* Class Cards Grid: 3 → 2 → 1 responsive */}
            {loading ? (
                <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)' }}>Loading classes...</p>
                </div>
            ) : classes.length === 0 ? (
                <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
                    <FiUsers size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
                    <p style={{ color: 'var(--text-muted)', marginBottom: 8 }}>No classes found</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Ask admin to set up class metadata</p>
                </div>
            ) : (
                <div className="teacher-class-grid animate-section">
                    {classes.map((cls, idx) => {
                        const color = cardColors[idx % cardColors.length];
                        const total = (cls.total_boys || 0) + (cls.total_girls || 0);
                        const classAssignments = filteredAssignments.filter(a => isAssignmentForClass(a, cls));
                        const activeCount = classAssignments.filter(a => new Date(a.deadline) > new Date()).length;

                        return (
                            <div
                                key={cls.id}
                                className="glass-card reveal-item class-card-hover"
                                style={{ cursor: 'pointer', overflow: 'hidden', padding: 0, transition: 'all 0.3s ease' }}
                                onClick={() => navigate(`/teacher/class/${encodeURIComponent(cls.year)}/${encodeURIComponent(cls.section)}`)}
                            >
                                {/* Card Header with gradient */}
                                <div style={{
                                    background: color.bg,
                                    padding: '22px 24px 18px',
                                    color: '#fff',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                                    <div style={{ position: 'absolute', bottom: -10, right: 30, width: 50, height: 50, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
                                    <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.15rem', marginBottom: 4, position: 'relative', zIndex: 1 }}>
                                        {cls.year} Year
                                    </h3>
                                    <p style={{ fontSize: '0.9rem', opacity: 0.9, position: 'relative', zIndex: 1 }}>
                                        Section {cls.section}
                                    </p>
                                </div>

                                {/* Card Body */}
                                <div style={{ padding: '18px 24px 22px' }}>
                                    {/* Student counts */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                        <div style={{ textAlign: 'center', flex: 1 }}>
                                            <div style={{ fontWeight: 700, fontSize: '1.3rem', fontFamily: 'Outfit', color: 'var(--text-primary)' }}>{total}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Students</div>
                                        </div>
                                        <div style={{ width: 1, background: 'var(--border-light)', margin: '0 12px' }} />
                                        <div style={{ textAlign: 'center', flex: 1 }}>
                                            <div style={{ fontWeight: 700, fontSize: '1.3rem', fontFamily: 'Outfit', color: '#3B82F6' }}>{cls.total_boys || 0}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Boys</div>
                                        </div>
                                        <div style={{ width: 1, background: 'var(--border-light)', margin: '0 12px' }} />
                                        <div style={{ textAlign: 'center', flex: 1 }}>
                                            <div style={{ fontWeight: 700, fontSize: '1.3rem', fontFamily: 'Outfit', color: '#EC4899' }}>{cls.total_girls || 0}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Girls</div>
                                        </div>
                                    </div>

                                    {/* Assignment counts */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: color.light, borderRadius: 10, marginBottom: 14 }}>
                                        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                                            {classAssignments.length} Assignments
                                        </span>
                                        <span style={{ fontSize: '0.78rem', color: activeCount > 0 ? '#10B981' : 'var(--text-muted)', fontWeight: 600 }}>
                                            {activeCount} Active
                                        </span>
                                    </div>

                                    {/* View Class Button */}
                                    <button
                                        className="btn-primary"
                                        style={{
                                            width: '100%', padding: '10px 16px', fontSize: '0.85rem',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/teacher/class/${encodeURIComponent(cls.year)}/${encodeURIComponent(cls.section)}`);
                                        }}
                                    >
                                        <span>View Class</span>
                                        <FiArrowRight size={15} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
