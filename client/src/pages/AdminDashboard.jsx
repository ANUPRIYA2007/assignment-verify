import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { usePageEntrance, AnimatedCounter } from '../animations/GsapAnimations';
import { useRealtime } from '../hooks/useRealtime';
import api from '../lib/api';
import {
    FiUsers, FiFileText, FiCheckSquare, FiClock, FiTrendingUp,
    FiLayers, FiArrowRight, FiBookOpen, FiAward, FiAlertCircle
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const pageRef = usePageEntrance();

    const fetchData = useCallback(async () => {
        try {
            const [sRes, cRes] = await Promise.all([
                api.get('/admin/stats'),
                api.get('/admin/classes')
            ]);
            setStats(sRes.data.stats);
            setClasses(cRes.data.classes || []);
            console.log('✅ Admin dashboard stats updated:', sRes.data.stats);
        } catch (err) {
            console.error('❌ Dashboard fetch error:', err);
            toast.error('Failed to load dashboard');
        } finally { setLoading(false); }
    }, []);

    useEffect(() => {
        // Fetch data on mount
        fetchData();
        
        // Also refresh every 3 seconds to ensure latest data
        const interval = setInterval(fetchData, 3000);
        
        return () => clearInterval(interval);
    }, [fetchData]);

    // Real-time subscriptions for instant dashboard updates
    useRealtime('users', { onInsert: fetchData, onUpdate: fetchData, onDelete: fetchData, enabled: true });
    useRealtime('assignments', { onInsert: fetchData, onUpdate: fetchData, onDelete: fetchData, enabled: true });
    useRealtime('submissions', { onInsert: fetchData, onUpdate: fetchData, onDelete: fetchData, enabled: true });
    useRealtime('classes_meta', { onInsert: fetchData, onUpdate: fetchData, onDelete: fetchData, enabled: true });
    useRealtime('teacher_assignments', { onInsert: fetchData, onUpdate: fetchData, onDelete: fetchData, enabled: true });

    const cardColors = [
        { bg: 'linear-gradient(135deg,#7C3AED,#A78BFA)', light: 'rgba(124,58,237,0.08)' },
        { bg: 'linear-gradient(135deg,#3B82F6,#93C5FD)', light: 'rgba(59,130,246,0.08)' },
        { bg: 'linear-gradient(135deg,#06B6D4,#67E8F9)', light: 'rgba(6,182,212,0.08)' },
        { bg: 'linear-gradient(135deg,#10B981,#6EE7B7)', light: 'rgba(16,185,129,0.08)' },
        { bg: 'linear-gradient(135deg,#F59E0B,#FCD34D)', light: 'rgba(245,158,11,0.08)' },
        { bg: 'linear-gradient(135deg,#EF4444,#FCA5A5)', light: 'rgba(239,68,68,0.08)' },
    ];

    const statCards = [
        { icon: FiUsers, label: 'Total Users', value: stats?.total_users || 0, color: '#7C3AED', bg: 'rgba(124,58,237,0.12)' },
        { icon: FiUsers, label: 'Students', value: stats?.students || 0, color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
        { icon: FiUsers, label: 'Teachers', value: stats?.teachers || 0, color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
        { icon: FiLayers, label: 'Classes', value: stats?.total_classes || 0, color: '#06B6D4', bg: 'rgba(6,182,212,0.12)' },
        { icon: FiFileText, label: 'Assignments', value: stats?.total_assignments || 0, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
        { icon: FiCheckSquare, label: 'Submissions', value: stats?.total_submissions || 0, color: '#00D68F', bg: 'rgba(0,214,143,0.12)' },
        { icon: FiClock, label: 'Pending', value: stats?.pending_submissions || 0, color: '#FFB800', bg: 'rgba(255,184,0,0.12)' },
        { icon: FiAlertCircle, label: 'Late', value: stats?.late_submissions || 0, color: '#FF4D6A', bg: 'rgba(255,77,106,0.12)' },
    ];

    return (
        <div ref={pageRef}>
            <div className="page-header animate-section">
                <h1><span className="gradient-text">Admin Dashboard</span> ⚙️</h1>
                <p>Full system control — real-time overview</p>
            </div>

            <div className="stats-grid animate-section" style={{ marginBottom: 28 }}>
                {statCards.map((s, i) => (
                    <div key={i} className="glass-card stat-card reveal-item">
                        <div className="stat-icon" style={{ background: s.bg, color: s.color }}><s.icon size={22} /></div>
                        <div className="stat-value" style={{ color: s.color }}><AnimatedCounter value={loading ? 0 : s.value} /></div>
                        <div className="stat-label">{s.label}</div>
                    </div>
                ))}
            </div>

            <div className="animate-section" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 28 }}>
                {[
                    { to: '/admin/users', icon: FiUsers, label: 'Manage Users', color: '#7C3AED' },
                    { to: '/admin/teachers', icon: FiBookOpen, label: 'Teachers', color: '#10B981' },
                    { to: '/admin/assignments', icon: FiFileText, label: 'All Tests', color: '#3B82F6' },
                    { to: '/admin/leaderboard', icon: FiAward, label: 'Leaderboard', color: '#F59E0B' },
                    { to: '/admin/reports', icon: FiTrendingUp, label: 'Reports', color: '#06B6D4' },
                ].map((link, i) => (
                    <Link key={i} to={link.to} className="glass-card reveal-item" style={{
                        padding: '18px 20px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12,
                        cursor: 'pointer', transition: 'all 0.3s', color: 'inherit'
                    }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: link.color + '15',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: link.color }}>
                            <link.icon size={18} />
                        </div>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{link.label}</span>
                        <FiArrowRight size={14} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
                    </Link>
                ))}
            </div>

            <div className="animate-section" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.2rem' }}>Classes Overview</h2>
                    <Link to="/admin/reports" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                        All Reports <FiArrowRight size={14} />
                    </Link>
                </div>
            </div>

            {loading ? (
                <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
                </div>
            ) : classes.length === 0 ? (
                <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
                    <FiLayers size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
                    <p style={{ color: 'var(--text-muted)' }}>No classes configured yet</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: 4 }}>Go to Reports to add classes</p>
                </div>
            ) : (
                <div className="admin-class-grid animate-section">
                    {classes.map((cls, idx) => {
                        const color = cardColors[idx % cardColors.length];
                        return (
                            <Link key={cls.id} to={'/admin/class/' + encodeURIComponent(cls.year) + '/' + encodeURIComponent(cls.section)}
                                className="glass-card reveal-item class-card-hover"
                                style={{ cursor: 'pointer', overflow: 'hidden', padding: 0, textDecoration: 'none', color: 'inherit' }}>
                                <div style={{ background: color.bg, padding: '20px 22px 16px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
                                    <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                                    <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.1rem', marginBottom: 2, position: 'relative', zIndex: 1 }}>
                                        {cls.year} Year — Sec {cls.section}
                                    </h3>
                                </div>
                                <div style={{ padding: '16px 22px 20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                                        <div style={{ textAlign: 'center', flex: 1 }}>
                                            <div style={{ fontWeight: 700, fontSize: '1.2rem', fontFamily: 'Outfit' }}>{cls.actual_students}</div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Students</div>
                                        </div>
                                        <div style={{ width: 1, background: 'var(--border-light)' }} />
                                        <div style={{ textAlign: 'center', flex: 1 }}>
                                            <div style={{ fontWeight: 700, fontSize: '1.2rem', fontFamily: 'Outfit', color: '#3B82F6' }}>{cls.actual_boys}</div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Boys</div>
                                        </div>
                                        <div style={{ width: 1, background: 'var(--border-light)' }} />
                                        <div style={{ textAlign: 'center', flex: 1 }}>
                                            <div style={{ fontWeight: 700, fontSize: '1.2rem', fontFamily: 'Outfit', color: '#EC4899' }}>{cls.actual_girls}</div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Girls</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: color.light, borderRadius: 8, fontSize: '0.8rem' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>{cls.total_assignments} Tests</span>
                                        <span style={{ color: 'var(--text-secondary)' }}>Avg: {cls.avg_score}%</span>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}

            <div className="animate-section" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginTop: 28 }}>
                <div className="glass-card" style={{ padding: 24 }}>
                    <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.05rem', marginBottom: 20 }}>Assignment Types</h3>
                    <div style={{ display: 'flex', gap: 16 }}>
                        <div style={{ flex: 1, padding: 20, borderRadius: 14, background: 'rgba(59,130,246,0.08)', textAlign: 'center' }}>
                            <FiFileText size={22} style={{ color: '#3B82F6', margin: '0 auto 8px' }} />
                            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#3B82F6', fontFamily: 'Outfit' }}><AnimatedCounter value={loading ? 0 : (stats?.file_assignments || 0)} /></p>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>File Upload</p>
                        </div>
                        <div style={{ flex: 1, padding: 20, borderRadius: 14, background: 'rgba(16,185,129,0.08)', textAlign: 'center' }}>
                            <FiCheckSquare size={22} style={{ color: '#10B981', margin: '0 auto 8px' }} />
                            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10B981', fontFamily: 'Outfit' }}><AnimatedCounter value={loading ? 0 : (stats?.mcq_assignments || 0)} /></p>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>MCQ Tests</p>
                        </div>
                    </div>
                </div>
                <div className="glass-card" style={{ padding: 24 }}>
                    <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.05rem', marginBottom: 20 }}>Submission Status</h3>
                    {[
                        { label: 'Pending', value: stats?.pending_submissions || 0, total: stats?.total_submissions || 1, color: '#FFB800' },
                        { label: 'Evaluated', value: stats?.evaluated_submissions || 0, total: stats?.total_submissions || 1, color: '#00D68F' },
                        { label: 'Late', value: stats?.late_submissions || 0, total: stats?.total_submissions || 1, color: '#FF4D6A' },
                    ].map((item, i) => (
                        <div key={i} style={{ marginBottom: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 4 }}>
                                <span style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                                <span style={{ color: item.color, fontWeight: 700 }}>{item.value}</span>
                            </div>
                            <div style={{ height: 6, background: 'rgba(124,58,237,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: Math.min((item.value / item.total) * 100, 100) + '%', background: item.color, borderRadius: 4, transition: 'width 1s' }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
