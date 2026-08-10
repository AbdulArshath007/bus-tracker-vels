import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { format } from 'date-fns';
import { SkeletonTablePage } from '../components/Skeleton';

export const Logs: React.FC = () => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get('/audit?limit=50');
        setLogs(res.data.items || res.data); // depending on backend pagination format
      } catch (err) {
        console.error('Error fetching logs', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem' }}>{t('nav.logs')}</h2>
        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Note: Logs are retained for 60 days.</span>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <input type="text" placeholder="Search by Action..." style={{ flex: 1, maxWidth: '300px' }} />
        <button className="primary">Filter</button>
      </div>

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        {loading ? (
          <SkeletonTablePage cols={6} />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor ID</th>
                <th>Role</th>
                <th>Action</th>
                <th>Target Type</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No audit logs found.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td>{format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss')}</td>
                    <td>{log.actor_id ? log.actor_id.substring(0, 8) : 'System'}</td>
                    <td style={{ textTransform: 'capitalize' }}>{log.actor_role || '-'}</td>
                    <td><strong>{log.action}</strong></td>
                    <td>{log.target_type || '-'}</td>
                    <td>{log.ip_address || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
