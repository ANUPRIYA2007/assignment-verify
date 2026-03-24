import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePageEntrance, AnimatedCounter } from '../animations/GsapAnimations';
import { useRealtime } from '../hooks/useRealtime';
import api from '../lib/api';
import {
    FiArrowLeft, FiUser, FiMail, FiHash, FiCalendar,
    FiCheckSquare, FiClock, FiTrendingUp, FiAlertCircle, FiAward, FiFileText, FiBarChart2
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function AdminStudentReport() {
    const { studentId } = useParams();
    const navigate = useNavigate();
    const [student, setStudent] = useState(null);
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const pageRef = usePageEntrance();

    const fetchReport = useCallback(async () => {
        try {
            const res = await api.get(`/admin/students/${studentId}/report`);
            setStudent(res.data.student);
            setReport(res.data.report);
        } catch (err) {
            toast.error('Failed to load student report');
        } finally { setLoading(false); }
    }, [studentId]);

    useEffect(() => { fetchReport(); }, [fetchReport]);

    useRealtime('submissions', { onInsert: fetchReport, onUpdate: fetchReport });

    const getScoreColor = (score) => score >= 70 ? '#10B981' : score >= 40 ? '#F59E0B' : '#EF4444';

    return (
        <div ref={pageRef}>
            <div className="page-header animate-section">
                <button onClick={() => navigate(-1)} style={{
                    display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
                    color: 'var(--primary)', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600, marginBottom: 12, padding: 0
                }}>
                    <FiArrowLeft size={16} /> Back
                </button>
                <h1><span className="gradient-text">Student Report</span></h1>
                <p>Detailed performance analysis</p>
            </div>

            {loading ? (
                <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
                </div>
            ) : !student ? (
                <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)' }}>Student not found</p>
                </div>
            ) : (
                <>
                    {/* Student Profile Card */}
                    <div className="glass-card animate-section" style={{ padding: 0, overflow: 'hidden', marginBottom: 24 }}>
                        <div style={{ background: 'linear-gradient(135deg,#7C3AED,#3B82F6)', padding: '24px 28px', color: '#fff' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.2)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700 }}>
                                    {student.full_name?.charAt(0)?.toUpperCase()}
                                </div>
                                <div>
                                    <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.3rem', marginBottom: 4 }}>{student.full_name}</h2>
                                    <div style={{ display: 'flex', gap: 16, fontSize: '0.85rem', opacity: 0.9 }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FiMail size={13} /> {student.email}</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FiHash size={13} /> {student.register_number || 'N/A'}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: 16, fontSize: '0.82rem', opacity: 0.8, marginTop: 4 }}>
                                        <span>{student.year_of_study} Year — Sec {student.section}</span>
                                        <span>{student.gender === 'male' ? '♂ Male' : '♀ Female'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="stats-grid animate-section" style={{ marginBottom: 24 }}>
                        {[
                            { icon: FiFileText, label: 'Total Submissions', value: report.total_submissions, color: '#7C3AED', bg: 'rgba(124,58,237,0.12)' },
                            { icon: FiCheckSquare, label: 'Evaluated', value: report.evaluated, color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
                            { icon: FiClock, label: 'Pending', value: report.pending, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
                            { icon: FiAlertCircle, label: 'Late', value: report.late_submissions, color: '#FF4D6A', bg: 'rgba(255,77,106,0.12)' },
                            { icon: FiTrendingUp, label: 'Avg Score', value: report.avg_score, color: '#06B6D4', bg: 'rgba(6,182,212,0.12)', suffix: '%' },
                            { icon: FiAward, label: 'Total Marks', value: report.total_marks_obtained, color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
                        ].map((s, i) => (
                            <div key={i} className="glass-card stat-card reveal-item">
                                <div className="stat-icon" style={{ background: s.bg, color: s.color }}><s.icon size={22} /></div>
                                <div className="stat-value" style={{ color: s.color }}><AnimatedCounter value={s.value} />{s.suffix || ''}</div>
                                <div className="stat-label">{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Performance Timeline + Subject Breakdown */}
                    <div className="animate-section" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 24 }}>
                        {/* Timeline */}
                        <div className="glass-card" style={{ padding: 24 }}>
                            <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.05rem', marginBottom: 20 }}>
                                <FiBarChart2 style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--primary)' }} />
                                Performance Timeline
                            </h3>
                            {report.performance_timeline?.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {report.performance_timeline.map((t, i) => (
                                        <div key={i}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 4 }}>
                                                <span style={{ color: 'var(--text-muted)' }}>{t.month} ({t.count} tests)</span>
                                                <span style={{ fontWeight: 700, color: getScoreColor(t.avg) }}>{t.avg}%</span>
                                            </div>
                                            <div style={{ height: 8, background: 'rgba(124,58,237,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                                                <div style={{ height: '100%', width: `${t.avg}%`, background: getScoreColor(t.avg), borderRadius: 4, transition: 'width 1s' }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>No timeline data</p>
                            )}
                        </div>

                        {/* Subject Breakdown */}
                        <div className="glass-card" style={{ padding: 24 }}>
                            <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.05rem', marginBottom: 20 }}>
                                <FiAward style={{ verticalAlign: 'middle', marginRight: 8, color: '#F59E0B' }} />
                                Subject Breakdown
                            </h3>
                            {report.subject_breakdown?.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {report.subject_breakdown.map((s, i) => (
                                        <div key={i}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 4 }}>
                                                <span style={{ fontWeight: 600 }}>{s.subject} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({s.tests} tests)</span></span>
                                                <span style={{ fontWeight: 700, color: getScoreColor(s.avg) }}>{s.avg}%</span>
                                            </div>
                                            <div style={{ height: 8, background: 'rgba(245,158,11,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                                                <div style={{ height: '100%', width: `${s.avg}%`, background: getScoreColor(s.avg), borderRadius: 4, transition: 'width 1s' }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>No subject data</p>
                            )}
                        </div>
                    </div>

                    {/* All Submissions */}
                    <div className="animate-section">
                        <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.05rem', marginBottom: 16 }}>
                            Test History ({report.submissions?.length || 0})
                        </h3>
                        {report.submissions?.length > 0 ? (
                            <div className="glass-card" style={{ overflow: 'auto' }}>
                                <table className="data-table">
                                    <thead>
                                        <tr><th>Assignment</th><th>Type</th><th>Subject</th><th>Status</th><th>Marks</th><th>Late</th><th>Submitted</th></tr>
                                    </thead>
                                    <tbody>
                                        {report.submissions.map(s => (
                                            <tr key={s.id} className="reveal-item">
                                                <td style={{ fontWeight: 500 }}>{s.assignments?.title || 'N/A'}</td>
                                                <td><span className={`badge badge-${s.assignments?.type}`}>{s.assignments?.type?.toUpperCase()}</span></td>
                                                <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{s.assignments?.subject || '—'}</td>
                                                <td>
                                                    <span className={`badge ${s.status === 'evaluated' ? 'badge-approved' : s.status === 'pending' ? 'badge-pending' : 'badge-late'}`}>
                                                        {s.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    {s.status === 'evaluated' ? (
                                                        <span style={{ fontWeight: 700, color: getScoreColor((s.marks_obtained / (s.assignments?.total_marks || 100)) * 100) }}>
                                                            {s.marks_obtained}/{s.assignments?.total_marks}
                                                        </span>
                                                    ) : '—'}
                                                </td>
                                                <td>
                                                    {s.is_late ? (
                                                        <span style={{ color: '#FF4D6A', fontSize: '0.82rem' }}>⚠ Late</span>
                                                    ) : (
                                                        <span style={{ color: '#10B981', fontSize: '0.82rem' }}>On time</span>
                                                    )}
                                                </td>
                                                <td style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>
                                                    {s.submitted_at ? new Date(s.submitted_at).toLocaleDateString() : '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}>
                                <p style={{ color: 'var(--text-muted)' }}>No submissions yet</p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
