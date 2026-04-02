import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Performance from './pages/Performance';
import TeacherDashboard from './pages/TeacherDashboard';
import StudyPlanner from './pages/StudyPlanner';
import Login from './pages/Login';
import StudentPdfLearning from './pages/StudentPdfLearning';
import AiTutor from './pages/AiTutor';
import QuizGenerator from './pages/QuizGenerator';
import './index.css';

function App() {
  const [role, setRole] = useState(localStorage.getItem('userRole') || null);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login setRole={setRole} />} />

        {role ? (
          <Route path="/" element={<Layout role={role} setRole={setRole} />}>
            {role === 'student' ? (
              <>
                <Route index element={<Navigate to="/student-dashboard" replace />} />
                <Route path="student-dashboard" element={<Dashboard />} />
                <Route path="pdf-learning" element={<StudentPdfLearning />} />
                <Route path="tutor" element={<AiTutor />} />
                <Route path="quiz-generator" element={<QuizGenerator />} />
                <Route path="performance" element={<Performance />} />
                <Route path="planner" element={<StudyPlanner />} />
                <Route path="*" element={<Navigate to="/student-dashboard" replace />} />
              </>
            ) : (
              <>
                <Route index element={<Navigate to="/teacher-dashboard" replace />} />
                <Route path="teacher-dashboard" element={<TeacherDashboard />} />
                <Route path="*" element={<Navigate to="/teacher-dashboard" replace />} />
              </>
            )}
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
