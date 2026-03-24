import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { usePageEntrance, AnimatedCounter } from '../animations/GsapAnimations';
import { useRealtime } from '../hooks/useRealtime';
import api from '../lib/api';
import {
    FiBarChart2, FiUsers, FiFileText, FiCheckSquare, FiTrendingUp,
    FiPlus, FiTrash2, FiSave, FiLayers, FiArrowRight
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import gsap from 'gsap';

export default function AdminReports() {
    const [stats, setStats] = useState(null);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState('1st');
    const [newClass, setNewClass] = useState({ section: '', total_boys: 0, total_girls: 0 });
    const classesListRef = useRef(null);
    const pageRef = usePageEntrance();

    const fetchData = useCallback(async () => {
        try {
            const [sRes, cRes] = await Promise.all([
                api.get('/admin/stats'),
                api.get('/admin/classes')
            ]);
            setStats(sRes.data.stats);
            setClasses(cRes.data.classes || []);
        } catch (err) {
            toast.error('Failed to load reports');
        } finally { setLoading(false); }
    }, []);

    useEffect(() => {
        fetchData();
        
        // Refresh every 3 seconds for live updates
        const interval = setInterval(fetchData, 3000);
        return () => clearInterval(interval);
    }, [fetchData]);

    useRealtime('assignments', { onInsert: fetchData, onUpdate: fetchData, onDelete: fetchData, enabled: true });
    useRealtime('submissions', { onInsert: fetchData, onUpdate: fetchData, enabled: true });
    useRealtime('users', { onInsert: fetchData, onUpdate: fetchData, onDelete: fetchData, enabled: true });

    useEffect(() => {
        if (classesListRef.current) {
            gsap.fromTo(classesListRef.current.children,
                { y: 20, opacity: 0 },
                { y: 0, opacity: 1, stagger: 0.08, duration: 0.4, ease: 'power2.out', overwrite: true }
            );
        }
    }, [selectedYear, classes]);

    const handleSaveClass = async (e) => {
        e.preventDefault();
        if (!newClass.section) return toast.error('Section name is required');
        try {
            const res = await api.post('/admin/classes', { year: selectedYear, ...newClass });
            const updated = classes.filter(c => !(c.year === selectedYear && c.section === res.data.classMeta.section));
            setClasses([...updated, res.data.classMeta]);
            setNewClass({ section: '', total_boys: 0, total_girls: 0 });
            toast.success('Class saved');
            fetchData();
        } catch (err) {
            toast.error('Failed to save class');
        }
    };

    const handleDeleteClass = async (id) => {
        if (!confirm('Delete this class section?')) return;
        try {
            await api.delete('/admin/classes/' + id);
            setClasses(classes.filter(c => c.id !== id));
            toast.success('Class removed');
        } catch (err) {
            toast.error('Failed to delete class');
        }
    };

    const years = ['1st', '2nd', '3rd', 'Final'];
    const currentYearClasses = classes.filter(c => c.year === selectedYear);

    const completionRate = stats ? Math.round(((stats.evaluated_submissions || 0) / (stats.total_submissions || 1)) * 100) : 0;
    const lateRate = stats ? Math.round(((stats.late_submissions || 0) / (stats.total_submissions || 1)) * 100) : 0;

    const cardColors = [
        { bg: 'linear-gradient(135deg,#7C3AED,#A78BFA)', light: 'rgba(124,58,237,0.08)' },
        { bg: 'linear-gradient(135deg,#3B82F6,#93C5FD)', light: 'rgba(59,130,246,0.08)' },
        { bg: 'linear-gradient(135deg,#06B6D4,#67E8F9)', light: 'rgba(6,182,212,0.08)' },
        { bg: 'linear-gradient(135deg,#10B981,#6EE7B7)', light: 'rgba(16,185,129,0.08)' },
        { bg: 'linear-gradient(135deg,#F59E0B,#FCD34D)', light: 'rgba(245,158,11,0.08)' },
        { bg: 'linear-gradient(135deg,#EF4444,#FCA5A5)', light: 'rgba(239,68,68,0.08)' },
    ];

    return (
        <div ref={pageRef}>
            <div className="page-header animate-section">
                <h1><span className="gradient-text">Reports & Analytics</span></h1>
                <p>Platform performance, class management, and drill-down reports</p>
            </div>

            {/* Quick Stats */}
            <div className="stats-grid animate-section" style={{ marginBottom: 28 }}>
                {[
                    { icon: FiTrendingUp, label: 'Evaluation Rate', value: completionRate, suffix: '%', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
                    { icon: FiBarChart2, label: 'Late Rate', value: lateRate, suffix: '%', color: '#FF4D6A', bg: 'rgba(255,77,106,0.12)' },
                    { icon: FiUsers, label: 'Students', value: stats?.students || 0, color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
                    { icon: FiUsers, label: 'Teachers', value: stats?.teachers || 0, color: '#7C3AED', bg: 'rgba(124,58,237,0.12)' },
                ].map((s, i) => (
                    <div key={i} className="glass-card stat-card reveal-item">
                        <div className="stat-icon" style={{ background: s.bg, color: s.color }}><s.icon size={22} /></div>
                        <div className="stat-value" style={{ color: s.color }}>
                            <AnimatedCounter value={loading ? 0 : s.value} />{s.suffix || ''}
                        </div>
                        <div className="stat-label">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Breakdown cards */}
            <div className="animate-section" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 28 }}>
                <div className="glass-card" style={{ padding: 24 }}>
                    <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.05rem', marginBottom: 18 }}>User Distribution</h3>
                    {[
                        { label: 'Students', value: stats?.students || 0, total: stats?.total_users || 1, color: '#3B82F6' },
                        { label: 'Teachers', value: stats?.teachers || 0, total: stats?.total_users || 1, color: '#7C3AED' },
                        { label: 'Admins', value: stats?.admins || 0, total: stats?.total_users || 1, color: '#F59E0B' },
                    ].map((item, i) => (
                        <div key={i} style={{ marginBottom: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.85rem' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                                <span style={{ fontWeight: 600, color: item.color }}>{item.value}</span>
                            </div>
                            <div style={{ height: 7, borderRadius: 4, background: 'rgba(124,58,237,0.06)', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: Math.min((item.value / item.total) * 100, 100) + '%', borderRadius: 4, background: item.color, transition: 'width 1.5s ease-out' }} />
                            </div>
                        </div>
                    ))}
                </div>
                <div className="glass-card" style={{ padding: 24 }}>
                    <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.05rem', marginBottom: 18 }}>Submission Funnel</h3>
                    {[
                        { label: 'Total Submissions', value: stats?.total_submissions || 0, color: '#7C3AED' },
                        { label: 'Pending', value: stats?.pending_submissions || 0, color: '#FFB800' },
                        { label: 'Evaluated', value: stats?.evaluated_submissions || 0, color: '#00D68F' },
                        { label: 'Late', value: stats?.late_submissions || 0, color: '#FF4D6A' },
                    ].map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < 3 ? '1px solid rgba(124,58,237,0.06)' : 'none' }}>
                            <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{item.label}</span>
                            <span style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.1rem', color: item.color }}>
                                <AnimatedCounter value={loading ? 0 : item.value} />
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Class-wise Reports */}
            <div className="animate-section" style={{ marginBottom: 28 }}>
                <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.15rem', marginBottom: 16 }}>
                    <FiLayers style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--primary)' }} />
                    Class-wise Reports
                </h2>
                {classes.length === 0 ? (
                    <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}>
                        <p style={{ color: 'var(--text-muted)' }}>No classes yet. Add classes below.</p>
                    </div>
                ) : (
                    <div className="admin-class-grid">
                        {classes.map((cls, idx) => {
                            const color = cardColors[idx % cardColors.length];
                            return (
                                <Link key={cls.id} to={'/admin/class/' + encodeURIComponent(cls.year) + '/' + encodeURIComponent(cls.section)}
                                    className="glass-card reveal-item class-card-hover"
                                    style={{ cursor: 'pointer', overflow: 'hidden', padding: 0, textDecoration: 'none', color: 'inherit' }}>
                                    <div style={{ background: color.bg, padding: '16px 20px 12px', color: '#fff', position: 'relative' }}>
                                        <div style={{ position: 'absolute', top: -15, right: -15, width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                                        <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1rem', position: 'relative', zIndex: 1 }}>
                                            {cls.year} Year — Sec {cls.section}
                                        </h3>
                                    </div>
                                    <div style={{ padding: '14px 20px 16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: '0.85rem' }}>
                                            <span>{cls.actual_students} students</span>
                                            <span style={{ color: 'var(--text-muted)' }}>{cls.total_assignments} tests</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: color.light, borderRadius: 6, fontSize: '0.8rem' }}>
                                            <span>Avg: {cls.avg_score}%</span>
                                            <span style={{ color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                                                View Report <FiArrowRight size={12} />
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Class Setup Section */}
            <div className="animate-section">
                <div className="glass-card" style={{ padding: 28 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                        <div>
                            <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <FiLayers style={{ color: 'var(--primary)' }} /> Class Setup
                            </h3>
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>Manage years, sections and student capacity</p>
                        </div>
                        <div style={{ display: 'flex', gap: 6, padding: 4, background: 'rgba(124,58,237,0.05)', borderRadius: 10, border: '1px solid var(--border-light)' }}>
                            {years.map(y => (
                                <button key={y} onClick={() => setSelectedYear(y)}
                                    style={{
                                        padding: '8px 16px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600, border: 'none', cursor: 'pointer',
                                        background: selectedYear === y ? 'var(--primary)' : 'transparent',
                                        color: selectedYear === y ? '#fff' : 'var(--text-muted)',
                                        transition: 'all 0.2s'
                                    }}>
                                    {y}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
                        {/* Add Section Form */}
                        <form onSubmit={handleSaveClass} style={{ padding: 20, background: 'rgba(124,58,237,0.03)', borderRadius: 14, border: '1px solid var(--border-light)' }}>
                            <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 }}>Add / Update Section</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                                <div>
                                    <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>Section Name</label>
                                    <input type="text" className="input-field" placeholder="E.g. A, B, CS1" value={newClass.section}
                                        onChange={e => setNewClass({ ...newClass, section: e.target.value.toUpperCase() })} style={{ width: '100%' }} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                    <div>
                                        <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>Total Boys</label>
                                        <input type="number" className="input-field" value={newClass.total_boys}
                                            onChange={e => setNewClass({ ...newClass, total_boys: parseInt(e.target.value) || 0 })} style={{ width: '100%' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>Total Girls</label>
                                        <input type="number" className="input-field" value={newClass.total_girls}
                                            onChange={e => setNewClass({ ...newClass, total_girls: parseInt(e.target.value) || 0 })} style={{ width: '100%' }} />
                                    </div>
                                </div>
                            </div>
                            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                <FiSave size={14} /> Save Section
                            </button>
                        </form>

                        {/* Sections List */}
                        <div style={{ padding: 20, background: 'rgba(124,58,237,0.03)', borderRadius: 14, border: '1px solid var(--border-light)' }}>
                            <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 }}>
                                Sections in {selectedYear} Year
                            </h4>
                            <div ref={classesListRef} style={{ maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {currentYearClasses.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)', fontStyle: 'italic' }}>No sections added yet</div>
                                ) : currentYearClasses.map(c => (
                                    <div key={c.id} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px',
                                        borderRadius: 10, background: '#fff', border: '1px solid var(--border-light)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(124,58,237,0.1)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 700 }}>
                                                {c.section}
                                            </div>
                                            <div>
                                                <p style={{ fontWeight: 600, fontSize: '0.88rem' }}>Total: {c.total_boys + c.total_girls}</p>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Boys {c.total_boys} | Girls {c.total_girls}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDeleteClass(c.id)} style={{
                                            background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 6, borderRadius: 6
                                        }}><FiTrash2 size={15} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
