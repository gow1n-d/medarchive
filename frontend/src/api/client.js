const API_BASE = 'http://localhost:8000';

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE;
  }

  getToken() {
    return localStorage.getItem('medarchive_token');
  }

  setToken(token) {
    localStorage.setItem('medarchive_token', token);
  }

  clearToken() {
    localStorage.removeItem('medarchive_token');
    localStorage.removeItem('medarchive_user');
  }

  getUser() {
    const data = localStorage.getItem('medarchive_user');
    return data ? JSON.parse(data) : null;
  }

  setUser(user) {
    localStorage.setItem('medarchive_user', JSON.stringify(user));
  }

  async request(path, options = {}) {
    const token = this.getToken();
    const headers = {
      ...(options.headers || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Don't set Content-Type for FormData
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      this.clearToken();
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail || 'Request failed');
    }

    return response.json();
  }

  // Auth
  async login(email, password) {
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.access_token);
    this.setUser(data.user);
    return data;
  }

  async register(userData) {
    const data = await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    this.setToken(data.access_token);
    this.setUser(data.user);
    return data;
  }

  async getMe() {
    return this.request('/api/auth/me');
  }

  // Dashboard
  async getDashboard() {
    return this.request('/api/dashboard');
  }

  // Patients
  async getPatients(search = '', skip = 0, limit = 50) {
    const params = new URLSearchParams({ skip, limit });
    if (search) params.append('search', search);
    return this.request(`/api/patients/?${params}`);
  }

  async searchPatients(query) {
    return this.request(`/api/patients/search?q=${encodeURIComponent(query)}`);
  }

  async getPatient(id) {
    return this.request(`/api/patients/${id}`);
  }

  async createPatient(data) {
    return this.request('/api/patients/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePatient(id, data) {
    return this.request(`/api/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePatient(id) {
    return this.request(`/api/patients/${id}`, {
      method: 'DELETE',
    });
  }

  // Records
  async scanPrescription(file) {
    const formData = new FormData();
    formData.append('file', file);
    return this.request('/api/records/scan', {
      method: 'POST',
      body: formData,
    });
  }

  async saveRecord(recordData) {
    return this.request('/api/records/save', {
      method: 'POST',
      body: JSON.stringify(recordData),
    });
  }

  async saveRecordWithPatient(formData) {
    return this.request('/api/records/save-with-patient', {
      method: 'POST',
      body: formData,
    });
  }

  async getPatientRecords(patientId) {
    return this.request(`/api/records/patient/${patientId}`);
  }

  async getRecord(id) {
    return this.request(`/api/records/${id}`);
  }

  async deleteRecord(id) {
    return this.request(`/api/records/${id}`, {
      method: 'DELETE',
    });
  }

  // Utility
  isAuthenticated() {
    return !!this.getToken();
  }

  logout() {
    this.clearToken();
  }
}

const api = new ApiClient();
export default api;
