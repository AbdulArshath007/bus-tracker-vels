import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { format } from 'date-fns';
import { Moon, Sun } from 'lucide-react';
import { SkeletonLogin } from '../components/Skeleton';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [expectedCaptcha, setExpectedCaptcha] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  
  const { setAuth } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  // Generate captcha + dismiss page skeleton on mount
  useEffect(() => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setExpectedCaptcha(result);

    const timer = setTimeout(() => setPageLoading(false), 750);
    return () => clearTimeout(timer);
  }, []);

  if (pageLoading) return <SkeletonLogin />;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {


      if (captcha.toUpperCase() !== expectedCaptcha) {
        setError('Invalid Captcha. Please try again.');
        setLoading(false);
        // Regenerate captcha on failure
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let result = '';
        for (let i = 0; i < 4; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setExpectedCaptcha(result);
        setCaptcha('');
        return;
      }

      const response = await api.post('/auth/login', { email, password });
      const { access_token, refresh_token, user } = response.data;
      
      if (user.role !== 'admin') {
        setError('Only administrators can access this portal.');
        setLoading(false);
        return;
      }

      setAuth(access_token, refresh_token, user);
      navigate('/');
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.response) {
        setError(err.response?.data?.message || 'Invalid credentials.');
      } else {
        setError(err.message || 'Network error. Backend might be unreachable.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setError('');
    setLoading(true);

    try {
      // The backend expects role: 'admin' since this is the admin portal
      const response = await api.post('/auth/guest-login', { role: 'admin' });
      const { access_token, refresh_token, user } = response.data;
      
      setAuth(access_token, refresh_token, user);
      navigate('/');
    } catch (err: any) {
      console.error('Guest login error:', err);
      setError(err.response?.data?.message || 'Guest login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex', 
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: 'var(--bg-color)',
      color: 'var(--text-main)'
    }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '4rem', position: 'relative' }}>
        
        {/* Global Theme Toggle */}
        <button 
          onClick={toggleTheme}
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '0.5rem' }}
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
        </button>

        {/* Login Box */}
        <div style={{ 
          width: '100%', 
          maxWidth: '600px', 
          backgroundColor: 'var(--bg-surface)', 
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}>
          {/* Integrated White Logo Header */}
          <div style={{ backgroundColor: 'white', padding: '1.5rem', display: 'flex', justifyContent: 'center' }}>
            <img src="https://www.velsuniv.ac.in/images/logo.png" alt="VELS Logo" style={{ height: '70px' }} />
          </div>

          <div style={{ backgroundColor: '#2170B5', color: 'white', padding: '1rem', textAlign: 'center', fontWeight: 600, letterSpacing: '1px' }}>
            VELS Admin Log In
          </div>
          
          <div style={{ padding: '2rem' }}>
            {error && (
              <div style={{ backgroundColor: 'var(--color-danger)', color: 'white', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}



            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', alignItems: 'center', gap: '1rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, textAlign: 'right' }}>Your ID (Email):</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  style={{ width: '100%' }}
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', alignItems: 'center', gap: '1rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, textAlign: 'right' }}>Password:</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', alignItems: 'center', gap: '1rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, textAlign: 'right' }}>Captcha:</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    placeholder="Enter code"
                    value={captcha} 
                    onChange={(e) => setCaptcha(e.target.value)} 
                    required 
                    style={{ flex: 1, minWidth: '100px', backgroundColor: 'var(--bg-color)', textTransform: 'uppercase' }}
                  />
                  <div style={{ backgroundColor: '#f0f0f0', color: '#111', padding: '0.5rem', width: '120px', textAlign: 'center', fontSize: '1.5rem', fontWeight: 'bold', letterSpacing: '6px', border: '1px solid #ccc', borderRadius: '4px', fontStyle: 'italic', userSelect: 'none' }}>
                    {expectedCaptcha}
                  </div>
                </div>
              </div>

              <button type="submit" style={{ backgroundColor: '#2170B5', color: 'white', border: 'none', padding: '0.75rem', borderRadius: '4px', fontWeight: 600, marginTop: '1rem', cursor: 'pointer' }} disabled={loading}>
                {loading ? '...' : 'Log In'}
              </button>
              
              <button 
                type="button"
                onClick={handleGuestLogin} 
                style={{ 
                  backgroundColor: 'transparent', 
                  color: '#2170B5', 
                  border: 'none', 
                  padding: '0.5rem', 
                  fontWeight: 600, 
                  marginTop: '0.5rem', 
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }} 
                disabled={loading}
              >
                Continue as Guest
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Footers */}
      <div style={{ backgroundColor: '#1C2939', color: '#8898AA', fontSize: '0.875rem', padding: '1rem 2rem', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        If you are an Admin and this is your first login, please contact the IT Department to provision your Role ID.
      </div>
      <div style={{ backgroundColor: '#2170B5', color: 'white', fontSize: '0.875rem', padding: '0.75rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{format(new Date(), 'EEE dd-MMM-yyyy HH:mm:ss')}</span>
        <span>eVarsity® ERP</span>
      </div>
    </div>
  );
};
