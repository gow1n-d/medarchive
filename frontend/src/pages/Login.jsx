import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, User, Building, Phone } from 'lucide-react';

export default function Login() {
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [clinicName, setClinicName] = useState('');
    const [phone, setPhone] = useState('');
    const [role, setRole] = useState('doctor');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isRegister) {
                await register({
                    email,
                    password,
                    full_name: fullName,
                    role,
                    clinic_name: clinicName,
                    phone,
                });
            } else {
                await login(email, password);
            }
            navigate('/');
        } catch (err) {
            setError(err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-bg" />
            <div className="login-card animate-fade-in">
                <div className="login-logo">
                    <div className="login-logo-icon">🏥</div>
                    <h1>MedArchive AI</h1>
                    <p>Intelligent Medical Record Digitization</p>
                </div>

                {error && <div className="login-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    {isRegister && (
                        <>
                            <div className="form-group">
                                <label className="form-label">Full Name</label>
                                <div className="form-input-icon-wrapper">
                                    <User />
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Dr. John Doe"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Role</label>
                                <select
                                    className="form-input"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                >
                                    <option value="doctor">Doctor</option>
                                    <option value="admin">Admin</option>
                                    <option value="staff">Staff</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Clinic/Hospital Name</label>
                                <div className="form-input-icon-wrapper">
                                    <Building />
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="City Medical Center"
                                        value={clinicName}
                                        onChange={(e) => setClinicName(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Phone</label>
                                <div className="form-input-icon-wrapper">
                                    <Phone />
                                    <input
                                        type="tel"
                                        className="form-input"
                                        placeholder="+91 9876543210"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <div className="form-input-icon-wrapper">
                            <Mail />
                            <input
                                type="email"
                                className="form-input"
                                placeholder="doctor@clinic.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <div className="form-input-icon-wrapper">
                            <Lock />
                            <input
                                type="password"
                                className="form-input"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg w-full"
                        disabled={loading}
                        style={{ marginTop: '0.5rem' }}
                    >
                        {loading ? (
                            <span className="spinner" style={{ width: 18, height: 18, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                        ) : (
                            isRegister ? 'Create Account' : 'Sign In'
                        )}
                    </button>
                </form>

                <div className="login-footer">
                    {isRegister ? (
                        <>Already have an account?{' '}<a href="#" onClick={(e) => { e.preventDefault(); setIsRegister(false); setError(''); }}>Sign in</a></>
                    ) : (
                        <>Don&apos;t have an account?{' '}<a href="#" onClick={(e) => { e.preventDefault(); setIsRegister(true); setError(''); }}>Register</a></>
                    )}
                </div>

                {!isRegister && (
                    <div style={{ marginTop: '1.5rem', padding: '0.75rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                        <strong>Demo Credentials:</strong><br />
                        Doctor: doctor@medarchive.ai / doctor123<br />
                        Admin: admin@medarchive.ai / admin123
                    </div>
                )}
            </div>
        </div>
    );
}
