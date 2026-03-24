import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Toaster } from 'react-hot-toast';
import AnimatedLogo from './AnimatedLogo';
import FloatingBackground from '../animations/FloatingBackground';

export default function DashboardLayout() {
    return (
        <div className="flex min-h-screen relative">
            <FloatingBackground />
            <AnimatedLogo />

            {/* 🟢 Live Indicator */}
            <div style={{
                position: 'fixed',
                top: 14,
                right: 24,
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(0, 214, 143, 0.08)',
                border: '1px solid rgba(0, 214, 143, 0.25)',
                borderRadius: 20,
                padding: '5px 14px 5px 10px',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#00D68F',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                backdropFilter: 'blur(10px)',
            }}>
                <span style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: '#00D68F',
                    boxShadow: '0 0 8px #00D68F',
                    animation: 'livePulse 2s infinite',
                }} />
                Live
            </div>

            <style>{`
                @keyframes livePulse {
                    0%, 100% { opacity: 1; box-shadow: 0 0 8px #00D68F; }
                    50% { opacity: 0.4; box-shadow: 0 0 2px #00D68F; }
                }
            `}</style>

            <Sidebar />
            <main className="main-content flex-1 z-10 px-6 py-8 md:px-10 md:py-12 mt-16">
                <div className="max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
