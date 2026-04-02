import React from 'react';
import { motion } from 'framer-motion';
import { Users, AlertCircle, Sparkles, Activity, Send } from 'lucide-react';

const TeacherDashboard = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6"
    >
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-gradient" style={{ marginBottom: '0.25rem' }}>Educator Insights &amp; Control</h2>
          <p className="text-muted text-sm">AI-driven classroom analytics and student monitoring.</p>
        </div>
        <button className="btn">
          <Sparkles size={14} /> Generate Report
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-4 gap-3">
        <div className="stat-card">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs text-muted font-semibold" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>Active Students</p>
            <Users size={18} style={{ color: 'var(--primary-light)' }} />
          </div>
          <h2 className="stat-value" style={{ marginBottom: '0.25rem' }}>142</h2>
          <p className="text-xs text-success">+12 this week</p>
        </div>

        <div className="stat-card">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs text-muted font-semibold" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>Class Avg Mastery</p>
            <Activity size={18} style={{ color: 'var(--secondary)' }} />
          </div>
          <h2 className="stat-value" style={{ marginBottom: '0.25rem' }}>76%</h2>
          <p className="text-xs text-warning">Needs attention in Physics</p>
        </div>

        <div className="stat-card">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs text-muted font-semibold" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>At-Risk Students</p>
            <AlertCircle size={18} style={{ color: 'var(--danger)' }} />
          </div>
          <h2 className="stat-value" style={{ marginBottom: '0.25rem' }}>8</h2>
          <p className="text-xs text-danger">Action required</p>
        </div>

        <div className="stat-card" style={{ background: 'linear-gradient(135deg, rgba(20,184,166,0.1), rgba(16,185,129,0.1))', border: '1px solid rgba(20,184,166,0.2)' }}>
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs text-muted font-semibold" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>AI Insights</p>
            <Sparkles size={18} style={{ color: 'var(--accent)' }} />
          </div>
          <h2 className="stat-value" style={{ marginBottom: '0.25rem' }}>24</h2>
          <p className="text-xs text-accent">Plans deployed</p>
        </div>
      </div>

      {/* Content Sections */}
      <div className="grid grid-2 gap-5">
        <div className="glass-card no-hover flex flex-col gap-3">
          <h3 style={{ marginBottom: '0.25rem' }}>
            Intervention Required
          </h3>
          <p className="text-xs text-muted mb-2">Students flagged by AI for falling behind individual baselines.</p>

          {[
            { name: 'Alex Johnson', issue: 'Consecutive low scores in Algebra', color: 'var(--danger)' },
            { name: 'Sarah Williams', issue: 'Skipped 3 study sessions', color: 'var(--warning)' },
            { name: 'Michael Chang', issue: 'Struggling with advanced vocabulary', color: 'var(--primary-light)' }
          ].map((student, idx) => (
            <div key={idx} className="flex justify-between items-center p-3 rounded" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
              <div>
                <h4 style={{ marginBottom: '0.15rem' }}>{student.name}</h4>
                <p className="text-xs" style={{ color: student.color }}>{student.issue}</p>
              </div>
              <button className="btn btn-secondary text-xs" style={{ padding: '0.35rem 0.75rem' }}>
                <Send size={12} /> Message
              </button>
            </div>
          ))}
        </div>

        <div className="glass-card no-hover flex flex-col gap-3">
          <h3 style={{ marginBottom: '0.25rem' }}>Curriculum Gap Analysis</h3>
          <p className="text-xs text-muted mb-2">Topics where the class is underperforming.</p>

          {[
            { topic: 'Electromagnetism', impact: 'High', drop: '-15%' },
            { topic: 'Trigonometric Identities', impact: 'Medium', drop: '-8%' },
          ].map((item, idx) => (
            <div key={idx} className="flex justify-between items-center p-3 rounded" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
              <div>
                <h4 style={{ marginBottom: '0.15rem' }}>{item.topic}</h4>
                <span className={`badge ${item.impact === 'High' ? 'badge-danger' : 'badge-warning'}`}>
                  {item.impact} Impact
                </span>
              </div>
              <span className="font-bold text-danger">{item.drop}</span>
            </div>
          ))}

          <button className="btn w-full mt-2">
            <Sparkles size={14} /> Deploy Adaptive Module
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default TeacherDashboard;
