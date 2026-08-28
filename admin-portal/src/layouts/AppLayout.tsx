import React, { useEffect } from 'react';
import { Outlet, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { LogOut, Map, Bus, Users, MessageSquare, FileText, Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SocketProvider } from '../services/SocketProvider';

export const AppLayout: React.FC = () => {
  const { accessToken, user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Apply theme to document
  useEffect(() => {
    if (user?.themePref) {
      document.documentElement.setAttribute('data-theme', user.themePref);
    }
  }, [user?.themePref]);

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-container">
      <header className="app-header" style={{ padding: '0 1.5rem 0 0', height: '72px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', height: '100%' }}>
          <div style={{ backgroundColor: 'white', height: '100%', padding: '0 1.5rem', display: 'flex', alignItems: 'center' }}>
            <img
              src="https://vistas.ac.in/wp-content/uploads/2026/08/vels-logo.jpg"
              alt="VELS University"
              style={{ height: '50px' }}
              onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/150x40?text=VELS+Logo' }}
            />
          </div>
          <nav style={{ display: 'flex', gap: '1rem', marginLeft: '1rem' }}>
            <button className="outline" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }} onClick={() => navigate('/')}>
              <Map size={16} style={{ display: 'inline', marginRight: '0.5rem' }} /> {t('nav.dashboard')}
            </button>
            <button className="outline" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }} onClick={() => navigate('/buses')}>
              <Bus size={16} style={{ display: 'inline', marginRight: '0.5rem' }} /> {t('nav.buses')}
            </button>
            <button className="outline" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }} onClick={() => navigate('/users')}>
              <Users size={16} style={{ display: 'inline', marginRight: '0.5rem' }} /> {t('nav.users')}
            </button>
            <button className="outline" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }} onClick={() => navigate('/chat')}>
              <MessageSquare size={16} style={{ display: 'inline', marginRight: '0.5rem' }} /> {t('nav.chat')}
            </button>
            <button className="outline" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }} onClick={() => navigate('/logs')}>
              <FileText size={16} style={{ display: 'inline', marginRight: '0.5rem' }} /> {t('nav.logs')}
            </button>
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.875rem' }}>{user?.fullName}</span>
          <button
            style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '0.25rem' }}
            onClick={toggleTheme}
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button className="outline" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }} onClick={handleLogout}>
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <SocketProvider>
        <main className="app-main">
          <Outlet />
        </main>
      </SocketProvider>
    </div>
  );
};
