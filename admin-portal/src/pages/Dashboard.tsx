import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LiveMap } from '../components/LiveMap';
import { useMapStore } from '../store/useMapStore';
import { SkeletonDashboard } from '../components/Skeleton';

export const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);

  const buses = useMapStore((state) => state.buses);
  const busList = Object.values(buses);
  const activeCount = busList.filter(b => b.status === 'active').length;
  const offlineCount = busList.filter(b => b.status !== 'active').length;

  // Brief skeleton so the map and cards don't pop in abruptly
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <SkeletonDashboard />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.5rem', margin: 0 }}>{t('dashboard.title')}</h2>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card">
          <h3 style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{t('dashboard.activeBuses')}</h3>
          <p style={{ fontSize: '2rem', fontWeight: 600 }}>{activeCount}</p>
        </div>
        <div className="card">
          <h3 style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{t('dashboard.offlineBuses')}</h3>
          <p style={{ fontSize: '2rem', fontWeight: 600 }}>{offlineCount}</p>
        </div>
      </div>

      <div className="card" style={{ height: '500px', padding: 0, overflow: 'hidden' }}>
        <LiveMap />
      </div>
    </div>
  );
};

