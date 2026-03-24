import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { usePageEntrance, AnimatedCounter } from '../animations/GsapAnimations';
import { useRealtime } from '../hooks/useRealtime';
import api from '../lib/api';
import {
    FiUsers, FiFileText, FiCheckSquare, FiClock, FiArrowLeft,
    FiTrendingUp, FiAlertCircle, FiAward, FiSearch, FiChevronRight
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function AdminClassReport() {
    const { year, section } = useParams();
    const navigate = useNavigate();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('rank');
    const pageRef = usePageEntrance();

    const fetchReport = useCallback(async () => {
        try {
            const res = await api.get(`/admin/classes/${encodeURIComponent(year)}/${encodeURIComponent(section)}/report`);
            setReport(res.data.report);
        } catch (err) {
            toast.error('Failed to load class report');
        } finally { setLoading(false); }
    }, [year, section]);

    useEffect(() => { fetchReport(); }, [fetchReport]);

    useRealtime('submissions', { onInsert: fetchReport, onUpdate: fetchReport });
    useRealtime('users', { onInsert: fetchReport, onUpdate: fetchReport, onDelete: fetchReport });

    const students = (report?.students || []).filter(s =>
        s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        s.register_number?.toLowerCase().includes(search.toLowerCase())
    ).sort((a, b) => {
        if (sortBy === 'rank') return a.rank - b.rank;
        if (sortBy === 'name') return a.full_name.localeCompare(b.full_name);
        if (sortBy === 'score') return b.avg_score - a.avg_score;
        if (sortBy === 'submissions') return b.submission_rate - a.submission_rate;
        return 0;
    });

    const getRankBadge = (rank) => {
        if (rank === 1) return { bg: 'linear-gradient(135deg,#F59E0B,#FCD34D)', text: '#fff', emoji: '🥇' };
        if (rank === 2) return { bg: 'linear-gradient(135deg,#94A3B8,#CBD5E1)', text: '#fff', emoji: '🥈' };
        if (rank === 3) return { bg: 'linear-gradient(135deg,#CD7F32,#DDA15E)', text: '#fff', emoji: '🥉' };
        return null;
    };

    return (
        <div ref={pageRef}>
            <div className="page-header animate-section">
                <button onClick={() => navigate('/admin')} style={{
                    display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
                    color: 'var(--primary)', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600, marginBottom: 12, padding: 0
                }}>
                    <FiArrowLeft size={16} /> Back to Dashboard
                </button>
                <h1><span className="gradient-text">{year} Year — Section {section}</span></h1>
                <p>Class report with student performance breakdown</p>
            </div>

            {loading ? (
                <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)' }}>Loading report...</p>
                </div>
            ) : !report ? (
                <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)' }}>No data found for this class</p>
                </div>
            ) : (
                <>
                    {/* Summary Stats */}
                    <div className="stats-grid animate-section" style={{ marginBottom: 24 }}>
                        {[
                            { icon: FiUsers, label: 'Students', value: report.total_students, color: '#7C3AED', bg: 'rgba(124,58,237,0.12)' },
                            { icon: FiUsers, label: 'Boys', value: report.boys, color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
                            { icon: FiUsers, label: 'Girls', value: report.girls, color: '#EC4899', bg: 'rgba(236,72,153,0.12)' },
                            { icon: FiFileText, label: 'Total Tests', value: report.total_tests, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
                            { icon: FiCheckSquare, label: 'Submissions', value: report.total_submissions, color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
                            { icon: FiTrendingUp, label: 'Avg Score', value: report.avg_class_score, color: '#06B6D4', bg: 'rgba(6,182,212,0.12)', suffix: '%' },
                            { icon: FiAward, label: 'Completion', value: report.completion_rate, color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)', suffix: '%' },
                            { icon: FiAlertCircle, label: 'Late Rate', value: report.late_rate, color: '#FF4D6A', bg: 'rgba(255,77,106,0.12)', suffix: '%' },
                        ].map((s, i) => (
                            <div key={i} className="glass-card stat-card reveal-item">
                                <div className="stat-icon" style={{ background: s.bg, color: s.color }}><s.icon size={22} /></div>
                                <div className="stat-value" style={{ color: s.color }}><AnimatedCounter value={s.value} />{s.suffix || ''}</div>
                                <div className="stat-label">{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Top 3 Podium */}
                    {students.length >= 3 && (
                        <div className="animate-section" style={{ marginBottom: 24 }}>
                            <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.05rem', marginBottom: 16 }}>Top Performers</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                                {students.slice(0, 3).map((s, i) => {
                                    const badge = getRankBadge(s.rank);
                                    return (
                                        <Link key={s.id} to={`/admin/student/${s.id}`} className="glass-card reveal-item" style={{
                                            padding: 0, overflow: 'hidden', textDecoration: 'none', color: 'inherit', cursor: 'pointer'
                                        }}>
                                            <div style={{ background: badge.bg, padding: '14px 18px', color: badge.text, textAlign: 'center' }}>
                                                <span style={{ fontSize: '1.5rem' }}>{badge.emoji}</span>
                                                <p style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.1rem', marginTop: 2 }}>#{s.rank}</p>
                                            </div>
                                            <div style={{ padding: '14px 18px', textAlign: 'center' }}>
                                                <p style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: 2 }}>{s.full_name}</p>
                                                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 8 }}>{s.register_number || 'N/A'}</p>
                                                <div style={{ display: 'flex', justifyContent: 'center', gap: 16, fontSize: '0.8rem' }}>
                                                    <span style={{ color: '#7C3AED', fontWeight: 600 }}>{s.avg_score}%</span>
                                                    <span style={{ color: 'var(--text-muted)' }}>{s.submitted}/{s.total_tests}</span>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Student List */}
                    <div className="animate-section">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                            <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.05rem' }}>All Students ({students.length})</h3>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                <div style={{ position: 'relative' }}>
                                    <FiSearch size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input type="text" placeholder="Search student..." value={search} onChange={e => setSearch(e.target.value)}
                                        className="input-field" style={{ paddingLeft: 34, width: 220, height: 38, fontSize: '0.82rem' }} />
                                </div>
                                <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="input-field" style={{ width: 140, height: 38, fontSize: '0.82rem' }}>
                                    <option value="rank">By Rank</option>
                                    <option value="name">By Name</option>
                                    <option value="score">By Score</option>
                                    <option value="submissions">By Submissions</option>
                                </select>
                            </div>
                        </div>

                        <div className="glass-card" style={{ overflow: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Rank</th>
                                        <th>Student</th>
                                        <th>Reg No</th>
                                        <th>Gender</th>
                                        <th>Tests</th>
                                        <th>Submitted</th>
                                        <th>Rate</th>
                                        <th>Avg Score</th>
                                        <th>Late</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.length === 0 ? (
                                        <tr><td colSpan={10} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No students found</td></tr>
                                    ) : students.map(s => (
                                        <tr key={s.id} className="reveal-item" style={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/student/${s.id}`)}>
                                            <td>
                                                {s.rank <= 3 ? (
                                                    <span style={{ fontSize: '1.1rem' }}>{getRankBadge(s.rank)?.emoji}</span>
                                                ) : (
                                                    <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>#{s.rank}</span>
                                                )}
                                            </td>
                                            <td style={{ fontWeight: 600 }}>{s.full_name}</td>
                                            <td style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>{s.register_number || '—'}</td>
                                            <td>
                                                <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 6,
                                                    background: s.gender === 'male' ? 'rgba(59,130,246,0.1)' : 'rgba(236,72,153,0.1)',
                                                    color: s.gender === 'male' ? '#3B82F6' : '#EC4899' }}>
                                                    {s.gender === 'male' ? '♂ Boy' : '♀ Girl'}
                                                </span>
                                            </td>
                                            <td>{s.total_tests}</td>
                                            <td>{s.submitted}</td>
                                            <td>
                                                <span style={{ fontWeight: 600, color: s.submission_rate >= 80 ? '#10B981' : s.submission_rate >= 50 ? '#F59E0B' : '#EF4444' }}>
                                                    {s.submission_rate}%
                                                </span>
                                            </td>
                                            <td>
                                                <span style={{ fontWeight: 700, color: s.avg_score >= 70 ? '#10B981' : s.avg_score >= 40 ? '#F59E0B' : '#EF4444' }}>
                                                    {s.avg_score}%
                                                </span>
                                            </td>
                                            <td style={{ color: s.late_count > 0 ? '#FF4D6A' : 'var(--text-muted)' }}>{s.late_count}</td>
                                            <td><FiChevronRight size={14} style={{ color: 'var(--text-muted)' }} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Assignments in this class */}
                    {report.assignments && report.assignments.length > 0 && (
                        <div className="animate-section" style={{ marginTop: 24 }}>
                            <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.05rem', marginBottom: 16 }}>
                                Tests in this Class ({report.assignments.length})
                            </h3>
                            <div className="glass-card" style={{ overflow: 'auto' }}>
                                <table className="data-table">
                                    <thead>
                                        <tr><th>Title</th><th>Type</th><th>Subject</th><th>Marks</th><th>Deadline</th><th>Status</th></tr>
                                    </thead>
                                    <tbody>
                                        {report.assignments.map(a => {
                                            const isActive = new Date(a.deadline) > new Date();
                                            return (
                                                <tr key={a.id} className="reveal-item">
                                                    <td style={{ fontWeight: 500 }}>{a.title}</td>
                                                    <td><span className={`badge badge-${a.type}`}>{a.type?.toUpperCase()}</span></td>
                                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{a.subject || '—'}</td>
                                                    <td>{a.total_marks}</td>
                                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{new Date(a.deadline).toLocaleDateString()}</td>
                                                    <td>
                                                        <span className={`badge ${isActive ? 'badge-approved' : 'badge-late'}`}>
                                                            {isActive ? 'Active' : 'Closed'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
