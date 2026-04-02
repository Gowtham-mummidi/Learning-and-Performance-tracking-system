import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, BookOpen, Clock, AlertTriangle, ArrowRight, Brain, FileText, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { y: 16, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 120, damping: 16 } }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-6"
    >
      {/* Stats Row */}
      <div className="grid grid-3 gap-4">
        <motion.div variants={itemVariants} className="stat-card">
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs text-muted font-semibold" style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>Mastery Level</p>
            <span className="badge badge-success">Top 15%</span>
          </div>
          <h1 style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>Level 42</h1>
          <div className="progress-bar">
            <motion.div
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: '78%' }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
            />
          </div>
          <p className="text-xs text-muted mt-2">22% to next level</p>
        </motion.div>

        <motion.div variants={itemVariants} className="stat-card">
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs text-muted font-semibold" style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>Study Streak</p>
            <Clock size={18} style={{ color: 'var(--secondary)' }} />
          </div>
          <h1 style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>14 Days</h1>
          <p className="text-xs text-muted mt-2">🔥 You're on fire! Keep it up.</p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="stat-card"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.12))', border: '1px solid rgba(99,102,241,0.2)' }}
        >
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs font-semibold text-gradient" style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>AI Suggestion</p>
            <Brain size={18} style={{ color: 'var(--primary-light)' }} />
          </div>
          <h3 style={{ marginBottom: '0.25rem' }}>Calculus Revision</h3>
          <p className="text-xs text-muted mb-3">You've struggled with derivatives. Spend 20 mins here.</p>
          <button className="btn w-full" onClick={() => navigate('/tutor')}>
            Start AI Session <ArrowRight size={14} />
          </button>
        </motion.div>
      </div>

      {/* Quick Access Cards */}
      <motion.div variants={itemVariants}>
        <h3 className="mb-3">Quick Access</h3>
        <div className="grid grid-3 gap-3">
          <div
            className="glass-card cursor-pointer flex items-center gap-3"
            onClick={() => navigate('/pdf-learning')}
            style={{ padding: '1rem 1.25rem' }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={18} style={{ color: 'var(--primary-light)' }} />
            </div>
            <div>
              <h4 style={{ marginBottom: 0, fontSize: '0.9rem' }}>PDF Learning</h4>
              <p className="text-xs text-muted">Upload &amp; analyze PDFs</p>
            </div>
          </div>

          <div
            className="glass-card cursor-pointer flex items-center gap-3"
            onClick={() => navigate('/tutor')}
            style={{ padding: '1rem 1.25rem' }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageCircle size={18} style={{ color: 'var(--secondary)' }} />
            </div>
            <div>
              <h4 style={{ marginBottom: 0, fontSize: '0.9rem' }}>AI Tutor Chat</h4>
              <p className="text-xs text-muted">Ask anything</p>
            </div>
          </div>

          <div
            className="glass-card cursor-pointer flex items-center gap-3"
            onClick={() => navigate('/quiz-generator')}
            style={{ padding: '1rem 1.25rem' }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(20,184,166,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={18} style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <h4 style={{ marginBottom: 0, fontSize: '0.9rem' }}>Quiz Generator</h4>
              <p className="text-xs text-muted">Generate topic quizzes</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Bottom Section */}
      <div className="grid grid-2 gap-5">
        <motion.div variants={itemVariants} className="flex flex-col gap-3">
          <h3>Weak Area Detection</h3>
          <div className="glass-card flex items-center gap-3" style={{ padding: '1rem 1.25rem' }}>
            <div style={{ width: 38, height: 38, borderRadius: 8, background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AlertTriangle size={16} style={{ color: 'var(--danger)' }} />
            </div>
            <div className="flex-1">
              <h4 style={{ marginBottom: '0.25rem' }}>Organic Chemistry — Aldehydes</h4>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '35%', background: '#f87171' }} />
              </div>
            </div>
            <span className="font-bold text-sm" style={{ color: '#f87171' }}>35%</span>
          </div>

          <div className="glass-card flex items-center gap-3" style={{ padding: '1rem 1.25rem' }}>
            <div style={{ width: 38, height: 38, borderRadius: 8, background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <TrendingUp size={16} style={{ color: 'var(--warning)' }} />
            </div>
            <div className="flex-1">
              <h4 style={{ marginBottom: '0.25rem' }}>Physics — Kinematics</h4>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '55%', background: '#fbbf24' }} />
              </div>
            </div>
            <span className="font-bold text-sm text-warning">55%</span>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="flex flex-col gap-3">
          <h3>Upcoming Smart Plan</h3>
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div className="flex justify-between items-center" style={{ paddingBottom: '1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
              <div>
                <h4 style={{ marginBottom: '0.15rem' }}>Data Structures Quiz</h4>
                <p className="text-xs text-muted">AI-generated based on past errors</p>
              </div>
              <span className="badge badge-primary">Today</span>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <h4 style={{ marginBottom: '0.15rem' }}>English Grammar</h4>
                <p className="text-xs text-muted">Focusing on passive voice</p>
              </div>
              <span className="badge badge-warning">Tomorrow</span>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
