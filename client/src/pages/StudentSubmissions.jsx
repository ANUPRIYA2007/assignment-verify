import { useState, useEffect } from 'react';
import { usePageEntrance } from '../animations/GsapAnimations';
import api from '../lib/api';
import { FiInbox, FiFileText, FiCheckSquare, FiDownload } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function StudentSubmissions() {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const pageRef = usePageEntrance();

    useEffect(() => {
        const fetchSubmissions = async () => {
            try {
                const res = await api.get('/submissions/my');
                setSubmissions(res.data.submissions || []);
            } catch (err) {
                toast.error('Failed to load submissions');
            } finally {
                setLoading(false);
            }
        };
        fetchSubmissions();
    }, []);

    return (
        <div ref={pageRef}>
            <div className="page-header animate-section">
                <h1><span className="gradient-text">My Submissions</span></h1>
                <p>Track all your submitted assignments</p>
            </div>

            {loading ? (
                <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}><p style={{ color: 'var(--text-muted)' }}>Loading...</p></div>
            ) : submissions.length === 0 ? (
                <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
                    <FiInbox size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
                    <p style={{ color: 'var(--text-muted)' }}>No submissions yet</p>
                </div>
            ) : (
                <div className="glass-card animate-section" style={{ overflow: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Assignment</th>
                                <th>Type</th>
                                <th>Submitted</th>
                                <th>Status</th>
                                <th>Late</th>
                                <th>Marks</th>
                                <th>File</th>
                            </tr>
                        </thead>
                        <tbody>
                            {submissions.map(s => (
                                <tr key={s.id} className="reveal-item">
                                    <td style={{ fontWeight: 500 }}>{s.assignments?.title || 'N/A'}</td>
                                    <td><span className={`badge badge-${s.assignments?.type || 'file'}`}>{(s.assignments?.type || 'file').toUpperCase()}</span></td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{new Date(s.submitted_at).toLocaleString()}</td>
                                    <td><span className={`badge badge-${s.status}`}>{s.status}</span></td>
                                    <td>{s.is_late ? <span className="badge badge-late">Late</span> : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                                    <td style={{ fontWeight: 600, color: s.marks_obtained !== null ? 'var(--accent)' : 'var(--text-muted)' }}>
                                        {s.marks_obtained !== null ? s.marks_obtained : '—'} / {s.assignments?.total_marks || '—'}
                                    </td>
                                    <td>
                                        {s.file_url && (
                                            <a href={s.file_url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-light)', textDecoration: 'none' }}>
                                                <FiDownload size={16} />
                                            </a>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
