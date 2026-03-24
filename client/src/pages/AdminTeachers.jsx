import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { usePageEntrance } from '../animations/GsapAnimations';
import { useRealtime } from '../hooks/useRealtime';
import api from '../lib/api';
import {
    FiUsers, FiPlus, FiTrash2, FiBookOpen, FiChevronDown,
    FiChevronUp, FiLayers, FiFileText, FiSearch
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function AdminTeachers() {
    const [teachers, setTeachers] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [teacherAssignments, setTeacherAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedTeacher, setExpandedTeacher] = useState(null);
    const [teacherDetails, setTeacherDetails] = useState({});
    const [showAssignModal, setShowAssignModal] = useState(null);
    const [assignForm, setAssignForm] = useState({ year: '1st', section: '', subject_id: '', academic_year: '2025-2026' });
    const [search, setSearch] = useState('');
    const [showSubjectPanel, setShowSubjectPanel] = useState(false);
    const [newSubject, setNewSubject] = useState({ name: '', code: '' });
    const pageRef = usePageEntrance();

    const fetchData = useCallback(async () => {
        try {
            const [tRes, sRes, taRes] = await Promise.all([
                api.get('/admin/users?role=teacher'),
                api.get('/admin/subjects'),
                api.get('/admin/teacher-assignments')
            ]);
            setTeachers(tRes.data.users || []);
            setSubjects(sRes.data.subjects || []);
            setTeacherAssignments(taRes.data.teacher_assignments || []);
        } catch (err) {
            toast.error('Failed to load teachers');
        } finally { setLoading(false); }
    }, []);

    useEffect(() => {
        fetchData();
        
        // Refresh every 3 seconds for live updates
        const interval = setInterval(fetchData, 3000);
        return () => clearInterval(interval);
    }, [fetchData]);

    // Real-time subscriptions for teacher assignments
    useRealtime('users', { onInsert: fetchData, onUpdate: fetchData, onDelete: fetchData, enabled: true });
    useRealtime('teacher_assignments', { onInsert: fetchData, onUpdate: fetchData, onDelete: fetchData, enabled: true });
    useRealtime('subjects', { onInsert: fetchData, onUpdate: fetchData, onDelete: fetchData, enabled: true });

    const fetchTeacherDetail = async (teacherId) => {
        if (expandedTeacher === teacherId) { setExpandedTeacher(null); return; }
        try {
            const res = await api.get(`/admin/teachers/${teacherId}`);
            setTeacherDetails(prev => ({ ...prev, [teacherId]: res.data }));
            setExpandedTeacher(teacherId);
        } catch (err) {
            toast.error('Failed to load teacher details');
        }
    };

    const handleAssignTeacher = async (e) => {
        e.preventDefault();
        if (!assignForm.section) return toast.error('Section is required');
        try {
            console.log('🎓 Assigning teacher:', showAssignModal, assignForm);
            const response = await api.post('/admin/teacher-assignments', {
                teacher_id: showAssignModal,
                ...assignForm,
                subject_id: assignForm.subject_id || null
            });
            console.log('✅ Teacher assigned successfully:', response.data);
            toast.success('Teacher assigned to class');
            setShowAssignModal(null);
            setAssignForm({ year: '1st', section: '', subject_id: '', academic_year: '2025-2026' });
            fetchData();
            if (expandedTeacher === showAssignModal) {
                const res = await api.get(`/admin/teachers/${showAssignModal}`);
                setTeacherDetails(prev => ({ ...prev, [showAssignModal]: res.data }));
            }
        } catch (err) {
            console.error('❌ Teacher assignment error:', err.response?.data || err.message);
            toast.error('Failed to assign teacher');
        }
    };

    const handleRemoveAssignment = async (taId, teacherId) => {
        if (!confirm('Remove this teacher assignment?')) return;
        try {
            await api.delete(`/admin/teacher-assignments/${taId}`);
            toast.success('Assignment removed');
            fetchData();
            if (expandedTeacher === teacherId) {
                const res = await api.get(`/admin/teachers/${teacherId}`);
                setTeacherDetails(prev => ({ ...prev, [teacherId]: res.data }));
            }
        } catch (err) {
            toast.error('Failed to remove');
        }
    };

    const handleAddSubject = async (e) => {
        e.preventDefault();
        if (!newSubject.name) return toast.error('Subject name required');
        try {
            await api.post('/admin/subjects', newSubject);
            toast.success('Subject added');
            setNewSubject({ name: '', code: '' });
            fetchData();
        } catch (err) {
            toast.error('Failed to add subject');
        }
    };

    const handleDeleteSubject = async (id) => {
        if (!confirm('Delete this subject?')) return;
        try {
            await api.delete(`/admin/subjects/${id}`);
            toast.success('Subject deleted');
            fetchData();
        } catch (err) {
            toast.error('Failed to delete subject');
        }
    };

    const filteredTeachers = teachers.filter(t =>
        t.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        t.email?.toLowerCase().includes(search.toLowerCase())
    );

    const getTeacherAssignmentCount = (teacherId) =>
        teacherAssignments.filter(ta => ta.teacher_id === teacherId).length;

    const cardColors = [
        'linear-gradient(135deg,#10B981,#6EE7B7)',
        'linear-gradient(135deg,#3B82F6,#93C5FD)',
        'linear-gradient(135deg,#7C3AED,#A78BFA)',
        'linear-gradient(135deg,#F59E0B,#FCD34D)',
        'linear-gradient(135deg,#06B6D4,#67E8F9)',
        'linear-gradient(135deg,#EF4444,#FCA5A5)',
        'linear-gradient(135deg,#EC4899,#F9A8D4)',
        'linear-gradient(135deg,#8B5CF6,#C4B5FD)',
    ];

    return (
        <div ref={pageRef}>
            <div className="page-header animate-section">
                <h1><span className="gradient-text">Teacher Management</span></h1>
                <p>Assign teachers to classes and subjects</p>
            </div>

            {/* Controls */}
            <div className="animate-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div style={{ position: 'relative' }}>
                    <FiSearch size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="text" placeholder="Search teachers..." value={search} onChange={e => setSearch(e.target.value)}
                        className="input-field" style={{ paddingLeft: 34, width: 260, height: 38, fontSize: '0.82rem' }} />
                </div>
                <button onClick={() => setShowSubjectPanel(!showSubjectPanel)} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FiBookOpen size={14} /> Manage Subjects ({subjects.length})
                </button>
            </div>

            {/* Subject Management Panel */}
            {showSubjectPanel && (
                <div className="glass-card animate-section" style={{ padding: 24, marginBottom: 24 }}>
                    <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.05rem', marginBottom: 16 }}>
                        <FiBookOpen style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--primary)' }} />
                        Subjects
                    </h3>
                    <form onSubmit={handleAddSubject} style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                        <input type="text" placeholder="Subject name" value={newSubject.name} onChange={e => setNewSubject({ ...newSubject, name: e.target.value })}
                            className="input-field" style={{ flex: 1, minWidth: 180, height: 38 }} />
                        <input type="text" placeholder="Code (optional)" value={newSubject.code} onChange={e => setNewSubject({ ...newSubject, code: e.target.value.toUpperCase() })}
                            className="input-field" style={{ width: 120, height: 38 }} />
                        <button type="submit" className="btn-primary" style={{ height: 38, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <FiPlus size={14} /> Add
                        </button>
                    </form>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {subjects.map(s => (
                            <div key={s.id} style={{
                                display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 8,
                                background: 'rgba(124,58,237,0.08)', fontSize: '0.85rem'
                            }}>
                                <span style={{ fontWeight: 600 }}>{s.name}</span>
                                {s.code && <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>({s.code})</span>}
                                <button onClick={() => handleDeleteSubject(s.id)} style={{
                                    background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '2px'
                                }}><FiTrash2 size={12} /></button>
                            </div>
                        ))}
                        {subjects.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No subjects added yet</p>}
                    </div>
                </div>
            )}

            {/* Teacher Cards */}
            {loading ? (
                <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)' }}>Loading teachers...</p>
                </div>
            ) : filteredTeachers.length === 0 ? (
                <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
                    <FiUsers size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
                    <p style={{ color: 'var(--text-muted)' }}>No teachers found</p>
                </div>
            ) : (
                <div className="admin-class-grid animate-section">
                    {filteredTeachers.map((teacher, idx) => {
                        const bg = cardColors[idx % cardColors.length];
                        const taCount = getTeacherAssignmentCount(teacher.id);
                        const isExpanded = expandedTeacher === teacher.id;
                        const detail = teacherDetails[teacher.id];
                        return (
                            <div key={teacher.id} className="glass-card reveal-item" style={{ overflow: 'hidden', padding: 0 }}>
                                <div style={{ background: bg, padding: '18px 22px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
                                    <div style={{ position: 'absolute', top: -20, right: -20, width: 70, height: 70, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative', zIndex: 1 }}>
                                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.2)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem' }}>
                                            {teacher.full_name?.charAt(0)?.toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1rem', marginBottom: 2 }}>{teacher.full_name}</h3>
                                            <p style={{ fontSize: '0.78rem', opacity: 0.85 }}>{teacher.email}</p>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ padding: '16px 22px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: '0.85rem' }}>
                                        <span style={{ color: 'var(--text-muted)' }}><FiLayers size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} /> {taCount} Class{taCount !== 1 ? 'es' : ''}</span>
                                        <span style={{ color: 'var(--text-muted)' }}><FiFileText size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} /> {detail?.assignments?.length || '...'} Tests</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button onClick={() => setShowAssignModal(teacher.id)} className="btn-primary" style={{
                                            flex: 1, padding: '8px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4
                                        }}>
                                            <FiPlus size={13} /> Assign
                                        </button>
                                        <button onClick={() => fetchTeacherDetail(teacher.id)} className="btn-secondary" style={{
                                            flex: 1, padding: '8px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4
                                        }}>
                                            Details {isExpanded ? <FiChevronUp size={13} /> : <FiChevronDown size={13} />}
                                        </button>
                                    </div>

                                    {/* Expanded Details */}
                                    {isExpanded && detail && (
                                        <div style={{ marginTop: 14, padding: '14px', background: 'rgba(124,58,237,0.04)', borderRadius: 10, fontSize: '0.83rem' }}>
                                            <h4 style={{ fontWeight: 700, marginBottom: 10, fontSize: '0.85rem' }}>Assigned Classes</h4>
                                            {detail.class_assignments?.length > 0 ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                                                    {detail.class_assignments.map(ca => (
                                                        <div key={ca.id} style={{
                                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                            padding: '8px 12px', background: '#fff', borderRadius: 8, border: '1px solid var(--border-light)'
                                                        }}>
                                                            <div>
                                                                <span style={{ fontWeight: 600 }}>{ca.year} Year - Sec {ca.section}</span>
                                                                {ca.subjects?.name && <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>• {ca.subjects.name}</span>}
                                                                <span style={{ color: 'var(--text-muted)', marginLeft: 8, fontSize: '0.78rem' }}>{ca.academic_year}</span>
                                                            </div>
                                                            <button onClick={() => handleRemoveAssignment(ca.id, teacher.id)} style={{
                                                                background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer'
                                                            }}><FiTrash2 size={13} /></button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : <p style={{ color: 'var(--text-muted)', marginBottom: 14 }}>No classes assigned</p>}

                                            <h4 style={{ fontWeight: 700, marginBottom: 8, fontSize: '0.85rem' }}>Recent Tests ({detail.assignments?.length || 0})</h4>
                                            {detail.assignments?.slice(0, 5).map(a => (
                                                <div key={a.id} style={{ padding: '6px 0', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between' }}>
                                                    <span>{a.title}</span>
                                                    <span style={{ color: 'var(--text-muted)' }}>{a.target_year} {a.target_section}</span>
                                                </div>
                                            ))}
                                            {(!detail.assignments || detail.assignments.length === 0) && (
                                                <p style={{ color: 'var(--text-muted)' }}>No tests created</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Assign Teacher Modal */}
            {showAssignModal && (
                <div className="modal-overlay" onClick={() => setShowAssignModal(null)}>
                    <div className="glass-card" style={{ maxWidth: 440, width: '90%', padding: 32 }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, marginBottom: 4 }}>
                            <span className="gradient-text">Assign Teacher to Class</span>
                        </h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 20 }}>
                            {teachers.find(t => t.id === showAssignModal)?.full_name}
                        </p>
                        <form onSubmit={handleAssignTeacher}>
                            <div style={{ marginBottom: 14 }}>
                                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Year</label>
                                <select value={assignForm.year} onChange={e => setAssignForm({ ...assignForm, year: e.target.value })} className="input-field" style={{ width: '100%' }}>
                                    {['1st','2nd','3rd','Final'].map(y => <option key={y} value={y}>{y} Year</option>)}
                                </select>
                            </div>
                            <div style={{ marginBottom: 14 }}>
                                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Section</label>
                                <input type="text" placeholder="E.g. A, B, CS1" value={assignForm.section}
                                    onChange={e => setAssignForm({ ...assignForm, section: e.target.value.toUpperCase() })}
                                    className="input-field" style={{ width: '100%' }} />
                            </div>
                            <div style={{ marginBottom: 14 }}>
                                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Subject (optional)</label>
                                <select value={assignForm.subject_id} onChange={e => setAssignForm({ ...assignForm, subject_id: e.target.value })} className="input-field" style={{ width: '100%' }}>
                                    <option value="">— No specific subject —</option>
                                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name} {s.code ? `(${s.code})` : ''}</option>)}
                                </select>
                            </div>
                            <div style={{ marginBottom: 20 }}>
                                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Academic Year</label>
                                <input type="text" placeholder="2025-2026" value={assignForm.academic_year}
                                    onChange={e => setAssignForm({ ...assignForm, academic_year: e.target.value })}
                                    className="input-field" style={{ width: '100%' }} />
                            </div>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <button type="submit" className="btn-primary" style={{ flex: 1 }}><span>Assign</span></button>
                                <button type="button" onClick={() => setShowAssignModal(null)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
