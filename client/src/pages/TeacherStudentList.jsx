import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePageEntrance } from '../animations/GsapAnimations';
import { useRealtime } from '../hooks/useRealtime';
import api from '../lib/api';
import {
    FiArrowLeft, FiSearch, FiUser, FiAward, FiFileText,
    FiCheckSquare, FiClock, FiPercent, FiRefreshCw
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function TeacherStudentList() {
    const { year, section, gender } = useParams(); // gender: 'boys' or 'girls'
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [reassignModal, setReassignModal] = useState(null);
    const [assignments, setAssignments] = useState([]);
    const [reassignAssignment, setReassignAssignment] = useState('');
    const [reassignLoading, setReassignLoading] = useState(false);
    const pageRef = usePageEntrance();

    const genderFilter = gender === 'boys' ? 'male' : 'female';
    const genderLabel = gender === 'boys' ? 'Boys' : 'Girls';
    const genderColor = gender === 'boys' ? '#3B82F6' : '#EC4899';

    const fetchStudents = async () => {
        try {
            const res = await api.get(`/teacher/classes/${encodeURIComponent(year)}/${encodeURIComponent(section)}/students?gender=${genderFilter}`);
            setStudents(res.data.students || []);
        } catch (err) {
            toast.error('Failed to load students');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
        api.get('/assignments').then(res => setAssignments(res.data.assignments || [])).catch(() => {});
    }, [year, section, gender]);

    // Realtime
    useRealtime('submissions', {
        onInsert: useCallback(() => { fetchStudents(); }, [year, section, gender])
    });

    const filteredStudents = students.filter(s =>
        (s.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.register_number || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.email || '').toLowerCase().includes(search.toLowerCase())
    );

    const handleReassignStudent = async () => {
        if (!reassignAssignment) return toast.error('Select an assignment');
        setReassignLoading(true);
        try {
            await api.post('/teacher/reassign', {
                assignment_id: reassignAssignment,
                student_id: reassignModal.id
            });
            toast.success(`Reassigned for ${reassignModal.full_name}`);
            setReassignModal(null);
            setReassignAssignment('');
            fetchStudents();
        } catch (err) {
            toast.error('Failed to reassign');
        } finally {
            setReassignLoading(false);
        }
    };

    return (
        <div ref={pageRef}>
            {/* Header */}
            <div className="page-header animate-section">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
                    <button
                        onClick={() => navigate(`/teacher/class/${encodeURIComponent(year)}/${encodeURIComponent(section)}`)}
                        className="btn-secondary"
                        style={{ padding: '10px 12px', display: 'flex', alignItems: 'center' }}
                    >
                        <FiArrowLeft size={18} />
                    </button>
                    <div>
                        <h1>
                            <span className="gradient-text">{year} Year Section {section}</span>
                            <span style={{ color: genderColor, marginLeft: 8 }}>- {genderLabel}</span>
                        </h1>
                        <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>
                            {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>

                {/* Search */}
                <div style={{ position: 'relative', maxWidth: 400 }}>
                    <FiSearch size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        className="input-field"
                        placeholder="Search by name, register number, or email..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ paddingLeft: 40 }}
                    />
                </div>
            </div>

            {/* Student Grid */}
            {loading ? (
                <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)' }}>Loading students...</p>
                </div>
            ) : filteredStudents.length === 0 ? (
                <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
                    <FiUser size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
                    <p style={{ color: 'var(--text-muted)' }}>
                        {search ? 'No students match your search' : `No ${genderLabel.toLowerCase()} found in this class`}
                    </p>
                </div>
            ) : (
                <div className="student-list-grid animate-section">
                    {filteredStudents.map(student => {
                        const progress = student.total_assignments > 0
                            ? Math.round((student.assignments_completed / student.total_assignments) * 100)
                            : 0;

                        return (
                            <div key={student.id} className="glass-card reveal-item student-card-hover" style={{ padding: 0, overflow: 'hidden' }}>
                                {/* Header strip */}
                                <div style={{
                                    background: `linear-gradient(135deg, ${genderColor}20 0%, ${genderColor}08 100%)`,
                                    padding: '16px 20px',
                                    borderBottom: `1px solid ${genderColor}15`
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{
                                            width: 44, height: 44, borderRadius: '50%',
                                            background: `${genderColor}20`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: genderColor, fontWeight: 700, fontSize: '1rem', fontFamily: 'Outfit'
                                        }}>
                                            {student.full_name?.charAt(0)?.toUpperCase() || '?'}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 600, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {student.full_name}
                                            </div>
                                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {student.register_number || student.email}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Stats Body */}
                                <div style={{ padding: '16px 20px' }}>
                                    {/* Progress bar */}
                                    <div style={{ marginBottom: 14 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Progress</span>
                                            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: genderColor }}>{progress}%</span>
                                        </div>
                                        <div style={{ height: 5, borderRadius: 3, background: 'rgba(124,58,237,0.06)' }}>
                                            <div style={{
                                                height: '100%', borderRadius: 3,
                                                background: progress >= 80 ? '#10B981' : progress >= 50 ? '#F59E0B' : '#EF4444',
                                                width: `${progress}%`, transition: 'width 0.8s ease'
                                            }} />
                                        </div>
                                    </div>

                                    {/* Stat items */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <FiFileText size={14} style={{ color: '#3B82F6' }} />
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{student.assignments_completed}/{student.total_assignments}</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Completed</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <FiAward size={14} style={{ color: '#10B981' }} />
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{student.avg_score}%</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Avg Score</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <FiCheckSquare size={14} style={{ color: 'var(--primary)' }} />
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{student.evaluated_count}</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Evaluated</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <FiClock size={14} style={{ color: '#F59E0B' }} />
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{student.late_count}</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Late</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <button
                                        onClick={() => setReassignModal(student)}
                                        className="btn-secondary"
                                        style={{
                                            width: '100%', padding: '8px 14px', fontSize: '0.82rem',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                                        }}
                                    >
                                        <FiRefreshCw size={14} /> Reassign Activity
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Reassign Modal for individual student */}
            {reassignModal && (
                <div className="modal-overlay" onClick={() => { setReassignModal(null); setReassignAssignment(''); }}>
                    <div className="glass" style={{ maxWidth: 450, width: '90%', padding: 32 }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, marginBottom: 8 }}>
                            <span className="gradient-text">Reassign Activity</span>
                        </h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 20 }}>
                            For: <strong>{reassignModal.full_name}</strong>
                        </p>

                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                Select Assignment to Reassign
                            </label>
                            <select
                                className="input-field"
                                value={reassignAssignment}
                                onChange={e => setReassignAssignment(e.target.value)}
                            >
                                <option value="">-- Choose assignment --</option>
                                {assignments.map(a => (
                                    <option key={a.id} value={a.id}>{a.title} ({a.type.toUpperCase()})</option>
                                ))}
                            </select>
                        </div>

                        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 20, lineHeight: 1.5 }}>
                            This will delete the student's existing submission for this assignment, allowing them to resubmit.
                        </p>

                        <div style={{ display: 'flex', gap: 12 }}>
                            <button
                                onClick={handleReassignStudent}
                                className="btn-primary"
                                style={{ flex: 1 }}
                                disabled={reassignLoading || !reassignAssignment}
                            >
                                <span>{reassignLoading ? 'Reassigning...' : 'Reassign'}</span>
                            </button>
                            <button onClick={() => { setReassignModal(null); setReassignAssignment(''); }} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
