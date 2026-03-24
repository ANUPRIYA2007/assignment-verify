import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { usePageEntrance } from '../animations/GsapAnimations';
import { useRealtime } from '../hooks/useRealtime';
import api from '../lib/api';
import { FiCheckSquare, FiDownload, FiSend, FiUpload, FiFileText, FiRadio } from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';

export default function TeacherSubmissions() {
    const { assignmentId } = useParams();
    const [assignments, setAssignments] = useState([]);
    const [selectedAssignment, setSelectedAssignment] = useState(assignmentId || '');
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [evaluateModal, setEvaluateModal] = useState(null);
    const [evalForm, setEvalForm] = useState({ marks_obtained: '', feedback: '' });
    const [evalFile, setEvalFile] = useState(null);
    const [evalLoading, setEvalLoading] = useState(false);
    const pageRef = usePageEntrance();

    useEffect(() => {
        api.get('/assignments').then(res => setAssignments(res.data.assignments || [])).catch(() => { });
    }, []);

    useEffect(() => {
        if (selectedAssignment) fetchSubmissions(selectedAssignment);
    }, [selectedAssignment]);

    const fetchSubmissions = async (aId) => {
        setLoading(true);
        try {
            const res = await api.get(`/submissions/assignment/${aId}`);
            setSubmissions(res.data.submissions || []);
        } catch (err) {
            toast.error('Failed to load submissions');
        } finally {
            setLoading(false);
        }
    };

    // 🔴 Real-time: new submissions for the selected assignment appear instantly
    useRealtime('submissions', {
        filter: selectedAssignment ? `assignment_id=eq.${selectedAssignment}` : undefined,
        enabled: !!selectedAssignment,
        onInsert: useCallback((newRow) => {
            setSubmissions(prev => {
                if (prev.find(s => s.id === newRow.id)) return prev;
                return [newRow, ...prev];
            });
            toast('📤 New submission!', {
                icon: '🔔',
                style: { background: '#fff', color: '#1E1B3A', border: '1px solid #E5E0F6', borderRadius: 12 },
                duration: 3000
            });
        }, []),
        onUpdate: useCallback((updatedRow) => {
            setSubmissions(prev => prev.map(s => s.id === updatedRow.id ? { ...s, ...updatedRow } : s));
        }, [])
    });

    const handleEvaluate = async () => {
        if (!evalForm.marks_obtained) return toast.error('Please enter marks');
        setEvalLoading(true);
        try {
            const formData = new FormData();
            formData.append('marks_obtained', evalForm.marks_obtained);
            formData.append('feedback', evalForm.feedback);
            if (evalFile) formData.append('file', evalFile);

            await api.put(`/submissions/${evaluateModal.id}/evaluate`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('Submission evaluated!');
            setEvaluateModal(null);
            setEvalForm({ marks_obtained: '', feedback: '' });
            setEvalFile(null);
            fetchSubmissions(selectedAssignment);
        } catch (err) {
            toast.error('Failed to evaluate');
        } finally {
            setEvalLoading(false);
        }
    };

    return (
        <div ref={pageRef}>
            <Toaster position="top-right" toastOptions={{ style: { background: '#fff', color: '#1E1B3A', border: '1px solid #E5E0F6', borderRadius: 12 } }} />

            <div className="page-header animate-section">
                <h1><span className="gradient-text">Submissions</span></h1>
                <p>Review and evaluate student submissions</p>
            </div>

            <div className="animate-section" style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Select Assignment</label>
                <select className="input-field" value={selectedAssignment} onChange={e => setSelectedAssignment(e.target.value)} style={{ maxWidth: 400 }}>
                    <option value="">-- Choose an assignment --</option>
                    {assignments.map(a => <option key={a.id} value={a.id}>{a.title} ({a.type.toUpperCase()})</option>)}
                </select>
            </div>

            {!selectedAssignment ? (
                <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
                    <FiCheckSquare size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
                    <p style={{ color: 'var(--text-muted)' }}>Select an assignment to view submissions</p>
                </div>
            ) : loading ? (
                <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}><p style={{ color: 'var(--text-muted)' }}>Loading...</p></div>
            ) : submissions.length === 0 ? (
                <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
                    <FiFileText size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
                    <p style={{ color: 'var(--text-muted)' }}>No submissions for this assignment</p>
                </div>
            ) : (
                <div className="glass-card animate-section" style={{ overflow: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr><th>Student</th><th>Submitted</th><th>Late</th><th>Status</th><th>Marks</th><th>File</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {submissions.map(s => (
                                <tr key={s.id} className="reveal-item">
                                    <td><div><span style={{ fontWeight: 500 }}>{s.users?.full_name || 'N/A'}</span><br /><span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{s.users?.email}</span></div></td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{new Date(s.submitted_at).toLocaleString()}</td>
                                    <td>{s.is_late ? <span className="badge badge-late">Late</span> : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                                    <td><span className={`badge badge-${s.status}`}>{s.status}</span></td>
                                    <td style={{ fontWeight: 600, color: s.marks_obtained !== null ? 'var(--accent)' : 'var(--text-muted)' }}>
                                        {s.marks_obtained !== null ? s.marks_obtained : '—'}
                                    </td>
                                    <td>
                                        {s.file_url && <a href={s.file_url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-light)' }}><FiDownload size={16} /></a>}
                                    </td>
                                    <td>
                                        {s.status !== 'evaluated' && (
                                            <button onClick={() => { setEvaluateModal(s); setEvalForm({ marks_obtained: '', feedback: '' }); }} className="btn-primary" style={{ padding: '6px 14px', fontSize: '0.82rem' }}>
                                                <span>Evaluate</span>
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Evaluate Modal */}
            {evaluateModal && (
                <div className="modal-overlay" onClick={() => setEvaluateModal(null)}>
                    <div className="glass" style={{ maxWidth: 500, width: '90%', padding: 32 }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, marginBottom: 4 }}>
                            <span className="gradient-text">Evaluate Submission</span>
                        </h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 20 }}>
                            Student: {evaluateModal.users?.full_name}
                        </p>

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Marks *</label>
                            <input type="number" className="input-field" placeholder="Enter marks" value={evalForm.marks_obtained} onChange={e => setEvalForm({ ...evalForm, marks_obtained: e.target.value })} />
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Feedback</label>
                            <textarea className="input-field" placeholder="Write feedback..." value={evalForm.feedback} onChange={e => setEvalForm({ ...evalForm, feedback: e.target.value })} />
                        </div>

                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Evaluated File (optional)</label>
                            <input type="file" onChange={e => setEvalFile(e.target.files[0])} style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }} />
                        </div>

                        <div style={{ display: 'flex', gap: 12 }}>
                            <button onClick={handleEvaluate} className="btn-primary" style={{ flex: 1 }} disabled={evalLoading}>
                                <span>{evalLoading ? 'Saving...' : 'Submit Evaluation'}</span>
                            </button>
                            <button onClick={() => setEvaluateModal(null)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
