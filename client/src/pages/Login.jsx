import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FloatingBackground from '../animations/FloatingBackground';
import AnimatedLogo from '../components/AnimatedLogo';
import gsap from 'gsap';
import { FiMail, FiLock, FiArrowRight, FiEye, FiEyeOff } from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login, user } = useAuth();
    const navigate = useNavigate();
    const formRef = useRef(null);

    useEffect(() => {
        if (user) navigate(`/${user.role}`);
    }, [user]);

    useEffect(() => {
        if (formRef.current) {
            gsap.fromTo(formRef.current,
                { y: 50, opacity: 0, scale: 0.93 },
                { y: 0, opacity: 1, scale: 1, duration: 0.8, delay: 0.2, ease: 'power3.out' }
            );
            gsap.fromTo(formRef.current.querySelectorAll('.form-field'),
                { x: -40, opacity: 0 },
                { x: 0, opacity: 1, stagger: 0.1, duration: 0.5, delay: 0.5, ease: 'power2.out' }
            );
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) return toast.error('Please fill all fields');
        setLoading(true);
        try {
            const u = await login(email, password);
            toast.success('Welcome back!');
            if (formRef.current) {
                gsap.to(formRef.current, { y: -20, opacity: 0, scale: 0.95, duration: 0.3 });
            }
            setTimeout(() => navigate(`/${u.role}`), 400);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen">
            <Toaster position="top-right" toastOptions={{ style: { background: '#fff', color: '#1E1B3A', border: '1px solid #E5E0F6', borderRadius: 12, boxShadow: '0 4px 16px rgba(124,58,237,0.08)' } }} />
            <FloatingBackground />
            <AnimatedLogo />

            <div className="auth-container">
                <div style={{ width: '100%', maxWidth: 440 }}>
                    <div ref={formRef} className="glass" style={{ padding: '44px 36px' }}>
                        <div style={{ textAlign: 'center', marginBottom: 32 }}>
                            <h1 style={{ fontSize: '1.7rem', fontWeight: 800, fontFamily: 'Outfit', marginBottom: 6 }}>
                                <span className="gradient-text">Welcome Back</span>
                            </h1>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Sign in to your account</p>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-field" style={{ marginBottom: 20 }}>
                                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Email</label>
                                <div style={{ position: 'relative' }}>
                                    <FiMail style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input type="email" className="input-field" style={{ paddingLeft: 42 }} placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} />
                                </div>
                            </div>

                            <div className="form-field" style={{ marginBottom: 12 }}>
                                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Password</label>
                                <div style={{ position: 'relative' }}>
                                    <FiLock style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        className="input-field"
                                        style={{ paddingLeft: 42, paddingRight: 42 }}
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex' }}>
                                        {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="form-field" style={{ textAlign: 'right', marginBottom: 24 }}>
                                <Link to="/forgot-password" style={{ color: 'var(--primary)', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none' }}>
                                    Forgot Password?
                                </Link>
                            </div>

                            <button type="submit" className="btn-primary form-field" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} disabled={loading}>
                                <span>{loading ? 'Signing in...' : 'Sign In'}</span>
                                {!loading && <FiArrowRight />}
                            </button>
                        </form>

                        <div className="form-field" style={{ textAlign: 'center', marginTop: 24 }}>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                                Don't have an account?{' '}
                                <Link to="/register" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
                                    Create Account
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
