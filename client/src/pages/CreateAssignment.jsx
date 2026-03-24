import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageEntrance } from '../animations/GsapAnimations';
import api from '../lib/api';
import gsap from 'gsap';
import { FiFileText, FiCheckSquare, FiPlusCircle, FiTrash2, FiSave, FiAward, FiClock } from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';

export default function CreateAssignment() {
    const [form, setForm] = useState({
        title: '', description: '', type: 'file', deadline: '', total_marks: 100,
        mcq_duration: 30, result_publish_date: '',
        target_year: new URLSearchParams(window.location.search).get('year') || '',
        target_section: new URLSearchParams(window.location.search).get('section') || '',
        points_ontime: 10,
        points_late: 5,
        subject: '',
        assign_to: 'all'
    });
    const [questions, setQuestions] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const pageRef = usePageEntrance();

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const res = await api.get('/auth/classes');
                setClasses(res.data.classes || []);
            } catch (err) {
                console.error('Failed to load classes');
            }
        };
        fetchClasses();
    }, []);

    const availableSections = classes.filter(c => c.year === form.target_year);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'target_year') {
            setForm({ ...form, target_year: value, target_section: '' });
        } else {
            setForm({ ...form, [name]: value });
        }
    };

    const addQuestion = () => {
        setQuestions([...questions, {
            question_text: '', option_a: '', option_b: '', option_c: '', option_d: '',
            correct_answer: 'A', marks: 1
        }]);
    };

    const updateQuestion = (idx, field, value) => {
        const updated = [...questions];
        updated[idx][field] = value;
        setQuestions(updated);
    };

    const removeQuestion = (idx) => {
        setQuestions(questions.filter((_, i) => i !== idx));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title || !form.deadline) return toast.error('Title and deadline are required');
        if (form.type === 'mcq' && questions.length === 0) return toast.error('Add at least one question');

        setLoading(true);
        try {
            const payload = {
                title: form.title,
                description: form.description || null,
                type: form.type,
                deadline: form.deadline,
                total_marks: parseInt(form.total_marks) || 100,
                result_publish_date: form.result_publish_date || null,
                target_year: form.target_year || null,
                target_section: form.target_section || null,
                points_ontime: parseInt(form.points_ontime) || 10,
                points_late: parseInt(form.points_late) || 5,
                subject: form.subject || null,
                assign_to: form.assign_to || 'all'
            };
            if (form.type === 'mcq') {
                payload.mcq_duration = parseInt(form.mcq_duration) || 30;
                payload.questions = questions.map(q => ({ ...q, marks: parseInt(q.marks) }));
            }
            await api.post('/assignments', payload);
            toast.success('Assignment created!');
            setTimeout(() => navigate('/teacher/assignments'), 500);
        } catch (err) {
            toast.error(err.response?.data?.details || err.response?.data?.error || 'Failed to create');
        } finally {
            setLoading(false);
        }
    };

    const labelStyle = { display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '0.85rem', color: 'var(--text-secondary)' };

    return (
        <div ref={pageRef}>
            <Toaster position="top-right" toastOptions={{ style: { background: '#fff', color: '#1E1B3A', border: '1px solid #E5E0F6', borderRadius: 12 } }} />

            <div className="page-header animate-section">
                <h1><span className="gradient-text">Create Assignment</span></h1>
                <p>Set up a new assignment for students</p>
            </div>

            <form onSubmit={handleSubmit}>
                {/* ── Basic Information ── */}
                <div className="glass-card animate-section" style={{ padding: 28, marginBottom: 20 }}>
                    <h3 style={{ fontWeight: 600, marginBottom: 20, fontFamily: 'Outfit' }}>Basic Information</h3>

                    <div style={{ display: 'grid', gap: 16 }}>
                        <div>
                            <label style={labelStyle}>Title *</label>
                            <input name="title" className="input-field" placeholder="Assignment title" value={form.title} onChange={handleChange} />
                        </div>
                        <div>
                            <label style={labelStyle}>Subject</label>
                            <input name="subject" className="input-field" placeholder="e.g. Mathematics, Physics, English" value={form.subject} onChange={handleChange} />
                        </div>
                        <div>
                            <label style={labelStyle}>Description</label>
                            <textarea name="description" className="input-field" placeholder="Assignment description" value={form.description} onChange={handleChange} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                            <div>
                                <label style={labelStyle}>Type</label>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    {[{ value: 'file', icon: FiFileText, label: 'File Upload' }, { value: 'mcq', icon: FiCheckSquare, label: 'MCQ Test' }].map(t => (
                                        <button key={t.value} type="button" onClick={() => setForm({ ...form, type: t.value })} style={{
                                            flex: 1, padding: '12px', borderRadius: 10,
                                            border: `1px solid ${form.type === t.value ? 'var(--primary)' : 'var(--dark-border)'}`,
                                            background: form.type === t.value ? 'rgba(108,99,255,0.12)' : 'transparent',
                                            color: form.type === t.value ? 'var(--primary-light)' : 'var(--text-muted)',
                                            cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.3s'
                                        }}>
                                            <t.icon size={16} />{t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label style={labelStyle}>Total Marks</label>
                                <input name="total_marks" type="number" className="input-field" value={form.total_marks} onChange={handleChange} />
                            </div>
                            <div>
                                <label style={labelStyle}>Deadline *</label>
                                <input name="deadline" type="datetime-local" className="input-field" value={form.deadline} onChange={handleChange} />
                            </div>
                            <div>
                                <label style={labelStyle}>Result Publish Date</label>
                                <input name="result_publish_date" type="datetime-local" className="input-field" value={form.result_publish_date} onChange={handleChange} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Points Configuration ── */}
                <div className="glass-card animate-section" style={{ padding: 28, marginBottom: 20 }}>
                    <h3 style={{ fontWeight: 600, marginBottom: 8, fontFamily: 'Outfit', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <FiAward size={20} style={{ color: 'var(--primary-light)' }} />
                        Points Configuration
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 20 }}>Define how many points students earn for on-time or late submissions</p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        {/* On-time points */}
                        <div style={{
                            padding: 24, borderRadius: 14,
                            background: 'rgba(0, 214, 143, 0.06)',
                            border: '1px solid rgba(0, 214, 143, 0.2)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(0, 214, 143, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <FiAward size={18} style={{ color: 'var(--success)' }} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>On-Time Submission</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Points for submitting before deadline</div>
                                </div>
                            </div>
                            <input name="points_ontime" type="number" className="input-field" min="0" placeholder="e.g. 10" value={form.points_ontime} onChange={handleChange}
                                style={{ fontSize: '1.1rem', fontWeight: 700, textAlign: 'center' }} />
                        </div>

                        {/* Late submission points */}
                        <div style={{
                            padding: 24, borderRadius: 14,
                            background: 'rgba(255, 165, 0, 0.06)',
                            border: '1px solid rgba(255, 165, 0, 0.2)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255, 165, 0, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <FiClock size={18} style={{ color: '#ffa500' }} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Late Submission</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Reduced points for late submissions</div>
                                </div>
                            </div>
                            <input name="points_late" type="number" className="input-field" min="0" placeholder="e.g. 5" value={form.points_late} onChange={handleChange}
                                style={{ fontSize: '1.1rem', fontWeight: 700, textAlign: 'center' }} />
                        </div>
                    </div>
                </div>

                {/* ── Target Year & Section ── */}
                <div className="glass-card animate-section" style={{ padding: 28, marginBottom: 20 }}>
                    <h3 style={{ fontWeight: 600, marginBottom: 8, fontFamily: 'Outfit' }}>Target Audience</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 20 }}>Choose which year & section this assignment is for</p>

                    <div style={{ marginBottom: 20 }}>
                        <label style={labelStyle}>Target Year</label>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            <button type="button" onClick={() => setForm({ ...form, target_year: '', target_section: '' })}
                                style={{
                                    padding: '12px 20px', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.3s',
                                    border: `1.5px solid ${!form.target_year ? 'var(--primary)' : 'var(--dark-border)'}`,
                                    background: !form.target_year ? 'rgba(108,99,255,0.15)' : 'transparent',
                                    color: !form.target_year ? 'var(--primary-light)' : 'var(--text-muted)'
                                }}>
                                All Years
                            </button>
                            {['1st', '2nd', '3rd', 'Final'].map(y => (
                                <button key={y} type="button" onClick={() => setForm({ ...form, target_year: y, target_section: '' })}
                                    style={{
                                        padding: '12px 20px', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.3s',
                                        border: `1.5px solid ${form.target_year === y ? 'var(--primary)' : 'var(--dark-border)'}`,
                                        background: form.target_year === y ? 'rgba(108,99,255,0.15)' : 'transparent',
                                        color: form.target_year === y ? 'var(--primary-light)' : 'var(--text-muted)'
                                    }}>
                                    {y} Year
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Available Sections — shown only when a year is selected */}
                    {form.target_year && (
                        <div>
                            <label style={labelStyle}>Available Sections for {form.target_year} Year</label>
                            {availableSections.length === 0 ? (
                                <div style={{ padding: 24, textAlign: 'center', border: '2px dashed var(--dark-border)', borderRadius: 12, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    No sections found for {form.target_year} Year. Add sections in Admin → Class Setup.
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
                                    {/* "All Sections" option */}
                                    <button type="button" onClick={() => setForm({ ...form, target_section: '' })}
                                        style={{
                                            padding: '16px 14px', borderRadius: 12, cursor: 'pointer', transition: 'all 0.3s', textAlign: 'center',
                                            border: `1.5px solid ${!form.target_section ? 'var(--info)' : 'var(--dark-border)'}`,
                                            background: !form.target_section ? 'rgba(0,180,216,0.1)' : 'rgba(10,10,20,0.3)',
                                            color: !form.target_section ? 'var(--info)' : 'var(--text-muted)'
                                        }}>
                                        <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>All</div>
                                        <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>All Sections</div>
                                    </button>

                                    {/* Individual section cards */}
                                    {availableSections.map(s => {
                                        const isSelected = form.target_section === s.section;
                                        const totalStudents = (s.total_boys || 0) + (s.total_girls || 0);
                                        return (
                                            <button key={s.id} type="button" onClick={() => setForm({ ...form, target_section: s.section })}
                                                style={{
                                                    padding: '16px 14px', borderRadius: 12, cursor: 'pointer', transition: 'all 0.3s', textAlign: 'center',
                                                    border: `1.5px solid ${isSelected ? 'var(--primary)' : 'var(--dark-border)'}`,
                                                    background: isSelected ? 'rgba(108,99,255,0.15)' : 'rgba(10,10,20,0.3)',
                                                    color: isSelected ? 'var(--primary-light)' : 'var(--text-secondary)'
                                                }}>
                                                <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 4 }}>Section {s.section}</div>
                                                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>{totalStudents} students</div>
                                                <div style={{ fontSize: '0.7rem', opacity: 0.6, marginTop: 2 }}>{s.total_boys || 0}B / {s.total_girls || 0}G</div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Assign To (Entire Class / Boys / Girls) */}
                    <div style={{ marginTop: 20 }}>
                        <label style={labelStyle}>Assign To</label>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            {[
                                { value: 'all', label: 'Entire Class', color: 'var(--primary)' },
                                { value: 'boys', label: 'Boys Only', color: '#3B82F6' },
                                { value: 'girls', label: 'Girls Only', color: '#EC4899' }
                            ].map(opt => (
                                <button key={opt.value} type="button"
                                    onClick={() => setForm({ ...form, assign_to: opt.value })}
                                    style={{
                                        padding: '12px 24px', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.3s',
                                        border: `1.5px solid ${form.assign_to === opt.value ? opt.color : 'var(--dark-border)'}`,
                                        background: form.assign_to === opt.value ? `${opt.color}18` : 'transparent',
                                        color: form.assign_to === opt.value ? opt.color : 'var(--text-muted)'
                                    }}>
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── MCQ Settings ── */}
                {form.type === 'mcq' && (
                    <div className="glass-card animate-section" style={{ padding: 28, marginBottom: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h3 style={{ fontWeight: 600, fontFamily: 'Outfit' }}>MCQ Settings & Questions</h3>
                            <button type="button" onClick={addQuestion} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: '0.85rem' }}>
                                <FiPlusCircle size={16} /> Add Question
                            </button>
                        </div>

                        <div style={{ marginBottom: 20 }}>
                            <label style={labelStyle}>Duration (minutes)</label>
                            <input name="mcq_duration" type="number" className="input-field" style={{ maxWidth: 200 }} value={form.mcq_duration} onChange={handleChange} />
                        </div>

                        {questions.length === 0 ? (
                            <div style={{ padding: 40, textAlign: 'center', border: '2px dashed var(--dark-border)', borderRadius: 12 }}>
                                <p style={{ color: 'var(--text-muted)', marginBottom: 12 }}>No questions added yet</p>
                                <button type="button" onClick={addQuestion} className="btn-primary" style={{ fontSize: '0.85rem' }}><span>Add First Question</span></button>
                            </div>
                        ) : (
                            questions.map((q, idx) => (
                                <div key={idx} className="glass-card question-card" style={{ marginBottom: 16, padding: 20, background: 'rgba(10,10,20,0.3)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                        <span style={{ fontWeight: 600, color: 'var(--primary-light)', fontSize: '0.9rem' }}>Question {idx + 1}</span>
                                        <button type="button" onClick={() => removeQuestion(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: 4 }}>
                                            <FiTrash2 size={16} />
                                        </button>
                                    </div>
                                    <input className="input-field" placeholder="Question text" value={q.question_text} onChange={e => updateQuestion(idx, 'question_text', e.target.value)} style={{ marginBottom: 10 }} />
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                                        <input className="input-field" placeholder="Option A" value={q.option_a} onChange={e => updateQuestion(idx, 'option_a', e.target.value)} />
                                        <input className="input-field" placeholder="Option B" value={q.option_b} onChange={e => updateQuestion(idx, 'option_b', e.target.value)} />
                                        <input className="input-field" placeholder="Option C" value={q.option_c} onChange={e => updateQuestion(idx, 'option_c', e.target.value)} />
                                        <input className="input-field" placeholder="Option D" value={q.option_d} onChange={e => updateQuestion(idx, 'option_d', e.target.value)} />
                                    </div>
                                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                        <div>
                                            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginRight: 8 }}>Correct Answer:</label>
                                            <select className="input-field" style={{ width: 80, padding: '8px 12px' }} value={q.correct_answer} onChange={e => updateQuestion(idx, 'correct_answer', e.target.value)}>
                                                <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginRight: 8 }}>Marks:</label>
                                            <input type="number" className="input-field" style={{ width: 80, padding: '8px 12px' }} value={q.marks} onChange={e => updateQuestion(idx, 'marks', e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                <button type="submit" className="btn-primary" style={{ width: '100%', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} disabled={loading}>
                    <FiSave size={18} />
                    <span>{loading ? 'Creating...' : 'Create Assignment'}</span>
                </button>
            </form>
        </div>
    );
}
