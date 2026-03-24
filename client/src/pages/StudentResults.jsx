import { useState, useEffect } from 'react';
import { usePageEntrance } from '../animations/GsapAnimations';
import api from '../lib/api';
import { FiAward, FiLock, FiDownload, FiCheckCircle, FiXCircle, FiTrendingUp, FiBarChart2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function StudentResults() {
    const [assignments, setAssignments] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [subjectMarks, setSubjectMarks] = useState(null);
    const [selectedResult, setSelectedResult] = useState(null);
    const [resultData, setResultData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [resultLoading, setResultLoading] = useState(false);
    const pageRef = usePageEntrance();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [aRes, sRes, mRes] = await Promise.all([
                    api.get('/assignments'),
                    api.get('/submissions/my'),
                    api.get('/submissions/subject-marks/my')
                ]);
                setAssignments(aRes.data.assignments || []);
                setSubmissions(sRes.data.submissions || []);
                setSubjectMarks(mRes.data);
            } catch (err) {
                toast.error('Failed to load results');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const viewResult = async (assignmentId) => {
        setResultLoading(true);
        setSelectedResult(assignmentId);
        try {
            const res = await api.get(`/submissions/results/${assignmentId}`);
            setResultData(res.data);
        } catch (err) {
            if (err.response?.status === 403) {
                const publishDate = err.response?.data?.publish_date;
                toast.error(`Results not published yet${publishDate ? `. Available after ${new Date(publishDate).toLocaleString()}` : ''}`);
                setSelectedResult(null);
            } else {
                toast.error(err.response?.data?.error || 'Failed to load result');
                setSelectedResult(null);
            }
        } finally {
            setResultLoading(false);
        }
    };

    const evaluatedSubmissions = submissions.filter(s => s.status === 'evaluated');

    return (
        <div ref={pageRef}>
            <div className="page-header animate-section">
                <h1><span className="gradient-text">Results</span></h1>
                <p>View your evaluated assignments and test results</p>
            </div>

            {loading ? (
                <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}><p style={{ color: 'var(--text-muted)' }}>Loading...</p></div>
            ) : (
                <>
                    {/* Subject-wise marks overview */}
                    {subjectMarks && subjectMarks.marks.length > 0 && (
                        <div className="animate-section" style={{ marginBottom: 28 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: 20 }}>
                                <div className="glass-card" style={{ padding: '18px 20px', borderRadius: 14, textAlign: 'center' }}>
                                    <FiTrendingUp size={20} style={{ color: 'var(--primary)', marginBottom: 6 }} />
                                    <p style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>{subjectMarks.totalPoints}</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Points</p>
                                </div>
                                <div className="glass-card" style={{ padding: '18px 20px', borderRadius: 14, textAlign: 'center' }}>
                                    <FiBarChart2 size={20} style={{ color: 'var(--accent)', marginBottom: 6 }} />
                                    <p style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent)' }}>
                                        {subjectMarks.totalMax > 0 ? Math.round((subjectMarks.totalObtained / subjectMarks.totalMax) * 100) : 0}%
                                    </p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Avg Score</p>
                                </div>
                                <div className="glass-card" style={{ padding: '18px 20px', borderRadius: 14, textAlign: 'center' }}>
                                    <FiAward size={20} style={{ color: '#10B981', marginBottom: 6 }} />
                                    <p style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10B981' }}>
                                        {subjectMarks.totalObtained}<span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/{subjectMarks.totalMax}</span>
                                    </p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Marks (Evaluated)</p>
                                </div>
                            </div>

                            {/* Per-assignment marks table */}
                            <div className="glass-card" style={{ padding: 0, overflow: 'hidden', borderRadius: 16 }}>
                                <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--dark-border)' }}>
                                    <h3 style={{ fontWeight: 700, fontSize: '0.95rem' }}>Assignment-wise Marks</h3>
                                </div>
                                <table className="data-table" style={{ width: '100%' }}>
                                    <thead>
                                        <tr>
                                            <th>Assignment</th>
                                            <th>Type</th>
                                            <th style={{ textAlign: 'center' }}>Marks</th>
                                            <th style={{ textAlign: 'center' }}>Points</th>
                                            <th style={{ textAlign: 'center' }}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {subjectMarks.marks.map((m, i) => (
                                            <tr key={i}>
                                                <td style={{ fontWeight: 500 }}>{m.title}</td>
                                                <td><span className={`badge badge-${m.type}`}>{m.type?.toUpperCase()}</span></td>
                                                <td style={{ textAlign: 'center' }}>
                                                    {m.marks_obtained !== null ? (
                                                        <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{m.marks_obtained}/{m.total_marks}</span>
                                                    ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                                                </td>
                                                <td style={{ textAlign: 'center', fontWeight: 700, color: m.is_late ? 'var(--warning)' : '#10B981' }}>
                                                    +{m.points} {m.is_late && <span style={{ fontSize: '0.7rem', fontWeight: 400 }}>(late)</span>}
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <span className={`badge badge-${m.status}`}>{m.status}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Evaluated submissions detail cards */}
                    {evaluatedSubmissions.length === 0 ? (
                <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
                    <FiAward size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
                    <p style={{ color: 'var(--text-muted)' }}>No results available yet</p>
                </div>
            ) : (
                <div className="animate-section" style={{ display: 'grid', gap: 12 }}>
                    {evaluatedSubmissions.map(s => {
                        const assignment = assignments.find(a => a.id === s.assignment_id) || s.assignments;
                        return (
                            <div key={s.id} className="glass-card reveal-item" style={{ padding: '20px 24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h3 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 4 }}>{assignment?.title || 'Assignment'}</h3>
                                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                            <span className={`badge badge-${assignment?.type || 'file'}`}>{(assignment?.type || 'file').toUpperCase()}</span>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                                                Score: <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{s.marks_obtained}</span> / {assignment?.total_marks}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        {s.evaluated_file_url && (
                                            <a href={s.evaluated_file_url} target="_blank" rel="noreferrer" className="btn-secondary" style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', fontSize: '0.82rem' }}>
                                                <FiDownload size={14} /> Download
                                            </a>
                                        )}
                                        <button onClick={() => viewResult(s.assignment_id)} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.82rem' }}>
                                            <span>View Details</span>
                                        </button>
                                    </div>
                                </div>
                                {s.feedback && (
                                    <div style={{ marginTop: 12, padding: '12px 16px', borderRadius: 10, background: 'rgba(108,99,255,0.06)', border: '1px solid rgba(108,99,255,0.1)' }}>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}><strong>Feedback:</strong> {s.feedback}</p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
                </>
            )}

            {/* Result Detail Modal */}
            {selectedResult && resultData && (
                <div className="modal-overlay" onClick={() => { setSelectedResult(null); setResultData(null); }}>
                    <div className="glass" style={{ maxWidth: 600, width: '90%', maxHeight: '80vh', overflow: 'auto', padding: 32 }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, marginBottom: 16 }}>
                            <span className="gradient-text">{resultData.assignment?.title}</span>
                        </h2>

                        <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                            <div style={{ flex: 1, padding: 16, borderRadius: 12, background: 'rgba(0,212,170,0.08)', textAlign: 'center' }}>
                                <p style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'Outfit', color: 'var(--accent)' }}>
                                    {resultData.submission?.marks_obtained}
                                </p>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Obtained</p>
                            </div>
                            <div style={{ flex: 1, padding: 16, borderRadius: 12, background: 'rgba(108,99,255,0.08)', textAlign: 'center' }}>
                                <p style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'Outfit', color: 'var(--primary-light)' }}>
                                    {resultData.assignment?.total_marks}
                                </p>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Total</p>
                            </div>
                        </div>

                        {resultData.submission?.feedback && (
                            <div style={{ padding: '14px 18px', borderRadius: 10, background: 'rgba(108,99,255,0.06)', marginBottom: 20 }}>
                                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}><strong>Feedback:</strong> {resultData.submission.feedback}</p>
                            </div>
                        )}

                        {resultData.answers?.length > 0 && (
                            <div>
                                <h3 style={{ fontWeight: 600, marginBottom: 12, fontSize: '0.95rem' }}>Answer Review</h3>
                                {resultData.answers.map((a, i) => (
                                    <div key={a.id} style={{ padding: '12px 16px', borderRadius: 10, marginBottom: 8, background: a.is_correct ? 'rgba(0,214,143,0.06)' : 'rgba(255,77,106,0.06)', border: `1px solid ${a.is_correct ? 'rgba(0,214,143,0.15)' : 'rgba(255,77,106,0.15)'}` }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                            {a.is_correct ? <FiCheckCircle size={16} style={{ color: 'var(--success)' }} /> : <FiXCircle size={16} style={{ color: 'var(--danger)' }} />}
                                            <span style={{ fontWeight: 500, fontSize: '0.88rem' }}>{a.mcq_questions?.question_text}</span>
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', paddingLeft: 24 }}>
                                            Your answer: <span style={{ fontWeight: 600, color: a.is_correct ? 'var(--success)' : 'var(--danger)' }}>{(a.selected_answer || '').toUpperCase()}</span>
                                            {!a.is_correct && <span> | Correct: <span style={{ fontWeight: 600, color: 'var(--success)' }}>{(a.mcq_questions?.correct_answer || '').toUpperCase()}</span></span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button onClick={() => { setSelectedResult(null); setResultData(null); }} className="btn-secondary" style={{ width: '100%', marginTop: 20 }}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
}
