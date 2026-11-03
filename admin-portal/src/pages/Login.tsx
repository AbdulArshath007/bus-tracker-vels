import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import api from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { format } from 'date-fns';
import { Moon, Sun, ShieldCheck, Radio } from 'lucide-react';
import { SkeletonLogin } from '../components/Skeleton';

// Fix standard leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom Icons for Mock Map
const busIcon = L.divIcon({
  html: `
    <div style="background-color: #2170B5; width: 34px; height: 34px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 17h16M4 17a2 2 0 0 0-2-2V9a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6a2 2 0 0 0-2 2M4 17v2a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-2M14 17v2a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-2" />
        <path d="M8 7v4" />
        <path d="M16 7v4" />
      </svg>
    </div>
  `,
  className: '',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

const campusIcon = L.divIcon({
  html: `
    <div style="background-color: #10B981; width: 36px; height: 36px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 21h18M3 7v14M21 7v14M6 21V11M10 21V11M14 21V11M18 21V11M12 3L2 7h20L12 3z" />
      </svg>
    </div>
  `,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const deviceIcon = L.divIcon({
  html: `
    <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background-color: rgba(33, 112, 181, 0.35);"></div>
      <div style="width: 16px; height: 16px; border-radius: 50%; background-color: #2170B5; border: 2.5px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.4);"></div>
    </div>
  `,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const MOCK_ROUTE: [number, number][] = [
  [12.9698, 80.1448], // Tambaram Sanatorium
  [12.9647, 80.1517], // Bus #01 pos
  [12.9602, 80.1485], // Pallavaram GST Road
  [12.9562, 80.1433], // VELS Campus
];

export const Login: React.FC = () => {
  const [email, setEmail] = useState('admin@vels.edu');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [devicePos, setDevicePos] = useState<[number, number]>([12.9698, 80.1448]);

  const { setAuth } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setPageLoading(false), 300);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setDevicePos([pos.coords.latitude, pos.coords.longitude]),
        () => setDevicePos([12.9698, 80.1448]),
        { timeout: 4000, enableHighAccuracy: true }
      );
    }
    return () => clearTimeout(timer);
  }, []);

  if (pageLoading) return <SkeletonLogin />;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Mock login: no DB or verification required!
      try {
        const response = await api.post('/auth/guest-login', { role: 'admin' });
        if (response.data?.access_token) {
          const { access_token, refresh_token, user } = response.data;
          setAuth(access_token, refresh_token, {
            ...user,
            fullName: user.fullName || 'VELS Administrator',
            role: 'admin',
          });
          navigate('/');
          return;
        }
      } catch {
        // Pure local mock login
      }

      const mockAdminUser = {
        id: 'admin_mock_123',
        role: 'admin',
        fullName: 'VELS Administrator',
        languagePref: 'en' as const,
        themePref: 'light' as const,
      };
      setAuth('mock_access_token_admin', 'mock_refresh_token_admin', mockAdminUser);
      navigate('/');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    handleLogin({ preventDefault: () => {} } as any);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: 'var(--bg-color)',
      color: 'var(--text-main)'
    }}>
      {/* Top Navbar */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 2rem',
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-color)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img src="https://erp.vistas.ac.in/velsonline/resources/Image/1ERPcollege_logo.jpg" alt="VELS Logo" style={{ height: '40px' }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#2170B5' }}>VELS UNIVERSITY</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Campus Transportation Management • Admin Portal</div>
          </div>
        </div>

        <button
          onClick={toggleTheme}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '0.5rem' }}
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </header>

      {/* Main Two-Column Layout */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: 'minmax(320px, 1fr) minmax(360px, 480px)',
        gap: '1.5rem',
        padding: '1.5rem 2rem',
        alignItems: 'stretch',
      }}>
        {/* Mock Map Panel */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '12px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid var(--border-color)',
          minHeight: '480px',
          position: 'relative',
        }}>
          {/* Map Header Status Banner */}
          <div style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'rgba(33, 112, 181, 0.08)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.85rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#2170B5', fontWeight: 600 }}>
              <Radio size={16} className="animate-pulse" />
              <span>Live Campus Fleet Map (Mock Preview)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>🟢 2 Buses En-Route</span>
              <span>📍 GPS: {devicePos[0].toFixed(4)}, {devicePos[1].toFixed(4)}</span>
            </div>
          </div>

          {/* Leaflet Mock Map */}
          <div style={{ flex: 1, position: 'relative', minHeight: '400px' }}>
            <MapContainer
              center={[12.9602, 80.1485]}
              zoom={14}
              style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
              attributionControl={false}
            >
              <TileLayer
                url={theme === 'dark'
                  ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                  : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
                }
              />

              {/* Transit corridor route line */}
              <Polyline
                positions={MOCK_ROUTE}
                color="#2170B5"
                weight={5}
                opacity={0.8}
                dashArray="1, 8"
              />

              {/* Device Location Marker */}
              <Marker position={devicePos} icon={deviceIcon}>
                <Popup>
                  <div style={{ padding: '4px' }}>
                    <strong>Admin Device Location</strong>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>
                      {devicePos[0].toFixed(4)}, {devicePos[1].toFixed(4)}
                    </div>
                  </div>
                </Popup>
              </Marker>
              <Circle
                center={devicePos}
                radius={250}
                pathOptions={{ color: '#2170B5', fillColor: '#2170B5', fillOpacity: 0.12, weight: 1.5 }}
              />

              {/* VELS Campus Marker */}
              <Marker position={[12.9562, 80.1433]} icon={campusIcon}>
                <Popup>
                  <div style={{ padding: '4px' }}>
                    <strong>VELS University Campus (VISTAS)</strong>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>Pallavaram, Chennai</div>
                    <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 600 }}>Destination Hub</span>
                  </div>
                </Popup>
              </Marker>

              {/* Bus #01 Active */}
              <Marker position={[12.9647, 80.1517]} icon={busIcon}>
                <Popup>
                  <div style={{ padding: '4px' }}>
                    <strong>Bus #01 (Pallavaram Express)</strong>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>Speed: 34 km/h • ETA: 6 mins</div>
                    <span style={{ fontSize: '0.75rem', color: '#2170B5', fontWeight: 600 }}>Route 14</span>
                  </div>
                </Popup>
              </Marker>

              {/* Bus #02 Active */}
              <Marker position={[12.9490, 80.1380]} icon={busIcon}>
                <Popup>
                  <div style={{ padding: '4px' }}>
                    <strong>Bus #02 (Tambaram Corridor)</strong>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>Speed: 28 km/h • ETA: 12 mins</div>
                    <span style={{ fontSize: '0.75rem', color: '#2170B5', fontWeight: 600 }}>Route 08</span>
                  </div>
                </Popup>
              </Marker>
            </MapContainer>

            {/* Bottom Floating Legend */}
            <div style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              zIndex: 1000,
              backgroundColor: 'var(--bg-surface)',
              padding: '6px 12px',
              borderRadius: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '0.75rem',
              border: '1px solid var(--border-color)',
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2170B5' }}></span> Device
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }}></span> Campus
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2170B5' }}></span> Live Buses
              </span>
            </div>
          </div>
        </div>

        {/* Login Form Panel */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '12px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid var(--border-color)',
        }}>
          <div style={{ backgroundColor: '#2170B5', color: 'white', padding: '1rem', textAlign: 'center', fontWeight: 600, letterSpacing: '1px' }}>
            VELS Admin Log In
          </div>

          <div style={{ padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {error && (
              <div style={{ backgroundColor: 'var(--color-danger)', color: 'white', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'rgba(33, 112, 181, 0.08)',
              padding: '0.75rem 1rem',
              borderRadius: '6px',
              marginBottom: '1.5rem',
              fontSize: '0.875rem',
              color: 'var(--color-primary)'
            }}>
              <ShieldCheck size={20} />
              <span>Mock Login Enabled: Tap below to access Admin Dashboard immediately without database verification.</span>
            </div>

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', alignItems: 'center', gap: '1rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, textAlign: 'right' }}>Admin ID:</label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', alignItems: 'center', gap: '1rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, textAlign: 'right' }}>Password:</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <button
                type="submit"
                style={{
                  backgroundColor: '#2170B5',
                  color: 'white',
                  border: 'none',
                  padding: '0.85rem',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '1rem',
                  marginTop: '0.5rem',
                  cursor: 'pointer'
                }}
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Log In as Admin'}
              </button>

              <button
                type="button"
                onClick={handleGuestLogin}
                style={{
                  backgroundColor: 'transparent',
                  color: '#2170B5',
                  border: '1px solid #2170B5',
                  padding: '0.65rem',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                disabled={loading}
              >
                Quick Demo Access
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ backgroundColor: '#1C2939', color: '#8898AA', fontSize: '0.875rem', padding: '0.75rem 2rem', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        VELS University Campus Transportation Management System • Admin Portal
      </div>
      <div style={{ backgroundColor: '#2170B5', color: 'white', fontSize: '0.875rem', padding: '0.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{format(new Date(), 'EEE dd-MMM-yyyy HH:mm:ss')}</span>
        <span>eVarsity® ERP</span>
      </div>
    </div>
  );
};
