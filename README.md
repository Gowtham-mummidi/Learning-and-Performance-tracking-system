# 🧠 SmartLearn AI — AI-Powered Personalized Learning Platform

SmartLearn AI is a full-stack AI-powered educational platform that provides personalized learning experiences for students and powerful analytics for teachers. It leverages NLP and generative AI to extract knowledge from PDFs, generate quizzes, provide tutoring, and recommend YouTube resources.

---

## 🎯 Features

### 🔐 Authentication
- **Separate Student & Teacher Portals** — Universal login with role-based access
- **Protected Routes** — Each role sees only their authorized pages
- **Persistent Sessions** — Login state preserved across browser refreshes

### 🎓 Student Portal
| Feature | Description |
|---------|-------------|
| **📊 Dashboard** | Mastery level, study streak, weak areas, AI suggestions, quick access cards |
| **📄 AI PDF Learning Lab** | Upload PDFs → NLP extracts summaries, generates quizzes, finds YouTube resources |
| **💬 AI Tutor Chat** | Real-time conversational AI tutor with quick-question suggestions |
| **📝 AI Quiz Generator** | Enter any topic → AI generates interactive quizzes with scoring |
| **📈 Performance Analytics** | Score progression charts, learning pace, projected grades |
| **📅 Smart Study Planner** | AI-optimized daily schedule based on weak spots |

### 👨‍🏫 Teacher Portal
| Feature | Description |
|---------|-------------|
| **📊 Educator Dashboard** | Active students, class mastery, at-risk students, AI insights |
| **🚨 Intervention Alerts** | Students flagged by AI for falling behind |
| **📉 Curriculum Gap Analysis** | Topics where the class is underperforming |

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 19** | UI library |
| **Vite 8** | Build tool & dev server |
| **React Router v7** | Client-side routing & protected routes |
| **Framer Motion** | Animations & page transitions |
| **Lucide React** | Icon library |
| **Recharts** | Performance analytics charts |
| **Vanilla CSS** | Custom design system (glassmorphism, dark theme) |

### Backend
| Technology | Purpose |
|-----------|---------|
| **Node.js + Express 5** | REST API server |
| **Google Generative AI (Gemini 2.0 Flash)** | Primary AI provider |
| **OpenAI SDK (xAI Grok)** | Secondary AI fallback |
| **pdf-parse** | PDF text extraction (NLP pipeline) |
| **Multer** | File upload handling |
| **CORS** | Cross-origin request support |

### AI Pipeline (Triple Fallback)
```
Request → Google Gemini (primary)
            ↓ (on failure)
         xAI Grok (secondary)
            ↓ (on failure)
         Local Deterministic Fallback (always works)
```

---

## 📁 Project Structure

```
ai-learning-platform/
├── backend/
│   ├── server.js          # Express API server with AI pipeline
│   ├── package.json       # Backend dependencies
│   └── node_modules/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.jsx        # Sidebar + header layout
│   │   ├── pages/
│   │   │   ├── Login.jsx          # Universal login (student/teacher)
│   │   │   ├── Dashboard.jsx      # Student dashboard
│   │   │   ├── StudentPdfLearning.jsx  # PDF upload + AI analysis
│   │   │   ├── AiTutor.jsx        # AI chat tutor
│   │   │   ├── QuizGenerator.jsx  # Topic-based quiz generator
│   │   │   ├── Performance.jsx    # Analytics & charts
│   │   │   ├── StudyPlanner.jsx   # AI study schedule
│   │   │   └── TeacherDashboard.jsx # Teacher analytics
│   │   ├── App.jsx         # Root component + routing
│   │   ├── index.css       # Complete design system
│   │   └── main.jsx        # Entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18 or higher
- **npm** v9 or higher

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/ai-learning-platform.git
cd ai-learning-platform
```

### 2. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Configure Environment (Optional)

Create a `.env` file in the `backend/` directory for your own API keys:

```env
GEMINI_API_KEY=your_google_gemini_api_key
XAI_API_KEY=your_xai_grok_api_key
```

> **Note:** The platform works without API keys using the built-in local fallback engine. For the best AI-powered experience, add a [Google Gemini API key](https://aistudio.google.com/apikey) (free tier available).

### 4. Run the Application

You need **two terminal windows** — one for the backend and one for the frontend.

**Terminal 1 — Start the Backend:**
```bash
cd backend
node server.js
```
You should see:
```
🚀 SmartLearn AI Backend v2.0 running on port 5000
   AI Pipeline: Gemini → Grok → Local Fallback
   Endpoints: /api/health, /api/upload-pdf, /api/tutor, /api/generate-quiz, /api/youtube-topics
```

**Terminal 2 — Start the Frontend:**
```bash
cd frontend
npm run dev
```
You should see:
```
VITE v8.0.3  ready in 500ms
  ➜  Local:   http://localhost:5173/
```

### 5. Open in Browser

Navigate to **http://localhost:5173** in your browser.

### 6. Login Credentials

| Role | Username | Password |
|------|----------|----------|
| Student | `student` | `password` |
| Teacher | `teacher` | `password` |

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Server health check |
| `POST` | `/api/upload-pdf` | Upload PDF → returns summary, quiz, YouTube topics |
| `POST` | `/api/tutor` | AI tutoring chat (`{ question }`) |
| `POST` | `/api/generate-quiz` | Generate quiz from topic (`{ topic, difficulty }`) |
| `POST` | `/api/youtube-topics` | Get YouTube search suggestions (`{ topic }`) |
| `POST` | `/api/analyze-weakness` | Analyze student weaknesses (`{ studentData }`) |

---

## 🏗️ Build for Production

```bash
cd frontend
npm run build
```

The production-ready files will be in `frontend/dist/`.

---

## 🎨 Design System

The platform uses a custom dark-mode design system with:
- **Glassmorphism** cards with backdrop blur
- **Gradient accents** (indigo → violet → teal)
- **Framer Motion** animations on all page transitions
- **Responsive layout** that adapts to mobile screens
- **Inter font** from Google Fonts

---

## 📜 License

MIT License — feel free to use, modify, and distribute.
