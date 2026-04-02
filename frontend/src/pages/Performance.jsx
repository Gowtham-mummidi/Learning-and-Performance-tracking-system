import React from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Award, Zap, Target } from 'lucide-react';

const data = [
  { name: 'Week 1', score: 65, avg: 50 },
  { name: 'Week 2', score: 72, avg: 52 },
  { name: 'Week 3', score: 68, avg: 54 },
  { name: 'Week 4', score: 85, avg: 55 },
  { name: 'Week 5', score: 82, avg: 58 },
  { name: 'Week 6', score: 90, avg: 60 },
];

const Performance = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6"
    >
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-gradient" style={{ marginBottom: '0.25rem' }}>Performance Analytics</h2>
          <p className="text-muted text-sm">Track your learning curve mapped continuously by AI.</p>
        </div>
        <select style={{ width: 'fit-content' }}>
          <option>All Subjects</option>
          <option>Mathematics</option>
          <option>Physics</option>
          <option>Literature</option>
        </select>
      </div>

      <div className="grid grid-4 gap-3">
        <div className="stat-card flex items-center gap-3">
          <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Award size={20} style={{ color: 'var(--primary-light)' }} />
          </div>
          <div>
            <p className="text-xs text-muted font-semibold" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>Avg. Score</p>
            <h2 style={{ marginBottom: 0 }}>84%</h2>
          </div>
        </div>
        <div className="stat-card flex items-center gap-3">
          <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={20} style={{ color: 'var(--warning)' }} />
          </div>
          <div>
            <p className="text-xs text-muted font-semibold" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>Learning Pace</p>
            <h2 style={{ marginBottom: 0 }}>Fast</h2>
          </div>
        </div>
        <div className="stat-card flex items-center gap-3">
          <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Target size={20} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <p className="text-xs text-muted font-semibold" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>Goals Hit</p>
            <h2 style={{ marginBottom: 0 }}>12/15</h2>
          </div>
        </div>
        <div className="stat-card flex items-center gap-3">
          <div style={{ width: 42, height: 42, borderRadius: 10, background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '0.85rem' }}>
            A+
          </div>
          <div>
            <p className="text-xs text-muted font-semibold" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>Projected</p>
            <h2 style={{ marginBottom: 0 }}>Grade</h2>
          </div>
        </div>
      </div>

      <div className="glass-card no-hover" style={{ height: '380px', padding: '1.25rem 1.25rem 0.5rem' }}>
        <h3 className="mb-3">Score Progression vs Peer Average</h3>
        <ResponsiveContainer width="100%" height="85%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(13, 19, 33, 0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                color: '#f1f5f9',
                fontSize: '0.85rem'
              }}
            />
            <Area type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" name="Your Score" />
            <Line type="monotone" dataKey="avg" stroke="#14b8a6" strokeWidth={2} strokeDasharray="4 4" name="Class Average" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default Performance;
