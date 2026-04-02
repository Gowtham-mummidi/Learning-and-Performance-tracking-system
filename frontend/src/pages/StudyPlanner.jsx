import React from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, CheckCircle, Clock } from 'lucide-react';

const StudyPlanner = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6"
    >
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-gradient" style={{ marginBottom: '0.25rem' }}>Smart Study Planner</h2>
          <p className="text-muted text-sm">Dynamic schedule optimized by AI based on your circadian rhythm and weak spots.</p>
        </div>
        <button className="btn btn-secondary">
          <Clock size={14} /> Regenerate
        </button>
      </div>

      <div className="grid grid-3 gap-4">
        {/* Today */}
        <div className="glass-card no-hover flex flex-col gap-3" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="flex justify-between items-center p-3" style={{ background: 'rgba(99,102,241,0.1)', borderBottom: '1px solid var(--border)' }}>
            <span className="font-bold text-sm">Today</span>
            <CalendarIcon size={16} style={{ color: 'var(--primary-light)' }} />
          </div>

          <div className="flex flex-col gap-2 p-3">
            <div className="flex items-start gap-3 p-3 rounded" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <CheckCircle size={16} className="mt-1" style={{ color: 'var(--success)', flexShrink: 0 }} />
              <div>
                <h4 style={{ marginBottom: '0.1rem', textDecoration: 'line-through', opacity: 0.5 }}>Physics: Kinematics</h4>
                <span className="text-xs text-muted">9:00 AM — 45 mins</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--primary)', marginTop: '0.15rem', flexShrink: 0 }} />
              <div>
                <h4 style={{ marginBottom: '0.1rem' }}>
                  Chem: Aldehydes
                  <span className="badge badge-danger" style={{ marginLeft: '0.5rem' }}>Priority</span>
                </h4>
                <span className="text-xs" style={{ color: 'var(--primary-light)' }}>11:30 AM — 60 mins &bull; AI adaptive</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded" style={{ opacity: 0.6 }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--text-muted)', marginTop: '0.15rem', flexShrink: 0 }} />
              <div>
                <h4 style={{ marginBottom: '0.1rem' }}>Literature Essay Prep</h4>
                <span className="text-xs text-muted">2:00 PM — 30 mins</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tomorrow */}
        <div className="glass-card no-hover flex flex-col gap-3" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="flex justify-between items-center p-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="font-bold text-sm">Tomorrow</span>
            <span className="text-xs text-muted">April 3</span>
          </div>

          <div className="flex flex-col gap-2 p-3">
            <div className="flex items-start gap-3 p-3 rounded" style={{ opacity: 0.6 }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--text-muted)', marginTop: '0.15rem', flexShrink: 0 }} />
              <div>
                <h4 style={{ marginBottom: '0.1rem' }}>Math: Integration</h4>
                <span className="text-xs text-muted">10:00 AM — 90 mins</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded" style={{ opacity: 0.6 }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--text-muted)', marginTop: '0.15rem', flexShrink: 0 }} />
              <div>
                <h4 style={{ marginBottom: '0.1rem' }}>History: WW2 Context</h4>
                <span className="text-xs text-muted">1:00 PM — 45 mins</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Forecast */}
        <div className="glass-card no-hover flex flex-col items-center justify-center" style={{ border: '1px dashed rgba(99,102,241,0.3)' }}>
          <div className="animate-float">
            <CalendarIcon size={32} style={{ color: 'var(--primary-light)', opacity: 0.5, marginBottom: '1rem' }} />
          </div>
          <h4 className="text-primary text-center text-sm" style={{ marginBottom: '0.75rem' }}>
            AI is forecasting your weekend workload based on today's progress...
          </h4>
          <div className="w-full progress-bar">
            <div className="progress-fill animate-shimmer" style={{ width: '100%' }} />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default StudyPlanner;
