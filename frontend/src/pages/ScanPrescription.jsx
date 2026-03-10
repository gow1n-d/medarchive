import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import {
    Upload,
    Camera,
    FileImage,
    Check,
    X,
    AlertCircle,
    Pill,
    User,
    Stethoscope,
    Building,
    Calendar,
    Save,
    RotateCcw,
} from 'lucide-react';

export default function ScanPrescription() {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [scanning, setScanning] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    // Editable fields from scan
    const [editData, setEditData] = useState({
        patient_name: '',
        patient_age: '',
        patient_gender: '',
        doctor_name: '',
        hospital_name: '',
        diagnosis: '',
        date: '',
        medicines: [],
    });

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
            setScanResult(null);
            setError('');
            setSuccess('');
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files?.[0];
        if (droppedFile) {
            setFile(droppedFile);
            setPreview(URL.createObjectURL(droppedFile));
            setScanResult(null);
            setError('');
        }
    };

    const handleScan = async () => {
        if (!file) return;
        setScanning(true);
        setError('');

        try {
            const result = await api.scanPrescription(file);
            setScanResult(result);
            setEditData({
                patient_name: result.patient_name || '',
                patient_age: result.patient_age || '',
                patient_gender: result.patient_gender || '',
                doctor_name: result.doctor_name || '',
                hospital_name: result.hospital_name || '',
                diagnosis: result.diagnosis || '',
                date: result.date || '',
                medicines: result.medicines || [],
            });
        } catch (err) {
            setError(err.message || 'Scan failed');
        } finally {
            setScanning(false);
        }
    };

    const handleSaveRecord = async () => {
        if (!editData.patient_name) {
            setError('Patient name is required');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('patient_name', editData.patient_name);
            if (editData.patient_age) formData.append('patient_age', editData.patient_age);
            if (editData.patient_gender) formData.append('patient_gender', editData.patient_gender);
            if (editData.doctor_name) formData.append('doctor_name', editData.doctor_name);
            if (editData.hospital_name) formData.append('hospital_name', editData.hospital_name);
            if (editData.diagnosis) formData.append('diagnosis', editData.diagnosis);
            if (editData.date) formData.append('record_date', editData.date);
            formData.append('medicines_json', JSON.stringify(editData.medicines));
            formData.append('raw_ocr_text', scanResult?.raw_text || '');
            formData.append('record_type', 'prescription');

            await api.saveRecordWithPatient(formData);
            setSuccess('Record saved successfully!');
            setTimeout(() => navigate('/patients'), 1500);
        } catch (err) {
            setError(err.message || 'Failed to save record');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        setFile(null);
        setPreview(null);
        setScanResult(null);
        setError('');
        setSuccess('');
        setEditData({
            patient_name: '',
            patient_age: '',
            patient_gender: '',
            doctor_name: '',
            hospital_name: '',
            diagnosis: '',
            date: '',
            medicines: [],
        });
    };

    const updateMedicine = (index, field, value) => {
        setEditData(prev => {
            const newMeds = [...prev.medicines];
            newMeds[index] = { ...newMeds[index], [field]: value };
            return { ...prev, medicines: newMeds };
        });
    };

    const addMedicine = () => {
        setEditData(prev => ({
            ...prev,
            medicines: [...prev.medicines, { medicine_name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
        }));
    };

    const removeMedicine = (index) => {
        setEditData(prev => ({
            ...prev,
            medicines: prev.medicines.filter((_, i) => i !== index),
        }));
    };

    const confidencePercent = scanResult?.confidence ? Math.round(scanResult.confidence * 100) : 0;
    const confidenceClass = confidencePercent >= 70 ? 'high' : confidencePercent >= 40 ? 'medium' : 'low';

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <h2>📷 Scan Prescription</h2>
                <p>Upload or capture a prescription image for AI-powered digitization</p>
            </div>

            <div className="page-body">
                {success && (
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', marginBottom: '1.5rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                        <Check size={16} /> {success}
                    </div>
                )}

                {error && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', marginBottom: '1.5rem', color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                {/* Upload Zone */}
                {!preview && (
                    <div
                        className="scan-upload-zone"
                        onClick={() => fileInputRef.current?.click()}
                        onDrag={(e) => e.preventDefault()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                        />
                        <div className="scan-upload-icon">
                            <Upload />
                        </div>
                        <div className="scan-upload-title">Upload Prescription Image</div>
                        <div className="scan-upload-text">
                            Drag and drop or click to browse
                            <br />
                            Supports JPG, PNG, WebP, BMP
                        </div>
                        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button className="btn btn-primary" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                                <FileImage size={16} /> Browse Files
                            </button>
                        </div>
                    </div>
                )}

                {/* Preview + Results */}
                {preview && (
                    <div className="scan-preview">
                        {/* Image Preview */}
                        <div className="scan-preview-image">
                            <img src={preview} alt="Prescription preview" />
                            <div style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                                {!scanResult && (
                                    <button className="btn btn-primary w-full" onClick={handleScan} disabled={scanning}>
                                        {scanning ? (
                                            <>
                                                <span className="spinner" style={{ width: 16, height: 16, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                                                Scanning with AI...
                                            </>
                                        ) : (
                                            <><Camera size={16} /> Scan with AI</>
                                        )}
                                    </button>
                                )}
                                <button className="btn btn-secondary" onClick={handleReset}>
                                    <RotateCcw size={16} /> Reset
                                </button>
                            </div>
                        </div>

                        {/* Scan Results */}
                        {scanResult && (
                            <div className="scan-result-panel animate-fade-in">
                                {/* Confidence Bar */}
                                <div className="confidence-bar">
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>AI Confidence:</span>
                                    <div className="confidence-track">
                                        <div className={`confidence-fill ${confidenceClass}`} style={{ width: `${confidencePercent}%` }} />
                                    </div>
                                    <span className={`confidence-label`} style={{ color: confidenceClass === 'high' ? 'var(--success)' : confidenceClass === 'medium' ? 'var(--warning)' : 'var(--error)' }}>
                                        {confidencePercent}%
                                    </span>
                                </div>

                                {/* Patient Info */}
                                <div className="scan-result-section">
                                    <h3><User size={16} /> Patient Information</h3>
                                    <div className="scan-result-grid">
                                        <div className="scan-field">
                                            <label>Patient Name *</label>
                                            <input
                                                className="form-input"
                                                value={editData.patient_name}
                                                onChange={(e) => setEditData({ ...editData, patient_name: e.target.value })}
                                                placeholder="Patient name"
                                            />
                                        </div>
                                        <div className="scan-field">
                                            <label>Age</label>
                                            <input
                                                className="form-input"
                                                type="number"
                                                value={editData.patient_age}
                                                onChange={(e) => setEditData({ ...editData, patient_age: e.target.value })}
                                                placeholder="Age"
                                            />
                                        </div>
                                        <div className="scan-field">
                                            <label>Gender</label>
                                            <select
                                                className="form-input"
                                                value={editData.patient_gender}
                                                onChange={(e) => setEditData({ ...editData, patient_gender: e.target.value })}
                                            >
                                                <option value="">Select</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                        <div className="scan-field">
                                            <label>Date</label>
                                            <input
                                                className="form-input"
                                                value={editData.date}
                                                onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                                                placeholder="YYYY-MM-DD"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Medical Info */}
                                <div className="scan-result-section">
                                    <h3><Stethoscope size={16} /> Medical Information</h3>
                                    <div className="scan-result-grid">
                                        <div className="scan-field">
                                            <label>Doctor Name</label>
                                            <input
                                                className="form-input"
                                                value={editData.doctor_name}
                                                onChange={(e) => setEditData({ ...editData, doctor_name: e.target.value })}
                                                placeholder="Doctor name"
                                            />
                                        </div>
                                        <div className="scan-field">
                                            <label>Hospital/Clinic</label>
                                            <input
                                                className="form-input"
                                                value={editData.hospital_name}
                                                onChange={(e) => setEditData({ ...editData, hospital_name: e.target.value })}
                                                placeholder="Hospital name"
                                            />
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '0.75rem' }}>
                                        <div className="scan-field">
                                            <label>Diagnosis</label>
                                            <input
                                                className="form-input"
                                                value={editData.diagnosis}
                                                onChange={(e) => setEditData({ ...editData, diagnosis: e.target.value })}
                                                placeholder="Diagnosis"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Medicines */}
                                <div className="scan-result-section">
                                    <h3><Pill size={16} /> Medicines ({editData.medicines.length})</h3>
                                    {editData.medicines.map((med, idx) => (
                                        <div key={idx} style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', padding: '0.75rem', marginBottom: '0.5rem', border: '1px solid var(--border-color)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                <span style={{ fontSize: '0.7rem', color: 'var(--primary-400)', fontWeight: 600 }}>Medicine {idx + 1}</span>
                                                <button className="btn btn-ghost btn-sm" onClick={() => removeMedicine(idx)} style={{ color: 'var(--error)', padding: '2px 6px' }}>
                                                    <X size={14} />
                                                </button>
                                            </div>
                                            <div className="scan-result-grid">
                                                <div>
                                                    <input className="form-input" placeholder="Medicine name" value={med.medicine_name} onChange={(e) => updateMedicine(idx, 'medicine_name', e.target.value)} style={{ fontSize: '0.8rem', padding: '6px 10px' }} />
                                                </div>
                                                <div>
                                                    <input className="form-input" placeholder="Dosage (5mg)" value={med.dosage || ''} onChange={(e) => updateMedicine(idx, 'dosage', e.target.value)} style={{ fontSize: '0.8rem', padding: '6px 10px' }} />
                                                </div>
                                                <div>
                                                    <input className="form-input" placeholder="Frequency" value={med.frequency || ''} onChange={(e) => updateMedicine(idx, 'frequency', e.target.value)} style={{ fontSize: '0.8rem', padding: '6px 10px' }} />
                                                </div>
                                                <div>
                                                    <input className="form-input" placeholder="Duration" value={med.duration || ''} onChange={(e) => updateMedicine(idx, 'duration', e.target.value)} style={{ fontSize: '0.8rem', padding: '6px 10px' }} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <button className="btn btn-secondary btn-sm" onClick={addMedicine}>
                                        + Add Medicine
                                    </button>
                                </div>

                                {/* Raw OCR Text */}
                                <div className="scan-result-section">
                                    <h3>📄 Raw OCR Text</h3>
                                    <pre style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-md)', fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.6, border: '1px solid var(--border-color)', maxHeight: 200, overflow: 'auto' }}>
                                        {scanResult.raw_text}
                                    </pre>
                                </div>

                                {/* Save Button */}
                                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                                    <button className="btn btn-primary btn-lg" onClick={handleSaveRecord} disabled={saving || !editData.patient_name} style={{ flex: 1 }}>
                                        {saving ? (
                                            <>
                                                <span className="spinner" style={{ width: 16, height: 16, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                                                Saving...
                                            </>
                                        ) : (
                                            <><Save size={16} /> Save Record</>
                                        )}
                                    </button>
                                    <button className="btn btn-secondary btn-lg" onClick={handleReset}>
                                        <RotateCcw size={16} /> Start Over
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Scanning Loading State */}
                        {scanning && !scanResult && (
                            <div className="scan-result-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', minHeight: 300 }}>
                                <div className="spinner spinner-lg" />
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>AI is analyzing...</p>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Extracting text and structuring medical data</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
