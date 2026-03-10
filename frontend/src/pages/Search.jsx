import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import {
    Search as SearchIcon,
    Users,
    ArrowRight,
    Phone,
    User,
    Pill,
    FileText,
} from 'lucide-react';

export default function SearchPage() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSearch = async (e) => {
        e?.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setSearched(true);

        try {
            const data = await api.searchPatients(query);
            setResults(data);
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            setLoading(false);
        }
    };

    const getInitials = (name) =>
        name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <h2>🔍 Smart Search</h2>
                <p>Search patients by name, phone, diagnosis, or condition</p>
            </div>

            <div className="page-body">
                {/* Search Bar */}
                <form onSubmit={handleSearch} style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', maxWidth: 700 }}>
                        <div className="form-input-icon-wrapper" style={{ flex: 1 }}>
                            <SearchIcon />
                            <input
                                className="form-input"
                                placeholder='Try "Ravi diabetes" or "hypertension" or phone number...'
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                style={{ fontSize: '1rem', padding: '0.875rem 1rem 0.875rem 2.75rem' }}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary btn-lg" disabled={loading || !query.trim()}>
                            {loading ? <span className="spinner" style={{ width: 18, height: 18, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> : <SearchIcon size={18} />}
                            Search
                        </button>
                    </div>
                </form>

                {/* Search Tips */}
                {!searched && (
                    <div className="card" style={{ maxWidth: 700 }}>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem' }}>💡 Search Tips</h3>
                        <div style={{ display: 'grid', gap: '0.75rem' }}>
                            {[
                                { icon: <User size={16} />, label: 'Patient Name', example: '"Ravi Kumar"' },
                                { icon: <Phone size={16} />, label: 'Phone Number', example: '"9876543210"' },
                                { icon: <Pill size={16} />, label: 'Diagnosis', example: '"diabetes" or "hypertension"' },
                                { icon: <FileText size={16} />, label: 'Condition', example: '"fever" or "BP treatment"' },
                            ].map((tip, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-input)' }}>
                                    <span style={{ color: 'var(--primary-400)' }}>{tip.icon}</span>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)', minWidth: 120 }}>{tip.label}</span>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{tip.example}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Results */}
                {searched && (
                    <>
                        <div style={{ marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
                        </div>

                        {results.length > 0 ? (
                            <div className="patient-grid">
                                {results.map((patient) => (
                                    <Link key={patient.id} to={`/patients/${patient.id}`} style={{ textDecoration: 'none' }}>
                                        <div className="patient-card">
                                            <div className="patient-avatar">{getInitials(patient.name)}</div>
                                            <div className="patient-info">
                                                <div className="patient-name">{patient.name}</div>
                                                <div className="patient-meta">
                                                    {patient.age && <span><User size={11} /> {patient.age} yrs</span>}
                                                    {patient.gender && <span>• {patient.gender}</span>}
                                                    {patient.phone && <span><Phone size={11} /> {patient.phone}</span>}
                                                </div>
                                                <div className="patient-records-count">
                                                    📋 {patient.record_count || 0} medical records
                                                </div>
                                            </div>
                                            <ArrowRight size={16} style={{ color: 'var(--text-muted)', alignSelf: 'center' }} />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <SearchIcon size={64} />
                                <h3>No Results</h3>
                                <p>No patients found matching "{query}"</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
