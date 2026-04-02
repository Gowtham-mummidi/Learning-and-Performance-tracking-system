import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, GraduationCap, Users, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Login = ({ setRole }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('student');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    if (activeTab === 'teacher') {
      if (username === 'teacher' && password === 'password') {
        localStorage.setItem('userRole', 'teacher');
        setRole('teacher');
        navigate('/teacher-dashboard');
      } else {
        setError('Invalid teacher credentials. Try: teacher / password');
      }
    } else {
      if (username === 'student' && password === 'password') {
        localStorage.setItem('userRole', 'student');
        setRole('student');
        navigate('/student-dashboard');
      } else {
        setError('Invalid student credentials. Try: student / password');
      }
    }
  };

  return (
    <div className="login-page">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="login-card"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Brain size={38} style={{ color: 'var(--secondary)', filter: 'drop-shadow(0 0 12px rgba(139,92,246,0.5))' }} />
          </motion.div>
          <h1 className="text-gradient" style={{ fontSize: '1.75rem', marginBottom: 0 }}>SmartLearn AI</h1>
        </div>

        <p className="text-center text-muted text-sm mb-6">
          AI-Powered Personalized Learning Platform
        </p>

        {/* Tab Switcher */}
        <div className="login-tabs">
          <button
            type="button"
            className={`login-tab ${activeTab === 'student' ? 'active' : ''}`}
            onClick={() => { setActiveTab('student'); setError(''); }}
          >
            <GraduationCap size={16} />
            Student
          </button>
          <button
            type="button"
            className={`login-tab ${activeTab === 'teacher' ? 'active' : ''}`}
            onClick={() => { setActiveTab('teacher'); setError(''); }}
          >
            <Users size={16} />
            Teacher
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="login-input"
              placeholder={`Enter ${activeTab} username`}
              autoComplete="username"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="login-input"
              placeholder="Enter password"
              autoComplete="current-password"
            />
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="login-error"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="login-submit mt-2"
            style={{
              background: activeTab === 'student'
                ? 'linear-gradient(135deg, var(--secondary), var(--accent))'
                : 'linear-gradient(135deg, var(--primary), var(--secondary))',
              boxShadow: activeTab === 'student'
                ? '0 4px 20px rgba(139, 92, 246, 0.3)'
                : '0 4px 20px rgba(99, 102, 241, 0.3)'
            }}
          >
            <span className="flex items-center justify-center gap-2">
              <Sparkles size={16} />
              Access {activeTab === 'student' ? 'Student' : 'Teacher'} Portal
            </span>
          </motion.button>
        </form>

        <p className="text-center text-muted text-xs mt-6" style={{ opacity: 0.5 }}>
          Demo credentials: {activeTab} / password
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
