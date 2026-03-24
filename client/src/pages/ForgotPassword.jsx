import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import ParticleBackground from '../animations/ParticleBackground';
import gsap from 'gsap';
import { FiMail, FiArrowLeft, FiSend } from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const formRef = useRef(null);
    const logoRef = useRef(null);

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
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) return toast.error('Please enter your email address');

        setLoading(true);
        // Simulate sending — actual implementation would call backend
        setTimeout(() => {
            setSent(true);
            setLoading(false);
            toast.success('If an account exists with this email, you will receive a reset link.');
        }, 1500);
    };

    return (
        <>
            <Toaster position="top-right" toastOptions={{ style: { background: '#fff', color: '#1E1B3A', border: '1px solid #E5E0F6', borderRadius: 12, boxShadow: '0 4px 24px rgba(124,58,237,0.10)' } }} />
            <ParticleBackground />
            <div className="auth-container">
                <div style={{ width: '100%', maxWidth: 460 }}>
                    <div ref={logoRef} style={{ textAlign: 'center', marginBottom: 28 }}>
                        <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.8rem', letterSpacing: '-0.02em' }} className="gradient-text">Evalyn</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 6 }}>Assignment Submission & Evaluation</p>
                    </div>

                    <div ref={formRef} className="glass" style={{ padding: '44px 48px', borderRadius: 20 }}>
                        <div style={{ textAlign: 'center', marginBottom: 32 }}>
                            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'Outfit', marginBottom: 6 }}>Forgot Password</h1>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                {sent ? 'Check your email for reset instructions' : 'Enter your email to receive a reset link'}
                            </p>
                        </div>

                        {!sent ? (
                            <form onSubmit={handleSubmit}>
                                <div className="form-field" style={{ marginBottom: 24 }}>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Email Address</label>
                                    <div style={{ position: 'relative' }}>
                                        <FiMail style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 16 }} />
                                        <input
                                            type="email"
                                            className="input-field"
                                            style={{ paddingLeft: 42, padding: '14px 14px 14px 42px', fontSize: '0.95rem' }}
                                            placeholder="you@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <button type="submit" className="btn-primary" style={{ width: '100%', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: '1rem', fontWeight: 700, borderRadius: 14 }} disabled={loading}>
                                    <FiSend size={16} />
                                    <span>{loading ? 'Sending...' : 'Send Reset Link'}</span>
                                </button>
                            </form>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(124,58,237,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                    <FiMail size={28} style={{ color: 'var(--primary)' }} />
                                </div>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                                    We've sent a password reset link to <strong style={{ color: 'var(--primary)' }}>{email}</strong>. Please check your inbox and follow the instructions.
                                </p>
                                <button onClick={() => { setSent(false); setEmail(''); }} style={{ marginTop: 20, background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
                                    Try another email
                                </button>
                            </div>
                        )}

                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 24 }}>
                            <Link to="/login" style={{ color: 'var(--primary-light)', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                <FiArrowLeft size={14} /> Back to Sign In
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
