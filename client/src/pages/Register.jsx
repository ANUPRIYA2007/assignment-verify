import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ParticleBackground from '../animations/ParticleBackground';
import gsap from 'gsap';
import { FiMail, FiLock, FiUser, FiArrowRight, FiShield, FiHash, FiCalendar, FiGrid, FiEye, FiEyeOff } from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';
import api from '../lib/api';

export default function Register() {
    const [form, setForm] = useState({
        full_name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'student',
        gender: '',
        register_number: '',
        year_of_study: '1st',
        section: ''
    });
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const { register, user } = useAuth();
    const navigate = useNavigate();
    const formRef = useRef(null);
    const logoRef = useRef(null);

    useEffect(() => {
        if (user) navigate(`/${user.role}`);
    }, [user]);

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                // Fetch public classes (sections) from auth endpoint
                const res = await api.get('/auth/classes');
                setClasses(res.data.classes);
            } catch (err) {
                console.error('Failed to load classes');
            }
        };
        fetchClasses();
    }, []);

    useEffect(() => {
        if (logoRef.current) {
            gsap.fromTo(logoRef.current,
                { y: -30, opacity: 0, scale: 0.8 },
                { y: 0, opacity: 1, scale: 1, duration: 0.9, ease: 'back.out(1.7)' }
            );
        }
        if (formRef.current) {
            gsap.fromTo(formRef.current,
                { y: 50, opacity: 0, scale: 0.93 },
                { y: 0, opacity: 1, scale: 1, duration: 0.8, delay: 0.2, ease: 'power3.out' }
            );
            gsap.fromTo(formRef.current.querySelectorAll('.form-field'),
                { x: -40, opacity: 0 },
                { x: 0, opacity: 1, stagger: 0.08, duration: 0.5, delay: 0.5, ease: 'power2.out' }
            );
        }
    }, []);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.full_name || !form.email || !form.password || !form.gender) return toast.error('Please fill all required fields');
        if (form.role === 'student' && (!form.register_number || !form.year_of_study || !form.section)) {
            return toast.error('Please fill all student details');
        }
        if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
        if (form.password.length < 6) return toast.error('Password must be at least 6 characters');

        setLoading(true);
        try {
            const u = await register(form.email, form.password, form.full_name, form.role, {
                register_number: form.register_number,
                year_of_study: form.year_of_study,
                section: form.section,
                gender: form.gender
            });
            toast.success('Account created!');
            if (formRef.current) {
                gsap.to(formRef.current, { y: -20, opacity: 0, scale: 0.95, duration: 0.3 });
            }
            setTimeout(() => navigate(`/${u.role}`), 400);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const roles = [
        { value: 'student', label: 'Student', color: 'var(--info)' },
        { value: 'teacher', label: 'Teacher', color: 'var(--primary-light)' },
        { value: 'admin', label: 'Admin', color: 'var(--secondary)' },
    ];

    const availableSections = classes.filter(c => c.year === form.year_of_study);

    return (
        <>
            <Toaster position="top-right" toastOptions={{ style: { background: '#fff', color: '#1E1B3A', border: '1px solid #E5E0F6', borderRadius: 12, boxShadow: '0 4px 24px rgba(124,58,237,0.10)' } }} />
            <ParticleBackground />
            <div className="auth-container" style={{ padding: '40px 20px' }}>
                <div style={{ width: '100%', maxWidth: 680 }}>
                    <div ref={logoRef} style={{ textAlign: 'center', marginBottom: 28 }}>
                        <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.8rem', letterSpacing: '-0.02em' }} className="gradient-text">Evalyn</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 6 }}>Assignment Submission & Evaluation</p>
                    </div>

                    <div ref={formRef} className="glass" style={{ padding: '44px 48px', borderRadius: 20 }}>
                        <div style={{ textAlign: 'center', marginBottom: 32 }}>
                            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'Outfit', marginBottom: 6 }}>Create Account</h1>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Fill in your details to get started</p>
                        </div>

                        <form onSubmit={handleSubmit}>
                            {/* Role Selection — placed first for clarity */}
                            <div className="form-field" style={{ marginBottom: 28 }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>I am a</label>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    {roles.map((r) => (
                                        <button key={r.value} type="button" onClick={() => setForm({ ...form, role: r.value })} style={{
                                            flex: 1, padding: '14px 8px', borderRadius: 12,
                                            border: `1.5px solid ${form.role === r.value ? 'var(--primary)' : 'var(--dark-border)'}`,
                                            background: form.role === r.value ? 'rgba(108,99,255,0.15)' : 'transparent',
                                            color: form.role === r.value ? 'var(--primary-light)' : 'var(--text-muted)',
                                            cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', transition: 'all 0.3s',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                                        }}>
                                            <FiShield size={16} />
                                            {r.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Name & Email row */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                                <div className="form-field">
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Full Name</label>
                                    <div style={{ position: 'relative' }}>
                                        <FiUser style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 16 }} />
                                        <input type="text" name="full_name" className="input-field" style={{ paddingLeft: 42, padding: '14px 14px 14px 42px', fontSize: '0.9rem' }} placeholder="Enter your full name" value={form.full_name} onChange={handleChange} />
                                    </div>
                                </div>
                                <div className="form-field">
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Email Address</label>
                                    <div style={{ position: 'relative' }}>
                                        <FiMail style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 16 }} />
                                        <input type="email" name="email" className="input-field" style={{ paddingLeft: 42, padding: '14px 14px 14px 42px', fontSize: '0.9rem' }} placeholder="you@example.com" value={form.email} onChange={handleChange} />
                                    </div>
                                </div>
                            </div>

                            {/* Gender Selection */}
                            <div className="form-field" style={{ marginBottom: 20 }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>Gender</label>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    {['Male', 'Female', 'Other'].map((g) => (
                                        <button key={g} type="button" onClick={() => setForm({ ...form, gender: g.toLowerCase() })} style={{
                                            flex: 1, padding: '12px 8px', borderRadius: 12,
                                            border: `1.5px solid ${form.gender === g.toLowerCase() ? 'var(--primary)' : 'var(--dark-border)'}`,
                                            background: form.gender === g.toLowerCase() ? 'rgba(124,58,237,0.12)' : 'transparent',
                                            color: form.gender === g.toLowerCase() ? 'var(--primary)' : 'var(--text-muted)',
                                            cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', transition: 'all 0.3s'
                                        }}>
                                            {g}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Student-specific fields */}
                            {form.role === 'student' && (
                                <div className="animate-section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 20, padding: 20, background: 'rgba(108,99,255,0.05)', borderRadius: 14, border: '1px solid rgba(108,99,255,0.15)' }}>
                                    <div className="form-field">
                                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Register Number</label>
                                        <div style={{ position: 'relative' }}>
                                            <FiHash style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 16 }} />
                                            <input type="text" name="register_number" className="input-field" style={{ paddingLeft: 42, padding: '14px 14px 14px 42px', fontSize: '0.9rem' }} placeholder="e.g. 21CS101" value={form.register_number} onChange={handleChange} />
                                        </div>
                                    </div>
                                    <div className="form-field">
                                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Year of Study</label>
                                        <div style={{ position: 'relative' }}>
                                            <FiCalendar style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 16 }} />
                                            <select name="year_of_study" className="input-field" style={{ paddingLeft: 42, padding: '14px 14px 14px 42px', fontSize: '0.9rem' }} value={form.year_of_study} onChange={handleChange}>
                                                <option value="1st">1st Year</option>
                                                <option value="2nd">2nd Year</option>
                                                <option value="3rd">3rd Year</option>
                                                <option value="Final">Final Year</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-field">
                                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Section</label>
                                        <div style={{ position: 'relative' }}>
                                            <FiGrid style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 16 }} />
                                            <select name="section" className="input-field" style={{ paddingLeft: 42, padding: '14px 14px 14px 42px', fontSize: '0.9rem' }} value={form.section} onChange={handleChange}>
                                                <option value="">Select Section</option>
                                                {availableSections.map(s => <option key={s.id} value={s.section}>Section {s.section}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Password row */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
                                <div className="form-field">
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <FiLock style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 16 }} />
                                        <input type={showPassword ? 'text' : 'password'} name="password" className="input-field" style={{ paddingLeft: 42, paddingRight: 42, padding: '14px 42px 14px 42px', fontSize: '0.9rem' }} placeholder="Min 6 characters" value={form.password} onChange={handleChange} />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, display: 'flex' }}>
                                            {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="form-field">
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Confirm Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <FiLock style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 16 }} />
                                        <input type={showConfirm ? 'text' : 'password'} name="confirmPassword" className="input-field" style={{ paddingLeft: 42, paddingRight: 42, padding: '14px 42px 14px 42px', fontSize: '0.9rem' }} placeholder="Re-enter password" value={form.confirmPassword} onChange={handleChange} />
                                        <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, display: 'flex' }}>
                                            {showConfirm ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: '1rem', fontWeight: 700, borderRadius: 14 }} disabled={loading}>
                                <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
                                <FiArrowRight size={18} />
                            </button>
                        </form>

                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 24 }}>
                            Already have an account?{' '}
                            <Link to="/login" style={{ color: 'var(--primary-light)', fontWeight: 700, textDecoration: 'none' }}>Sign In</Link>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
