import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';
import {
    Users,
    FileText,
    ScanLine,
    TrendingUp,
    ArrowRight,
    Calendar,
    Activity,
    Clock,
} from 'lucide-react';

export default function Dashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const data = await api.getDashboard();
            setStats(data);
        } catch (err) {
            console.error('Dashboard error:', err);
        } finally {
            setLoading(false);
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    if (loading) {
        return (
            <div className="loading-overlay">
                <div className="spinner spinner-lg" />
                <span>Loading dashboard...</span>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <h2>{getGreeting()}, {user?.full_name?.split(' ')[0]} 👋</h2>
                <p>Here's an overview of your medical records system</p>
            </div>

            <div className="page-body">
                {/* Stats Grid */}
                <div className="stats-grid">
                    <div className="stat-card teal">
                        <div className="stat-icon teal">
                            <Users />
                        </div>
                        <div className="stat-content">
                            <div className="stat-label">Total Patients</div>
                            <div className="stat-value">{stats?.total_patients || 0}</div>
                        </div>
                    </div>

                    <div className="stat-card blue">
                        <div className="stat-icon blue">
                            <FileText />
                        </div>
                        <div className="stat-content">
                            <div className="stat-label">Total Records</div>
                            <div className="stat-value">{stats?.total_records || 0}</div>
                        </div>
                    </div>

                    <div className="stat-card green">
                        <div className="stat-icon green">
                            <Calendar />
                        </div>
                        <div className="stat-content">
                            <div className="stat-label">Records Today</div>
                            <div className="stat-value">{stats?.records_today || 0}</div>
                        </div>
                    </div>

                    <div className="stat-card amber">
                        <div className="stat-icon amber">
                            <TrendingUp />
                        </div>
                        <div className="stat-content">
                            <div className="stat-label">This Week</div>
                            <div className="stat-value">{stats?.records_this_week || 0}</div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div style={{ marginBottom: 'var(--space-8)' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--space-4)', color: 'var(--text-primary)' }}>
                        Quick Actions
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-4)' }}>
                        <Link to="/scan" className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', textDecoration: 'none', cursor: 'pointer' }}>
                            <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <ScanLine size={22} color="white" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Scan Prescription</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Upload or capture a prescription image</div>
                            </div>
                            <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
                        </Link>

                        <Link to="/patients" className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', textDecoration: 'none', cursor: 'pointer' }}>
                            <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, var(--success), #34d399)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Users size={22} color="white" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>View Patients</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Browse and manage patient records</div>
                            </div>
                            <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
                        </Link>

                        <Link to="/search" className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', textDecoration: 'none', cursor: 'pointer' }}>
                            <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, var(--warning), #fbbf24)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Activity size={22} color="white" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Smart Search</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Search by name, diagnosis, or medicine</div>
                            </div>
                            <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
                        </Link>
                    </div>
                </div>

                {/* Recent Patients */}
                {stats?.recent_patients?.length > 0 && (
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                Recent Patients
                            </h3>
                            <Link to="/patients" className="btn btn-ghost btn-sm">
                                View All <ArrowRight size={14} />
                            </Link>
                        </div>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Patient</th>
                                        <th>Age</th>
                                        <th>Gender</th>
                                        <th>Phone</th>
                                        <th>Records</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.recent_patients.map((patient) => (
                                        <tr key={patient.id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div className="patient-avatar" style={{ width: 32, height: 32, fontSize: '0.7rem' }}>
                                                        {patient.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                                    </div>
                                                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{patient.name}</span>
                                                </div>
                                            </td>
                                            <td>{patient.age || '—'}</td>
                                            <td>{patient.gender || '—'}</td>
                                            <td>{patient.phone || '—'}</td>
                                            <td>
                                                <span className="badge badge-teal">{patient.record_count || 0} records</span>
                                            </td>
                                            <td>
                                                <Link to={`/patients/${patient.id}`} className="btn btn-ghost btn-sm">
                                                    View <ArrowRight size={12} />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {(!stats?.recent_patients || stats.recent_patients.length === 0) && (
                    <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                        <ScanLine size={48} style={{ margin: '0 auto 1rem', opacity: 0.3, color: 'var(--primary-400)' }} />
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>No Records Yet</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                            Start by scanning your first prescription to digitize a medical record
                        </p>
                        <Link to="/scan" className="btn btn-primary">
                            <ScanLine size={16} /> Scan First Prescription
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
