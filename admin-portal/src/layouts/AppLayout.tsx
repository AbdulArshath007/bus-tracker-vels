import React, { useEffect, useState } from 'react';
import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import {
  LogOut, Map, Bus, Users, MessageSquare,
  FileText, Moon, Sun, Menu, X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SocketProvider } from '../services/SocketProvider';

export const AppLayout: React.FC = () => {
  const { accessToken, user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Apply user's saved theme preference
  useEffect(() => {
    if (user?.themePref) {
      document.documentElement.setAttribute('data-theme', user.themePref);
    }
  }, [user?.themePref]);

  // Close mobile nav whenever the route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { icon: <Map size={16} />, label: t('nav.dashboard'), path: '/' },
    { icon: <Bus size={16} />, label: t('nav.buses'),     path: '/buses' },
    { icon: <Users size={16} />, label: t('nav.users'),  path: '/users' },
    { icon: <MessageSquare size={16} />, label: t('nav.chat'), path: '/chat' },
    { icon: <FileText size={16} />, label: t('nav.logs'), path: '/logs' },
  ];

  return (
    <div className="app-container">
      <header className="app-header">
        {/* ── Logo ──────────────────────────────────────────────── */}
        <div className="header-logo">
          <img
            src="https://vistas.ac.in/wp-content/uploads/2026/08/vels-logo.jpg"
            alt="VELS University"
            className="header-logo-img"
            onError={(e) => {
              e.currentTarget.src =
                'https://via.placeholder.com/120x40?text=VELS';
            }}
          />
        </div>

        {/* ── Desktop nav ───────────────────────────────────────── */}
        <nav className={`app-nav${menuOpen ? ' app-nav--open' : ''}`}>
          {navItems.map((item) => (
            <button
              key={item.path}
              className={`nav-btn outline${
                location.pathname === item.path ? ' nav-btn--active' : ''
              }`}
              onClick={() => navigate(item.path)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}

          {/* Mobile-only: user + theme + logout inside the open menu */}
          <div className="mobile-nav-footer">
            <span className="mobile-username">{user?.fullName}</span>
            <div className="mobile-nav-actions">
              <button
                className="icon-btn"
                onClick={toggleTheme}
                title="Toggle Theme"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button className="nav-btn danger" onClick={handleLogout}>
                <LogOut size={15} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </nav>

        {/* ── Desktop: right-side actions ───────────────────────── */}
        <div className="header-actions">
          <span className="header-username">{user?.fullName}</span>
          <button
            className="icon-btn"
            onClick={toggleTheme}
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button className="icon-btn outline" onClick={handleLogout} title="Logout">
            <LogOut size={18} />
          </button>
        </div>

        {/* ── Mobile hamburger ──────────────────────────────────── */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      <SocketProvider>
        <main className="app-main">
          <Outlet />
        </main>
      </SocketProvider>
    </div>
  );
};
