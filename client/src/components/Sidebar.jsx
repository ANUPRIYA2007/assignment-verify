import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import {
    FiGrid, FiFileText, FiPlusCircle, FiInbox, FiClock,
    FiUsers, FiBarChart2, FiEye, FiLogOut, FiCheckSquare, FiAward, FiLayers, FiBookOpen
} from 'react-icons/fi';

const navItems = {
    student: [
        { to: '/student', icon: FiGrid, label: 'Dashboard', end: true },
        { to: '/student/assignments', icon: FiFileText, label: 'Assignments' },
        { to: '/student/activities', icon: FiBarChart2, label: 'Activities' },
        { to: '/student/submissions', icon: FiInbox, label: 'My Submissions' },
        { to: '/student/results', icon: FiAward, label: 'Results' },
        { to: '/student/leaderboard', icon: FiBarChart2, label: 'Leaderboard' },
    ],
    teacher: [
        { to: '/teacher', icon: FiGrid, label: 'Dashboard', end: true },
        { to: '/teacher/assignments', icon: FiFileText, label: 'Assignments' },
        { to: '/teacher/create', icon: FiPlusCircle, label: 'Create Assignment' },
        { to: '/teacher/submissions', icon: FiCheckSquare, label: 'Submissions' },
        { to: '/teacher/late-requests', icon: FiClock, label: 'Late Requests' },
    ],
    admin: [
        { to: '/admin', icon: FiGrid, label: 'Dashboard', end: true },
        { to: '/admin/users', icon: FiUsers, label: 'Manage Users' },
        { to: '/admin/teachers', icon: FiBookOpen, label: 'Teachers' },
        { to: '/admin/assignments', icon: FiEye, label: 'Assignments' },
        { to: '/admin/leaderboard', icon: FiAward, label: 'Leaderboard' },
        { to: '/admin/reports', icon: FiBarChart2, label: 'Reports' },
    ],
};

export default function Sidebar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const sidebarRef = useRef(null);
    const linksRef = useRef(null);

    useEffect(() => {
        if (sidebarRef.current) {
            gsap.fromTo(sidebarRef.current,
                { x: -280, opacity: 0 },
                { x: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }
            );
        }
        if (linksRef.current) {
            const links = linksRef.current.querySelectorAll('.sidebar-link');
            gsap.fromTo(links,
                { x: -30, opacity: 0 },
                { x: 0, opacity: 1, stagger: 0.06, duration: 0.4, delay: 0.3, ease: 'power2.out' }
            );
        }
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const items = navItems[user?.role] || [];

    return (
        <aside ref={sidebarRef} className="sidebar">
            {/* Logo */}
            <div style={{ padding: '0 28px', marginBottom: 36 }}>
                <div className="logo-container">
                    <svg width="42" height="42" viewBox="0 0 64 64" style={{ borderRadius: 12 }}>
                        <defs>
                            <linearGradient id="sideLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style={{ stopColor: '#7B2FBE' }} />
                                <stop offset="100%" style={{ stopColor: '#3B82F6' }} />
                            </linearGradient>
                        </defs>
                        <rect x="4" y="4" width="56" height="56" rx="14" fill="url(#sideLogoGrad)" opacity="0.15" />
                        <rect x="16" y="10" width="26" height="36" rx="5" fill="url(#sideLogoGrad)" />
                        <path d="M34 10 L42 18 L34 18 Z" fill="rgba(255,255,255,0.3)" />
                        <polyline points="22,30 28,36 40,22" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="logo-text">Evalyn</span>
                </div>
            </div>

            {/* User info */}
            <div style={{ padding: '0 28px', marginBottom: 28 }}>
                <div className="glass-card" style={{ padding: '14px 16px', borderRadius: 12 }}>
                    <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 2 }}>{user?.full_name}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{user?.email}</p>
                    <span className={`badge badge-${user?.role}`} style={{ marginTop: 6, display: 'inline-block' }}>
                        {user?.role}
                    </span>
                </div>
            </div>

            {/* Navigation */}
            <nav ref={linksRef}>
                {items.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                    >
                        <item.icon size={18} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Logout */}
            <div style={{ position: 'absolute', bottom: 24, left: 0, right: 0 }}>
                <button
                    onClick={handleLogout}
                    className="sidebar-link"
                    style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', font: 'inherit' }}
                >
                    <FiLogOut size={18} />
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>
    );
}
