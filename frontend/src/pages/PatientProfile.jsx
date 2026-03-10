import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import {
    ArrowLeft,
    Calendar,
    Pill,
    Stethoscope,
    Building,
    User,
    Phone,
    Heart,
    AlertTriangle,
    Trash2,
    FileText,
    ScanLine,
} from 'lucide-react';

export default function PatientProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [patient, setPatient] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPatient();
    }, [id]);

    const loadPatient = async () => {
        try {
            const data = await api.getPatient(id);
            setPatient(data);
        } catch (err) {
            console.error('Failed to load patient:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteRecord = async (recordId) => {
        if (!confirm('Delete this medical record? This cannot be undone.')) return;
        try {
            await api.deleteRecord(recordId);
            loadPatient();
        } catch (err) {
            console.error('Delete failed:', err);
        }
    };

    const handleDeletePatient = async () => {
        if (!confirm('Delete this patient and ALL their records? This cannot be undone.')) return;
        try {
            await api.deletePatient(id);
            navigate('/patients');
        } catch (err) {
            console.error('Delete failed:', err);
        }
    };

    const getInitials = (name) =>
        name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    if (loading) {
        return (
            <div className="loading-overlay">
                <div className="spinner spinner-lg" />
                <span>Loading patient profile...</span>
            </div>
        );
    }

    if (!patient) {
        return (
            <div className="empty-state">
                <User size={64} />
                <h3>Patient Not Found</h3>
                <Link to="/patients" className="btn btn-primary">Back to Patients</Link>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div className="flex items-center gap-4">
                    <Link to="/patients" className="btn btn-ghost" style={{ padding: '6px' }}>
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h2>{patient.name}</h2>
                        <p>Patient Profile & Medical Timeline</p>
                    </div>
                </div>
            </div>

            <div className="page-body">
                {/* Profile Header */}
                <div className="profile-header">
                    <div className="profile-avatar">{getInitials(patient.name)}</div>
                    <div className="profile-info">
                        <h2>{patient.name}</h2>
                        <div className="profile-details">
                            {patient.age && (
                                <div className="profile-detail"><User size={14} /> {patient.age} years old</div>
                            )}
                            {patient.gender && (
                                <div className="profile-detail">{patient.gender}</div>
                            )}
                            {patient.phone && (
                                <div className="profile-detail"><Phone size={14} /> {patient.phone}</div>
                            )}
                            {patient.blood_group && (
                                <div className="profile-detail">
                                    <Heart size={14} />
                                    <span className="badge badge-red">{patient.blood_group}</span>
                                </div>
                            )}
                        </div>
                        {patient.allergies && (
                            <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--warning)' }}>
                                <AlertTriangle size={14} /> Allergies: {patient.allergies}
                            </div>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Link to="/scan" className="btn btn-primary">
                            <ScanLine size={16} /> Add Record
                        </Link>
                        <button className="btn btn-danger" onClick={handleDeletePatient}>
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '2rem' }}>
                    <div className="stat-card teal">
                        <div className="stat-icon teal"><FileText /></div>
                        <div className="stat-content">
                            <div className="stat-label">Total Records</div>
                            <div className="stat-value">{patient.records?.length || 0}</div>
                        </div>
                    </div>
                    <div className="stat-card blue">
                        <div className="stat-icon blue"><Calendar /></div>
                        <div className="stat-content">
                            <div className="stat-label">First Visit</div>
                            <div className="stat-value" style={{ fontSize: '1rem' }}>
                                {patient.records?.length > 0 ? formatDate(patient.records[patient.records.length - 1].record_date) : '—'}
                            </div>
                        </div>
                    </div>
                    <div className="stat-card green">
                        <div className="stat-icon green"><Calendar /></div>
                        <div className="stat-content">
                            <div className="stat-label">Latest Visit</div>
                            <div className="stat-value" style={{ fontSize: '1rem' }}>
                                {patient.records?.length > 0 ? formatDate(patient.records[0].record_date) : '—'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Medical Timeline */}
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={18} /> Medical Timeline
                </h3>

                {patient.records?.length > 0 ? (
                    <div className="timeline">
                        {patient.records.map((record, index) => (
                            <div className="timeline-item" key={record.id} style={{ animationDelay: `${index * 100}ms` }}>
                                <div className="timeline-dot" />
                                <div className="timeline-date">{formatDate(record.record_date)}</div>
                                <div className="timeline-card">
                                    <div className="flex items-center justify-between">
                                        <h4>
                                            {record.diagnosis || 'Medical Visit'}
                                            <span className="badge badge-teal" style={{ marginLeft: '0.5rem' }}>{record.record_type}</span>
                                        </h4>
                                        <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteRecord(record.id)} style={{ color: 'var(--error)', padding: '4px' }}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>

                                    {record.doctor_name && (
                                        <p style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.25rem' }}>
                                            <Stethoscope size={13} /> {record.doctor_name}
                                        </p>
                                    )}
                                    {record.hospital_name && (
                                        <p style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                            <Building size={13} /> {record.hospital_name}
                                        </p>
                                    )}
                                    {record.symptoms && (
                                        <p style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
                                            <strong>Symptoms:</strong> {record.symptoms}
                                        </p>
                                    )}
                                    {record.notes && (
                                        <p style={{ marginTop: '0.25rem', fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                                            {record.notes}
                                        </p>
                                    )}

                                    {/* Medicines */}
                                    {record.medicines?.length > 0 && (
                                        <div className="timeline-medicines">
                                            {record.medicines.map((med) => (
                                                <div key={med.id} className="medicine-tag">
                                                    <Pill size={12} />
                                                    {med.medicine_name}
                                                    {med.dosage && ` ${med.dosage}`}
                                                    {med.frequency && ` — ${med.frequency}`}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <FileText size={64} />
                        <h3>No Records Yet</h3>
                        <p>Scan a prescription to add the first medical record</p>
                        <Link to="/scan" className="btn btn-primary">
                            <ScanLine size={16} /> Scan Prescription
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
