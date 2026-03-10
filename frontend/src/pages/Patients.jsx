import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import {
    Plus,
    Search,
    Users,
    ArrowRight,
    Phone,
    UserIcon,
    Calendar,
} from 'lucide-react';

export default function Patients() {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showAdd, setShowAdd] = useState(false);
    const [newPatient, setNewPatient] = useState({
        name: '', age: '', gender: '', phone: '', address: '', blood_group: '', allergies: '',
    });
    const [addLoading, setAddLoading] = useState(false);

    useEffect(() => {
        loadPatients();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadPatients(search);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const loadPatients = async (searchTerm = '') => {
        try {
            const data = await api.getPatients(searchTerm);
            setPatients(data);
        } catch (err) {
            console.error('Failed to load patients:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddPatient = async (e) => {
        e.preventDefault();
        if (!newPatient.name) return;
        setAddLoading(true);

        try {
            const created = await api.createPatient({
                ...newPatient,
                age: newPatient.age ? parseInt(newPatient.age) : null,
            });
            setPatients(prev => [created, ...prev]);
            setShowAdd(false);
            setNewPatient({ name: '', age: '', gender: '', phone: '', address: '', blood_group: '', allergies: '' });
        } catch (err) {
            console.error('Failed to create patient:', err);
        } finally {
            setAddLoading(false);
        }
    };

    const getInitials = (name) =>
        name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';

    if (loading) {
        return (
            <div className="loading-overlay">
                <div className="spinner spinner-lg" />
                <span>Loading patients...</span>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div className="flex items-center justify-between">
                    <div>
                        <h2>👥 Patients</h2>
                        <p>{patients.length} patients registered</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>
                        <Plus size={16} /> Add Patient
                    </button>
                </div>
            </div>

            <div className="page-body">
                {/* Add Patient Form */}
                {showAdd && (
                    <div className="card animate-fade-in" style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>New Patient</h3>
                        <form onSubmit={handleAddPatient}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label className="form-label">Name *</label>
                                    <input className="form-input" placeholder="Patient name" value={newPatient.name} onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })} required />
                                </div>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label className="form-label">Age</label>
                                    <input className="form-input" type="number" placeholder="Age" value={newPatient.age} onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })} />
                                </div>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label className="form-label">Gender</label>
                                    <select className="form-input" value={newPatient.gender} onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}>
                                        <option value="">Select</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label className="form-label">Phone</label>
                                    <input className="form-input" placeholder="+91 9876543210" value={newPatient.phone} onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })} />
                                </div>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label className="form-label">Blood Group</label>
                                    <select className="form-input" value={newPatient.blood_group} onChange={(e) => setNewPatient({ ...newPatient, blood_group: e.target.value })}>
                                        <option value="">Select</option>
                                        <option value="A+">A+</option>
                                        <option value="A-">A-</option>
                                        <option value="B+">B+</option>
                                        <option value="B-">B-</option>
                                        <option value="O+">O+</option>
                                        <option value="O-">O-</option>
                                        <option value="AB+">AB+</option>
                                        <option value="AB-">AB-</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label className="form-label">Allergies</label>
                                    <input className="form-input" placeholder="Known allergies" value={newPatient.allergies} onChange={(e) => setNewPatient({ ...newPatient, allergies: e.target.value })} />
                                </div>
                            </div>
                            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                                <button type="submit" className="btn btn-primary" disabled={addLoading}>
                                    {addLoading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <Plus size={16} />}
                                    Create Patient
                                </button>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Search */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <div className="form-input-icon-wrapper">
                        <Search />
                        <input
                            className="form-input"
                            placeholder="Search patients by name or phone..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Patients Grid */}
                {patients.length > 0 ? (
                    <div className="patient-grid">
                        {patients.map((patient) => (
                            <Link key={patient.id} to={`/patients/${patient.id}`} style={{ textDecoration: 'none' }}>
                                <div className="patient-card">
                                    <div className="patient-avatar">
                                        {getInitials(patient.name)}
                                    </div>
                                    <div className="patient-info">
                                        <div className="patient-name">{patient.name}</div>
                                        <div className="patient-meta">
                                            {patient.age && <span><UserIcon size={11} /> {patient.age} yrs</span>}
                                            {patient.gender && <span>• {patient.gender}</span>}
                                            {patient.phone && <span><Phone size={11} /> {patient.phone}</span>}
                                        </div>
                                        {patient.blood_group && (
                                            <span className="badge badge-red" style={{ marginTop: '0.25rem' }}>{patient.blood_group}</span>
                                        )}
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
                        <Users size={64} />
                        <h3>No Patients Found</h3>
                        <p>{search ? `No patients matching "${search}"` : 'Add your first patient or scan a prescription'}</p>
                        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
                            <Plus size={16} /> Add Patient
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
