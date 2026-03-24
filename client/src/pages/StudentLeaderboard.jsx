import { useState, useEffect } from 'react';
import { usePageEntrance } from '../animations/GsapAnimations';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { FiAward, FiTrendingUp, FiUser, FiHash } from 'react-icons/fi';

export default function StudentLeaderboard() {
    const { user } = useAuth();
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const pageRef = usePageEntrance();

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await api.get('/submissions/leaderboard/rankings');
                setLeaderboard(res.data.leaderboard || []);
            } catch (err) {
                console.error('Failed to fetch leaderboard', err);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    const myEntry = leaderboard.find(e => e.id === user?.id);

    const podiumColors = ['#F59E0B', '#9CA3AF', '#CD7F32']; // gold, silver, bronze

    return (
        <div ref={pageRef}>
            <div className="page-header animate-section">
                <h1><span className="gradient-text">Leaderboard</span></h1>
                <p>Rankings based on submission points</p>
            </div>

            {/* My rank card */}
            {myEntry && (
                <div className="glass-card animate-section" style={{ padding: '20px 28px', marginBottom: 24, borderRadius: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1.5px solid rgba(124,58,237,0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{
                            width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '1.1rem'
                        }}>
                            #{myEntry.rank}
                        </div>
                        <div>
                            <p style={{ fontWeight: 700, fontSize: '1rem' }}>Your Ranking</p>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{myEntry.submissions} submissions &bull; {myEntry.points} points</p>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>{myEntry.points}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Points</p>
                    </div>
                </div>
            )}

            {/* Podium top 3 */}
            {!loading && leaderboard.length >= 3 && (
                <div className="animate-section" style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 16, marginBottom: 32, padding: '0 20px' }}>
                    {[1, 0, 2].map(idx => {
                        const entry = leaderboard[idx];
                        if (!entry) return null;
                        const isFirst = idx === 0;
                        return (
                            <div key={entry.id} style={{
                                textAlign: 'center', flex: '0 0 auto', width: isFirst ? 140 : 120
                            }}>
                                <div style={{
                                    width: isFirst ? 72 : 56, height: isFirst ? 72 : 56, borderRadius: '50%', margin: '0 auto 10px',
                                    background: `linear-gradient(135deg, ${podiumColors[idx]}33, ${podiumColors[idx]}11)`,
                                    border: `2.5px solid ${podiumColors[idx]}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: isFirst ? '1.5rem' : '1.1rem', fontWeight: 800, color: podiumColors[idx]
                                }}>
                                    {entry.rank}
                                </div>
                                <p style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 2 }}>{entry.full_name}</p>
                                <p style={{ color: podiumColors[idx], fontWeight: 800, fontSize: '1.1rem' }}>{entry.points} pts</p>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{entry.submissions} submissions</p>
                                <div className="glass-card" style={{
                                    height: isFirst ? 100 : idx === 1 ? 70 : 50,
                                    marginTop: 10, borderRadius: '12px 12px 0 0',
                                    background: `linear-gradient(180deg, ${podiumColors[idx]}22, transparent)`
                                }}></div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Full leaderboard table */}
            {loading ? (
                <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)' }}>Loading leaderboard...</p>
                </div>
            ) : leaderboard.length === 0 ? (
                <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
                    <FiAward size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
                    <p style={{ color: 'var(--text-muted)' }}>No rankings yet</p>
                </div>
            ) : (
                <div className="glass-card animate-section" style={{ padding: 0, overflow: 'hidden', borderRadius: 16 }}>
                    <table className="data-table" style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th style={{ width: 60 }}>Rank</th>
                                <th>Student</th>
                                <th>Reg. No.</th>
                                <th>Year / Section</th>
                                <th style={{ textAlign: 'center' }}>Submissions</th>
                                <th style={{ textAlign: 'right' }}>Points</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboard.map(entry => {
                                const isMe = entry.id === user?.id;
                                return (
                                    <tr key={entry.id} style={{ background: isMe ? 'rgba(124,58,237,0.06)' : undefined }}>
                                        <td>
                                            <span style={{
                                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                width: 32, height: 32, borderRadius: 8, fontWeight: 800, fontSize: '0.82rem',
                                                background: entry.rank <= 3 ? `${podiumColors[entry.rank - 1]}22` : 'rgba(139,133,161,0.08)',
                                                color: entry.rank <= 3 ? podiumColors[entry.rank - 1] : 'var(--text-muted)'
                                            }}>
                                                {entry.rank}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{
                                                    width: 32, height: 32, borderRadius: 8, background: 'rgba(124,58,237,0.10)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 700, fontSize: '0.75rem'
                                                }}>
                                                    {entry.full_name?.charAt(0)?.toUpperCase()}
                                                </div>
                                                <span style={{ fontWeight: isMe ? 700 : 500 }}>
                                                    {entry.full_name} {isMe && <span style={{ color: 'var(--primary)', fontSize: '0.72rem' }}>(You)</span>}
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{entry.register_number || '—'}</td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{entry.year_of_study} {entry.section ? `/ ${entry.section}` : ''}</td>
                                        <td style={{ textAlign: 'center' }}>{entry.submissions}</td>
                                        <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--primary)' }}>{entry.points}</td>
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
