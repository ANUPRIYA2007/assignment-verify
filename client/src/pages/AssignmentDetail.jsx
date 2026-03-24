import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePageEntrance } from '../animations/GsapAnimations';
import api from '../lib/api';
import gsap from 'gsap';
import {
    FiUpload, FiClock, FiCheckSquare, FiFileText, FiAlertTriangle,
    FiChevronLeft, FiChevronRight, FiFlag, FiSend, FiTrash2, FiRefreshCw,
    FiX
} from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';

export default function AssignmentDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const [assignment, setAssignment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [file, setFile] = useState(null);
    const [answers, setAnswers] = useState({});
    const [marked, setMarked] = useState(new Set());
    const [lateReason, setLateReason] = useState('');
    const [showLateForm, setShowLateForm] = useState(false);
    const [timeLeft, setTimeLeft] = useState(null);
    const [mcqStarted, setMcqStarted] = useState(false);
    const [warmup, setWarmup] = useState(0); // warmup countdown seconds
    const [currentQ, setCurrentQ] = useState(0); // current question index
    const [showReport, setShowReport] = useState(false); // pre-submit report
    const [submitted, setSubmitted] = useState(false);
    const [existingSubmission, setExistingSubmission] = useState(null);
    const [showRemoveReason, setShowRemoveReason] = useState(false);
    const [removeReason, setRemoveReason] = useState('');
    const [removing, setRemoving] = useState(false);
    const timerRef = useRef(null);
    const warmupRef = useRef(null);
    const pageRef = usePageEntrance();

    useEffect(() => {
        const fetchAssignment = async () => {
            try {
                const res = await api.get(`/assignments/${id}`);
                setAssignment(res.data.assignment);
            } catch (err) {
                toast.error('Failed to load assignment');
            } finally {
                setLoading(false);
            }
        };
        fetchAssignment();
    }, [id]);

    // Check for existing submission
    useEffect(() => {
        const checkSubmission = async () => {
            try {
                const res = await api.get('/submissions/my');
                const sub = (res.data.submissions || []).find(s => s.assignment_id === id);
                if (sub) {
                    setExistingSubmission(sub);
                    setSubmitted(true);
                }
            } catch (err) {
                // ignore
            }
        };
        checkSubmission();
    }, [id]);

    // Warmup countdown (10 seconds)
    useEffect(() => {
        if (warmup <= 0) return;
        warmupRef.current = setInterval(() => {
            setWarmup(prev => {
                if (prev <= 1) {
                    clearInterval(warmupRef.current);
                    setMcqStarted(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(warmupRef.current);
    }, [warmup > 0]);

    // MCQ Timer (starts after warmup ends and mcqStarted is true)
    useEffect(() => {
        if (!mcqStarted || !assignment?.mcq_duration) return;
        setTimeLeft(assignment.mcq_duration * 60);

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    handleMCQSubmit(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timerRef.current);
    }, [mcqStarted]);

    const formatTime = (seconds) => {
        if (seconds === null) return '--:--';
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const isLate = assignment ? new Date() > new Date(assignment.deadline) : false;

    const startMcqWithWarmup = () => {
        setWarmup(10); // 10-second warmup
    };

    const toggleMark = (qId) => {
        setMarked(prev => {
            const next = new Set(prev);
            if (next.has(qId)) next.delete(qId);
            else next.add(qId);
            return next;
        });
    };

    // Pre-submit report data
    const questions = assignment?.questions || [];
    const answeredCount = Object.keys(answers).length;
    const skippedCount = questions.length - answeredCount;
    const markedCount = marked.size;

    const handleFileSubmit = async () => {
        if (!file) return toast.error('Please select a file');
        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('assignment_id', id);
            formData.append('file', file);

            const res = await api.post('/submissions/file', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

            if (res.data.is_late) {
                setShowLateForm(true);
                toast('⚠️ Late submission — please provide a reason', { duration: 5000 });
            } else {
                toast.success('Assignment submitted successfully!');
                setSubmitted(true);
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'Submission failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleLateReasonSubmit = async () => {
        if (!lateReason.trim()) return toast.error('Please provide a reason');
        try {
            const mySubmissions = await api.get('/submissions/my');
            const sub = mySubmissions.data.submissions.find(s => s.assignment_id === id);
            if (sub) {
                await api.post('/late-requests', { submission_id: sub.id, reason: lateReason });
                toast.success('Late submission reason submitted');
                setShowLateForm(false);
                setSubmitted(true);
            }
        } catch (err) {
            toast.error('Failed to submit late reason');
        }
    };

    const handleMCQSubmit = useCallback(async (autoSubmit = false) => {
        if (submitted) return;
        clearInterval(timerRef.current);
        setSubmitting(true);

        try {
            const answerArray = Object.entries(answers).map(([question_id, selected_answer]) => ({
                question_id, selected_answer
            }));

            const res = await api.post('/submissions/mcq', { assignment_id: id, answers: answerArray });
            toast.success(autoSubmit ? '⏰ Time up! Test auto-submitted.' : 'Test submitted!');
            setSubmitted(true);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Submission failed');
        } finally {
            setSubmitting(false);
        }
    }, [answers, id, submitted]);

    if (loading) {
        return <div ref={pageRef} style={{ padding: 40, textAlign: 'center' }}><p style={{ color: 'var(--text-muted)' }}>Loading...</p></div>;
    }

    if (!assignment) {
        return <div ref={pageRef} style={{ padding: 40, textAlign: 'center' }}><p style={{ color: 'var(--text-muted)' }}>Assignment not found</p></div>;
    }

    return (
        <div ref={pageRef}>
            <Toaster position="top-right" toastOptions={{ style: { background: '#fff', color: '#1E1B3A', border: '1px solid #E5E0F6', borderRadius: 12, boxShadow: '0 4px 24px rgba(124,58,237,0.10)' } }} />

            <div className="page-header animate-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1><span className="gradient-text">{assignment.title}</span></h1>
                        <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                            <span className={`badge badge-${assignment.type}`}>{assignment.type.toUpperCase()}</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Marks: {assignment.total_marks}</span>
                            <span style={{ color: isLate ? 'var(--danger)' : 'var(--text-muted)', fontSize: '0.85rem' }}>
                                Due: {new Date(assignment.deadline).toLocaleString()}
                            </span>
                        </div>
                    </div>
                    {assignment.type === 'mcq' && mcqStarted && !submitted && !showReport && (
                        <div className="glass" style={{ padding: '12px 20px', borderRadius: 14 }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2, textAlign: 'center' }}>Time Left</div>
                            <div className={`timer-display ${timeLeft <= 60 ? 'danger' : ''}`}>
                                {formatTime(timeLeft)}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {assignment.description && (
                <div className="glass-card animate-section" style={{ padding: 22, marginBottom: 24 }}>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{assignment.description}</p>
                </div>
            )}

            {/* ═══ SUBMITTED STATE ═══ */}
            {submitted ? (
                <div className="glass-card animate-section" style={{ padding: 40, textAlign: 'center' }}>
                    <FiCheckSquare size={48} style={{ color: 'var(--success)', marginBottom: 16 }} />
                    <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, color: 'var(--success)', marginBottom: 8 }}>Submitted!</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>Your submission has been recorded</p>

                    {/* File submission: show remove/reupload */}
                    {assignment.type === 'file' && existingSubmission && (
                        <div style={{ marginTop: 20 }}>
                            {!showRemoveReason ? (
                                <button onClick={() => setShowRemoveReason(true)} style={{
                                    padding: '10px 20px', borderRadius: 10, background: 'rgba(239,68,68,0.08)',
                                    border: '1px solid rgba(239,68,68,0.2)', color: 'var(--danger)', cursor: 'pointer',
                                    fontWeight: 600, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: 8
                                }}>
                                    <FiTrash2 size={14} /> Remove & Reupload
                                </button>
                            ) : (
                                <div style={{ maxWidth: 400, margin: '0 auto', textAlign: 'left' }}>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                                        Reason for removing submission
                                    </label>
                                    <textarea className="input-field" placeholder="Explain why you want to resubmit..." value={removeReason} onChange={e => setRemoveReason(e.target.value)} style={{ marginBottom: 12 }} />
                                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                                        <button onClick={() => setShowRemoveReason(false)} style={{
                                            padding: '10px 20px', borderRadius: 10, background: 'transparent',
                                            border: '1px solid var(--dark-border)', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem'
                                        }}>Cancel</button>
                                        <button onClick={async () => {
                                            if (!removeReason.trim()) return toast.error('Please provide a reason');
                                            setRemoving(true);
                                            try {
                                                await api.delete(`/submissions/${existingSubmission.id}`, { data: { reason: removeReason } });
                                                toast.success('Submission removed. You can reupload now.');
                                                setSubmitted(false);
                                                setExistingSubmission(null);
                                                setShowRemoveReason(false);
                                                setRemoveReason('');
                                                setFile(null);
                                            } catch (err) {
                                                toast.error(err.response?.data?.error || 'Failed to remove submission');
                                            } finally {
                                                setRemoving(false);
                                            }
                                        }} className="btn-primary" style={{ padding: '10px 20px', fontSize: '0.85rem' }} disabled={removing}>
                                            <span>{removing ? 'Removing...' : 'Confirm Remove'}</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

            /* ═══ FILE SUBMISSION ═══ */
            ) : assignment.type === 'file' ? (
                <>
                    {showLateForm ? (
                        <div className="glass-card animate-section" style={{ padding: 28 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                                <FiAlertTriangle size={20} style={{ color: 'var(--warning)' }} />
                                <h3 style={{ fontWeight: 600, color: 'var(--warning)' }}>Late Submission — Provide Reason</h3>
                            </div>
                            <textarea className="input-field" placeholder="Why is this submission late?" value={lateReason} onChange={e => setLateReason(e.target.value)} style={{ marginBottom: 16 }} />
                            <button onClick={handleLateReasonSubmit} className="btn-primary"><span>Submit Reason</span></button>
                        </div>
                    ) : (
                        <div className="glass-card animate-section" style={{ padding: 28 }}>
                            {isLate && (
                                <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(255,77,106,0.08)', border: '1px solid rgba(255,77,106,0.2)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <FiAlertTriangle size={18} style={{ color: 'var(--danger)' }} />
                                    <span style={{ color: 'var(--danger)', fontSize: '0.88rem', fontWeight: 500 }}>Deadline has passed. You will need to provide a reason for late submission.</span>
                                </div>
                            )}
                            <div className="upload-zone" onClick={() => document.getElementById('fileInput').click()} onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('dragover'); }} onDragLeave={e => e.currentTarget.classList.remove('dragover')} onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove('dragover'); if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]); }}>
                                <FiUpload size={36} style={{ color: 'var(--primary-light)', marginBottom: 12 }} />
                                <p style={{ fontWeight: 600, marginBottom: 4 }}>{file ? file.name : 'Drop your file here or click to browse'}</p>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>PDF, DOC, DOCX, JPG, PNG (max 10MB)</p>
                                <input type="file" id="fileInput" hidden accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={e => setFile(e.target.files[0])} />
                            </div>
                            {file && (
                                <button onClick={() => setFile(null)} style={{ marginTop: 10, background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <FiX size={14} /> Remove file
                                </button>
                            )}
                            <button onClick={handleFileSubmit} className="btn-primary" style={{ marginTop: 20, width: '100%' }} disabled={submitting || !file}>
                                <span>{submitting ? 'Submitting...' : 'Submit Assignment'}</span>
                            </button>
                        </div>
                    )}
                </>

            /* ═══ MCQ TEST ═══ */
            ) : (
                <div className="animate-section">
                    {/* Pre-start screen */}
                    {!mcqStarted && warmup === 0 && (
                        <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}>
                            <FiClock size={48} style={{ color: 'var(--accent)', marginBottom: 16 }} />
                            <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, marginBottom: 8 }}>MCQ Test</h2>
                            <p style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{questions.length} Questions</p>
                            <p style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Duration: {assignment.mcq_duration} minutes</p>
                            <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Total Marks: {assignment.total_marks}</p>
                            {questions.length === 0 ? (
                                <div style={{ padding: '16px 24px', borderRadius: 12, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', marginTop: 8 }}>
                                    <p style={{ color: '#F59E0B', fontWeight: 600, fontSize: '0.9rem' }}>No questions available for this test yet.</p>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: 4 }}>The teacher may still be setting up the questions.</p>
                                </div>
                            ) : (
                                <button onClick={startMcqWithWarmup} className="btn-primary">
                                    <span>Start Test</span>
                                </button>
                            )}
                        </div>
                    )}

                    {/* Warmup countdown */}
                    {warmup > 0 && !mcqStarted && (
                        <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
                            <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, marginBottom: 10, color: 'var(--text-secondary)' }}>Get Ready!</h2>
                            <p style={{ color: 'var(--text-muted)', marginBottom: 28, fontSize: '0.9rem' }}>Test starts in</p>
                            <div style={{
                                width: 120, height: 120, borderRadius: '50%', margin: '0 auto 24px',
                                background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(124,58,237,0.04))',
                                border: '3px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <span style={{ fontSize: '3rem', fontWeight: 800, fontFamily: 'Outfit', color: 'var(--primary)' }}>{warmup}</span>
                            </div>
                            <p style={{ color: 'var(--primary-light)', fontSize: '0.85rem', fontWeight: 600 }}>
                                {questions.length} questions &bull; {assignment.mcq_duration} min
                            </p>
                        </div>
                    )}

                    {/* Pre-submit report */}
                    {mcqStarted && showReport && (
                        <div className="glass-card" style={{ padding: 36 }}>
                            <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, marginBottom: 20, textAlign: 'center' }}>Test Report</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
                                <div style={{ textAlign: 'center', padding: 20, borderRadius: 14, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
                                    <p style={{ fontSize: '2rem', fontWeight: 800, color: '#10B981' }}>{answeredCount}</p>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Answered</p>
                                </div>
                                <div style={{ textAlign: 'center', padding: 20, borderRadius: 14, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
                                    <p style={{ fontSize: '2rem', fontWeight: 800, color: '#F59E0B' }}>{skippedCount}</p>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Skipped</p>
                                </div>
                                <div style={{ textAlign: 'center', padding: 20, borderRadius: 14, background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)' }}>
                                    <p style={{ fontSize: '2rem', fontWeight: 800, color: '#7C3AED' }}>{markedCount}</p>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Marked for Review</p>
                                </div>
                            </div>

                            {/* Question status grid */}
                            <div style={{ marginBottom: 28 }}>
                                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>Question Status</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    {questions.map((q, i) => {
                                        const isAnswered = !!answers[q.id];
                                        const isMarked = marked.has(q.id);
                                        let bg = 'rgba(139,133,161,0.10)'; let color = 'var(--text-muted)';
                                        if (isAnswered && isMarked) { bg = 'rgba(124,58,237,0.15)'; color = '#7C3AED'; }
                                        else if (isAnswered) { bg = 'rgba(16,185,129,0.12)'; color = '#10B981'; }
                                        else if (isMarked) { bg = 'rgba(245,158,11,0.12)'; color = '#F59E0B'; }
                                        return (
                                            <button key={q.id} onClick={() => { setCurrentQ(i); setShowReport(false); }}
                                                style={{
                                                    width: 40, height: 40, borderRadius: 10, border: `1.5px solid ${color}`,
                                                    background: bg, color, fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer'
                                                }}>
                                                {i + 1}
                                            </button>
                                        );
                                    })}
                                </div>
                                <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        <span style={{ width: 10, height: 10, borderRadius: 3, background: 'rgba(16,185,129,0.4)' }}></span> Answered
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        <span style={{ width: 10, height: 10, borderRadius: 3, background: 'rgba(245,158,11,0.4)' }}></span> Marked
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        <span style={{ width: 10, height: 10, borderRadius: 3, background: 'rgba(139,133,161,0.2)' }}></span> Skipped
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                                <button onClick={() => setShowReport(false)} style={{
                                    padding: '12px 24px', borderRadius: 12, background: 'transparent',
                                    border: '1px solid var(--dark-border)', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 700
                                }}>Back to Questions</button>
                                <button onClick={() => handleMCQSubmit(false)} className="btn-primary" style={{ padding: '12px 28px' }} disabled={submitting}>
                                    <FiSend size={14} style={{ marginRight: 8 }} />
                                    <span>{submitting ? 'Submitting...' : 'Confirm Submit'}</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Question-by-question view */}
                    {mcqStarted && !showReport && (
                        <div>
                            {/* Question navigation grid */}
                            <div className="glass-card" style={{ padding: '14px 20px', marginBottom: 16, borderRadius: 14 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginRight: 8 }}>Q:</span>
                                    {questions.map((q, i) => {
                                        const isAnswered = !!answers[q.id];
                                        const isMarked = marked.has(q.id);
                                        const isCurrent = i === currentQ;
                                        let bg = 'transparent'; let border = 'var(--dark-border)'; let color = 'var(--text-muted)';
                                        if (isCurrent) { bg = 'var(--primary)'; border = 'var(--primary)'; color = '#fff'; }
                                        else if (isAnswered) { bg = 'rgba(16,185,129,0.12)'; border = '#10B981'; color = '#10B981'; }
                                        else if (isMarked) { bg = 'rgba(245,158,11,0.12)'; border = '#F59E0B'; color = '#F59E0B'; }
                                        return (
                                            <button key={q.id} onClick={() => setCurrentQ(i)}
                                                style={{
                                                    width: 34, height: 34, borderRadius: 8, fontSize: '0.75rem', fontWeight: 700,
                                                    border: `1.5px solid ${border}`, background: bg, color, cursor: 'pointer', transition: 'all 0.2s'
                                                }}>
                                                {i + 1}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Current question */}
                            {questions[currentQ] && (() => {
                                const q = questions[currentQ];
                                return (
                                    <div className="glass-card question-card" style={{ padding: 28 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
                                            <h3 style={{ fontWeight: 600, fontSize: '1rem', flex: 1 }}>
                                                <span style={{ color: 'var(--primary)', marginRight: 8 }}>Q{currentQ + 1}.</span>
                                                {q.question_text}
                                            </h3>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', whiteSpace: 'nowrap', marginLeft: 12 }}>{q.marks} mark{q.marks > 1 ? 's' : ''}</span>
                                        </div>
                                        {['A', 'B', 'C', 'D'].map(opt => (
                                            <div
                                                key={opt}
                                                className={`option ${answers[q.id] === opt ? 'selected' : ''}`}
                                                onClick={() => setAnswers({ ...answers, [q.id]: opt })}
                                            >
                                                <div style={{
                                                    width: 24, height: 24, borderRadius: '50%',
                                                    border: `2px solid ${answers[q.id] === opt ? 'var(--primary)' : 'var(--dark-border)'}`,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    background: answers[q.id] === opt ? 'var(--primary)' : 'transparent',
                                                    transition: 'all 0.3s', flexShrink: 0
                                                }}>
                                                    {answers[q.id] === opt && <span style={{ color: 'white', fontSize: '0.7rem', fontWeight: 700 }}>✓</span>}
                                                </div>
                                                <span style={{ fontWeight: 500, color: answers[q.id] === opt ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                                    {q[`option_${opt.toLowerCase()}`]}
                                                </span>
                                            </div>
                                        ))}

                                        {/* Navigation + mark */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, gap: 10, flexWrap: 'wrap' }}>
                                            <button onClick={() => setCurrentQ(Math.max(0, currentQ - 1))} disabled={currentQ === 0}
                                                style={{
                                                    padding: '10px 18px', borderRadius: 10, border: '1px solid var(--dark-border)',
                                                    background: 'transparent', color: currentQ === 0 ? 'var(--dark-border)' : 'var(--text-secondary)',
                                                    cursor: currentQ === 0 ? 'default' : 'pointer', fontWeight: 600, fontSize: '0.85rem',
                                                    display: 'flex', alignItems: 'center', gap: 6
                                                }}>
                                                <FiChevronLeft size={16} /> Previous
                                            </button>

                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button onClick={() => toggleMark(q.id)}
                                                    style={{
                                                        padding: '10px 16px', borderRadius: 10,
                                                        border: `1px solid ${marked.has(q.id) ? '#F59E0B' : 'var(--dark-border)'}`,
                                                        background: marked.has(q.id) ? 'rgba(245,158,11,0.10)' : 'transparent',
                                                        color: marked.has(q.id) ? '#F59E0B' : 'var(--text-muted)',
                                                        cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem',
                                                        display: 'flex', alignItems: 'center', gap: 6
                                                    }}>
                                                    <FiFlag size={14} /> {marked.has(q.id) ? 'Unmark' : 'Mark for Review'}
                                                </button>
                                                {answers[q.id] && (
                                                    <button onClick={() => { const next = { ...answers }; delete next[q.id]; setAnswers(next); }}
                                                        style={{
                                                            padding: '10px 16px', borderRadius: 10,
                                                            border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.06)',
                                                            color: 'var(--danger)', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem'
                                                        }}>
                                                        Clear
                                                    </button>
                                                )}
                                            </div>

                                            {currentQ < questions.length - 1 ? (
                                                <button onClick={() => setCurrentQ(currentQ + 1)}
                                                    style={{
                                                        padding: '10px 18px', borderRadius: 10, border: '1px solid var(--primary)',
                                                        background: 'rgba(124,58,237,0.08)', color: 'var(--primary)',
                                                        cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
                                                        display: 'flex', alignItems: 'center', gap: 6
                                                    }}>
                                                    Next <FiChevronRight size={16} />
                                                </button>
                                            ) : (
                                                <button onClick={() => setShowReport(true)} className="btn-primary"
                                                    style={{ padding: '10px 18px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <FiSend size={14} /> Finish
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Bottom bar */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                    {answeredCount}/{questions.length} answered &bull; {markedCount} marked
                                </span>
                                <button onClick={() => setShowReport(true)} style={{
                                    padding: '10px 20px', borderRadius: 10, border: '1px solid var(--primary)',
                                    background: 'rgba(124,58,237,0.08)', color: 'var(--primary)',
                                    cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem'
                                }}>
                                    Review & Submit
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
