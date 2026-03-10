# 🏥 MedArchive AI

**Intelligent Medical Record Digitization and Patient Timeline System**

MedArchive AI is an AI-powered application that converts handwritten medical records into structured digital patient timelines using OCR and AI Vision. Designed for clinics, hospitals, and healthcare centers in India and beyond.

## 🌟 Features

- 📷 **AI Prescription Scanner** — Upload/capture prescription images for automatic digitization
- 🤖 **Intelligent Data Extraction** — OCR + Gemini AI extracts patient info, medicines, diagnosis
- 📊 **Visual Medical Timeline** — Beautiful timeline view of patient medical history
- 🔍 **Smart Search** — Search by name, phone, diagnosis, or condition
- 👤 **Auto Profile Creation** — Automatically creates patient profiles from scanned prescriptions
- 🔐 **Role-based Access** — Doctor, Admin, Staff roles with JWT authentication
- 📱 **Responsive Design** — Works on desktop, tablet, and mobile

## 🏗️ Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React 19 + Vite |
| Backend | Python FastAPI |
| Database | SQLite (dev) / PostgreSQL (prod) |
| OCR | EasyOCR |
| AI Parser | Google Gemini API |
| Auth | JWT (python-jose + bcrypt) |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- (Optional) Google Gemini API Key

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Configure environment
# Edit .env file and add your GEMINI_API_KEY

# Run the server
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

### Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Doctor | doctor@medarchive.ai | doctor123 |
| Admin | admin@medarchive.ai | admin123 |

## 📷 How It Works

1. Doctor opens the app and clicks **Scan Prescription**
2. Uploads or drags a prescription image
3. AI extracts text via OCR
4. Gemini AI structures the text into patient data
5. Doctor reviews and edits extracted data
6. Saves record → patient profile created/updated
7. Patient timeline is automatically built

## 🔒 Security

- JWT token authentication
- bcrypt password hashing
- Role-based access control
- CORS protection
- Input validation via Pydantic

## 📁 Project Structure

```
med archive/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI entry point
│   │   ├── config.py        # Settings
│   │   ├── database.py      # DB setup
│   │   ├── models.py        # SQLAlchemy models
│   │   ├── schemas.py       # Pydantic schemas
│   │   ├── auth/            # Authentication
│   │   ├── patients/        # Patient API
│   │   ├── records/         # Records + Scan API
│   │   └── ai/              # OCR + AI Structurer
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Routes
│   │   ├── api/client.js    # API client
│   │   ├── contexts/        # Auth context
│   │   ├── components/      # Sidebar, etc.
│   │   └── pages/           # All pages
│   └── package.json
└── README.md
```

## 🗺️ Roadmap

- [ ] Mobile app (Flutter)
- [ ] Multi-clinic support
- [ ] Offline mode with sync
- [ ] Lab report scanning
- [ ] Voice-to-notes
- [ ] QR code patient ID
- [ ] PostgreSQL migration
- [ ] Docker deployment
- [ ] AWS S3 storage

## 💰 Business Model

- Subscription: ₹500–₹2,000/month per clinic
- Per-scan pricing model
- Government healthcare contracts

## 📄 License

MIT License — Built with ❤️ for healthcare
