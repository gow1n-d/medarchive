import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    LayoutDashboard,
    ScanLine,
    Users,
    Search,
    LogOut,
    Activity,
    Menu,
    X,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/scan', icon: ScanLine, label: 'Scan Prescription' },
    { path: '/patients', icon: Users, label: 'Patients' },
    { path: '/search', icon: Search, label: 'Smart Search' },
];

export default function Sidebar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getInitials = (name) => {
        return name
            ?.split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || '??';
    };

    const isActive = (path) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    return (
        <>
            {/* Mobile menu button */}
            <button className="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)}
                style={{ position: 'fixed', top: 16, left: 16, zIndex: 110, display: 'none' }}>
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Overlay */}
            <div className={`overlay ${mobileOpen ? 'open' : ''}`} onClick={() => setMobileOpen(false)} />

            {/* Sidebar */}
            <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">🏥</div>
                    <div>
                        <h1>MedArchive AI</h1>
                        <span>Medical Record System</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-section-label">Main Menu</div>
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                            onClick={() => setMobileOpen(false)}
                        >
                            <item.icon />
                            {item.label}
                        </Link>
                    ))}

                    <div className="nav-section-label" style={{ marginTop: '1rem' }}>Quick Actions</div>
                    <Link to="/scan" className="nav-item" onClick={() => setMobileOpen(false)}>
                        <Activity />
                        New Scan
                    </Link>
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <div className="sidebar-user-avatar">{getInitials(user?.full_name)}</div>
                        <div className="sidebar-user-info">
                            <div className="sidebar-user-name">{user?.full_name}</div>
                            <div className="sidebar-user-role">{user?.role}</div>
                        </div>
                        <button className="btn btn-ghost" onClick={handleLogout} title="Logout" style={{ padding: '6px' }}>
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
