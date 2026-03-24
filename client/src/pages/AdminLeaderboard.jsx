import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { usePageEntrance, AnimatedCounter } from '../animations/GsapAnimations';
import { useRealtime } from '../hooks/useRealtime';
import api from '../lib/api';
import { FiAward, FiSearch, FiFilter, FiUsers } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function AdminLeaderboard() {
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterYear, setFilterYear] = useState('');
    const [filterSection, setFilterSection] = useState('');
    const [search, setSearch] = useState('');
    const [classes, setClasses] = useState([]);
    const pageRef = usePageEntrance();

    const fetchLeaderboard = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (filterYear) params.set('year', filterYear);
            if (filterSection) params.set('section', filterSection);
            const res = await api.get(`/admin/leaderboard?${params.toString()}`);
            setLeaderboard(res.data.leaderboard || []);
        } catch (err) {
            toast.error('Failed to load leaderboard');
        } finally { setLoading(false); }
    }, [filterYear, filterSection]);

    const fetchClasses = useCallback(async () => {
        try {
            const res = await api.get('/admin/classes');
            setClasses(res.data.classes || []);
        } catch (err) { /* silent */ }
    }, []);

    useEffect(() => { fetchClasses(); }, [fetchClasses]);
    useEffect(() => {
        fetchLeaderboard();
        
        // Refresh every 3 seconds for live leaderboard updates
        const interval = setInterval(fetchLeaderboard, 3000);
        return () => clearInterval(interval);
    }, [fetchLeaderboard]);

    useRealtime('submissions', { onInsert: fetchLeaderboard, onUpdate: fetchLeaderboard, enabled: true });

    const filtered = leaderboard.filter(s =>
        s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        s.register_number?.toLowerCase().includes(search.toLowerCase())
    );

    const uniqueYears = [...new Set(classes.map(c => c.year))];
    const uniqueSections = [...new Set(
        classes.filter(c => !filterYear || c.year === filterYear).map(c => c.section)
    )];

    const getRankStyle = (rank) => {
        if (rank === 1) return { bg: 'linear-gradient(135deg,#F59E0B,#FCD34D)', text: '#fff', emoji: '🥇', shadow: '0 4px 20px rgba(245,158,11,0.3)' };
        if (rank === 2) return { bg: 'linear-gradient(135deg,#94A3B8,#CBD5E1)', text: '#fff', emoji: '🥈', shadow: '0 4px 20px rgba(148,163,184,0.3)' };
        if (rank === 3) return { bg: 'linear-gradient(135deg,#CD7F32,#DDA15E)', text: '#fff', emoji: '🥉', shadow: '0 4px 20px rgba(205,127,50,0.3)' };
        return null;
    };

    return (
        <div ref={pageRef}>
            <div className="page-header animate-section">
                <h1><span className="gradient-text">Leaderboard</span> 🏆</h1>
                <p>Student rankings by performance — real-time</p>
            </div>

            {/* Filters */}
            <div className="glass-card animate-section" style={{ padding: '16px 20px', marginBottom: 24, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <FiFilter size={16} style={{ color: 'var(--text-muted)' }} />
                <select value={filterYear} onChange={e => { setFilterYear(e.target.value); setFilterSection(''); }}
                    className="input-field" style={{ width: 140, height: 38, fontSize: '0.82rem' }}>
                    <option value="">All Years</option>
                    {uniqueYears.map(y => <option key={y} value={y}>{y} Year</option>)}
                </select>
                <select value={filterSection} onChange={e => setFilterSection(e.target.value)}
                    className="input-field" style={{ width: 140, height: 38, fontSize: '0.82rem' }}>
                    <option value="">All Sections</option>
                    {uniqueSections.map(s => <option key={s} value={s}>Section {s}</option>)}
                </select>
                <div style={{ position: 'relative', marginLeft: 'auto' }}>
                    <FiSearch size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="text" placeholder="Search student..." value={search} onChange={e => setSearch(e.target.value)}
                        className="input-field" style={{ paddingLeft: 34, width: 220, height: 38, fontSize: '0.82rem' }} />
                </div>
            </div>

            {loading ? (
                <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)' }}>Loading leaderboard...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
                    <FiAward size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
                    <p style={{ color: 'var(--text-muted)' }}>No students found</p>
                </div>
            ) : (
                <>
                    {/* Top 3 Podium */}
                    {filtered.length >= 3 && (
                        <div className="animate-section" style={{ marginBottom: 28 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: 14, alignItems: 'end' }}>
                                {/* 2nd place */}
                                {(() => {
                                    const s = filtered[1]; const style = getRankStyle(2);
                                    return (
                                        <Link to={`/admin/student/${s.id}`} className="glass-card reveal-item" style={{
                                            padding: 0, overflow: 'hidden', textDecoration: 'none', color: 'inherit',
                                            boxShadow: style.shadow
                                        }}>
                                            <div style={{ background: style.bg, padding: '16px 18px 12px', color: style.text, textAlign: 'center' }}>
                                                <span style={{ fontSize: '2rem' }}>{style.emoji}</span>
                                                <p style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1rem', marginTop: 2 }}>#{s.rank}</p>
                                            </div>
                                            <div style={{ padding: '14px 16px', textAlign: 'center' }}>
                                                <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 2 }}>{s.full_name}</p>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>{s.year_of_study} {s.section}</p>
                                                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, fontSize: '0.8rem' }}>
                                                    <span style={{ color: '#7C3AED', fontWeight: 700 }}>{s.avg_score}%</span>
                                                    <span style={{ color: '#F59E0B', fontWeight: 600 }}>{s.points} pts</span>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })()}
                                {/* 1st place */}
                                {(() => {
                                    const s = filtered[0]; const style = getRankStyle(1);
                                    return (
                                        <Link to={`/admin/student/${s.id}`} className="glass-card reveal-item" style={{
                                            padding: 0, overflow: 'hidden', textDecoration: 'none', color: 'inherit',
                                            boxShadow: style.shadow, transform: 'scale(1.02)'
                                        }}>
                                            <div style={{ background: style.bg, padding: '22px 18px 16px', color: style.text, textAlign: 'center' }}>
                                                <span style={{ fontSize: '2.5rem' }}>{style.emoji}</span>
                                                <p style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.2rem', marginTop: 2 }}>#{s.rank}</p>
                                            </div>
                                            <div style={{ padding: '16px 18px', textAlign: 'center' }}>
                                                <p style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 2 }}>{s.full_name}</p>
                                                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 8 }}>{s.year_of_study} {s.section}</p>
                                                <div style={{ display: 'flex', justifyContent: 'center', gap: 14, fontSize: '0.85rem' }}>
                                                    <span style={{ color: '#7C3AED', fontWeight: 700 }}>{s.avg_score}%</span>
                                                    <span style={{ color: '#F59E0B', fontWeight: 700 }}>{s.points} pts</span>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })()}
                                {/* 3rd place */}
                                {(() => {
                                    const s = filtered[2]; const style = getRankStyle(3);
                                    return (
                                        <Link to={`/admin/student/${s.id}`} className="glass-card reveal-item" style={{
                                            padding: 0, overflow: 'hidden', textDecoration: 'none', color: 'inherit',
                                            boxShadow: style.shadow
                                        }}>
                                            <div style={{ background: style.bg, padding: '16px 18px 12px', color: style.text, textAlign: 'center' }}>
                                                <span style={{ fontSize: '2rem' }}>{style.emoji}</span>
                                                <p style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1rem', marginTop: 2 }}>#{s.rank}</p>
                                            </div>
                                            <div style={{ padding: '14px 16px', textAlign: 'center' }}>
                                                <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 2 }}>{s.full_name}</p>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>{s.year_of_study} {s.section}</p>
                                                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, fontSize: '0.8rem' }}>
                                                    <span style={{ color: '#7C3AED', fontWeight: 700 }}>{s.avg_score}%</span>
                                                    <span style={{ color: '#F59E0B', fontWeight: 600 }}>{s.points} pts</span>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })()}
                            </div>
                        </div>
                    )}

                    {/* Rankings Table */}
                    <div className="glass-card animate-section" style={{ overflow: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Rank</th>
                                    <th>Student</th>
                                    <th>Reg No</th>
                                    <th>Class</th>
                                    <th>Tests</th>
                                    <th>Avg Score</th>
                                    <th>Points</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(s => {
                                    const badge = getRankStyle(s.rank);
                                    return (
                                        <tr key={s.id} className="reveal-item" style={{ cursor: 'pointer' }}
                                            onClick={() => window.location.href = `/admin/student/${s.id}`}>
                                            <td>
                                                {badge ? (
                                                    <span style={{ fontSize: '1.1rem' }}>{badge.emoji}</span>
                                                ) : (
                                                    <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>#{s.rank}</span>
                                                )}
                                            </td>
                                            <td style={{ fontWeight: 600 }}>{s.full_name}</td>
                                            <td style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>{s.register_number || '—'}</td>
                                            <td style={{ fontSize: '0.83rem' }}>{s.year_of_study} — {s.section}</td>
                                            <td>{s.submissions}</td>
                                            <td>
                                                <span style={{
                                                    fontWeight: 700,
                                                    color: s.avg_score >= 70 ? '#10B981' : s.avg_score >= 40 ? '#F59E0B' : '#EF4444'
                                                }}>{s.avg_score}%</span>
                                            </td>
                                            <td>
                                                <span style={{ fontWeight: 700, color: '#F59E0B' }}>{s.points}</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}
