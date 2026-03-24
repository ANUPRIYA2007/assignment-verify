import { useState, useEffect } from 'react';
import { usePageEntrance } from '../animations/GsapAnimations';
import api from '../lib/api';
import { FiClock, FiCheck, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function TeacherLateRequests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const pageRef = usePageEntrance();

    const fetchRequests = async () => {
        try {
            const res = await api.get('/late-requests');
            setRequests(res.data.late_requests || []);
        } catch (err) {
            toast.error('Failed to load late requests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRequests(); }, []);

    const handleReview = async (id, status) => {
        try {
            await api.put(`/late-requests/${id}`, { status });
            toast.success(`Request ${status}`);
            fetchRequests();
        } catch (err) {
            toast.error('Failed to update request');
        }
    };

    return (
        <div ref={pageRef}>
            <div className="page-header animate-section">
                <h1><span className="gradient-text">Late Requests</span></h1>
                <p>Review late submission reasons from students</p>
            </div>

            {loading ? (
                <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}><p style={{ color: 'var(--text-muted)' }}>Loading...</p></div>
            ) : requests.length === 0 ? (
                <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
                    <FiClock size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
                    <p style={{ color: 'var(--text-muted)' }}>No late requests</p>
                </div>
            ) : (
                <div className="animate-section" style={{ display: 'grid', gap: 12 }}>
                    {requests.map(r => (
                        <div key={r.id} className="glass-card reveal-item" style={{ padding: '20px 24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                <div>
                                    <h3 style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 4 }}>
                                        {r.users?.full_name || 'Student'}
                                    </h3>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{r.users?.email}</span>
                                    {r.submissions?.assignments?.title && (
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 4 }}>
                                            Assignment: <span style={{ fontWeight: 500 }}>{r.submissions.assignments.title}</span>
                                        </p>
                                    )}
                                </div>
                                <span className={`badge badge-${r.status}`}>{r.status}</span>
                            </div>

                            <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(255,184,0,0.06)', border: '1px solid rgba(255,184,0,0.12)', marginBottom: 14 }}>
                                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                                    <strong style={{ color: 'var(--warning)' }}>Reason:</strong> {r.reason}
                                </p>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                                    Submitted: {new Date(r.created_at).toLocaleString()}
                                </span>
                                {r.status === 'pending' && (
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button onClick={() => handleReview(r.id, 'approved')} className="btn-success" style={{ padding: '8px 16px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <FiCheck size={14} /> Approve
                                        </button>
                                        <button onClick={() => handleReview(r.id, 'rejected')} className="btn-danger" style={{ padding: '8px 16px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <FiX size={14} /> Reject
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
