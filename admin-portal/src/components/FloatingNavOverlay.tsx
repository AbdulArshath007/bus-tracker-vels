import React from 'react';
import { useMapStore } from '../store/useMapStore';
import { Navigation, Clock, Activity, Maximize, Target } from 'lucide-react';

export const FloatingNavOverlay: React.FC = () => {
  const buses = useMapStore(state => state.buses);
  const isFollowing = useMapStore(state => state.isFollowing);
  const setIsFollowing = useMapStore(state => state.setIsFollowing);
  
  // For the demo, just pick the first active bus (the simulated one)
  const activeBus = Object.values(buses).find(b => b.status === 'active' || b.speed > 0) || Object.values(buses)[0];

  if (!activeBus) return null;

  return (
    <div style={{
      position: 'absolute',
      top: '24px',
      right: '24px',
      zIndex: 1000,
      backgroundColor: 'var(--bg-surface)',
      borderRadius: '24px',
      padding: '12px 8px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
      border: '1px solid rgba(255,255,255,0.1)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      alignItems: 'center'
    }}>
      
      {/* Auto-Center Toggle */}
      <button 
        onClick={() => setIsFollowing(!isFollowing)}
        title={isFollowing ? 'Stop following' : 'Follow bus'}
        style={{ 
          background: isFollowing ? 'var(--color-primary)' : 'transparent',
          color: isFollowing ? 'white' : 'var(--text-main)',
          border: 'none',
          borderRadius: '50%',
          width: '36px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s',
          boxShadow: isFollowing ? '0 4px 12px rgba(var(--color-primary-rgb), 0.4)' : 'none'
        }}
      >
        <Target size={18} />
      </button>

      {/* Divider */}
      <div style={{ width: '20px', height: '1px', backgroundColor: 'var(--border-color)' }} />

      {/* Speed */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }} title="Current Speed">
        <Navigation size={18} color="var(--color-primary)" />
        <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
          {Math.round(activeBus.speed)}
        </span>
      </div>
      
      {/* ETA */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }} title="Estimated Time of Arrival">
        <Clock size={18} color="#F59E0B" />
        <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
          {activeBus.speed > 0 ? '18m' : '--'}
        </span>
      </div>
      
      {/* Live Status Indicator */}
      <div title={activeBus.speed > 0 ? 'Live GPS Active' : 'Stopped'} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '4px' }}>
        <div style={{ 
          width: '10px', height: '10px', borderRadius: '50%', 
          backgroundColor: activeBus.speed > 0 ? '#10B981' : '#F59E0B',
          boxShadow: activeBus.speed > 0 ? '0 0 10px #10B981' : 'none'
        }} />
      </div>

    </div>
  );
};
