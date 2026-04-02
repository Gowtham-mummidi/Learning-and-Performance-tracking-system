import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Brain, LayoutDashboard, Target, Calendar, UserCheck, FileText, LogOut, MessageCircle, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

const Layout = ({ role, setRole }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    setRole(null);
    navigate('/login');
  };

  const studentNavItems = [
    { name: 'Dashboard', path: '/student-dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'AI PDF Learning', path: '/pdf-learning', icon: <FileText size={18} /> },
    { name: 'AI Tutor Chat', path: '/tutor', icon: <MessageCircle size={18} /> },
    { name: 'Quiz Generator', path: '/quiz-generator', icon: <BookOpen size={18} /> },
    { name: 'Performance', path: '/performance', icon: <Target size={18} /> },
    { name: 'Study Planner', path: '/planner', icon: <Calendar size={18} /> },
  ];

  const teacherNavItems = [
    { name: 'Dashboard', path: '/teacher-dashboard', icon: <UserCheck size={18} /> },
  ];

  const navItems = role === 'teacher' ? teacherNavItems : studentNavItems;

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div>
          <div className="logo">
            <Brain size={28} style={{ color: 'var(--secondary)', filter: 'drop-shadow(0 0 8px rgba(139,92,246,0.4))' }} />
            <span className="text-gradient">SmartLearn AI</span>
          </div>

          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                {item.icon}
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>

        <button onClick={handleLogout} className="nav-link logout-btn">
          <LogOut size={18} />
          Logout
        </button>
      </aside>

      <main className="main-content">
        <div className="header-bar">
          <div>
            <p className="text-xs text-muted font-semibold" style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>Welcome back</p>
            <h2 style={{ textTransform: 'capitalize', marginBottom: 0 }}>{role} Portal</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className={`badge ${role === 'student' ? 'badge-primary' : 'badge-secondary'}`}>
              {role === 'student' ? '🧠 AI Active' : '📊 Teacher Mode'}
            </span>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: 'white',
              boxShadow: '0 0 15px var(--primary-glow)'
            }}>
              {role === 'student' ? 'ST' : 'TR'}
            </div>
          </div>
        </div>

        <motion.div
          key={role}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
};

export default Layout;
