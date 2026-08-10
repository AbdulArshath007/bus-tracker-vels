import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { SkeletonTablePage } from '../components/Skeleton';
import { Folder, FolderOpen, ChevronDown, ChevronRight, User as UserIcon } from 'lucide-react';

export const Users: React.FC = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<any[]>([]);
  const [buses, setBuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'students' | 'drivers'>('students');
  const [expandedBuses, setExpandedBuses] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (activeTab === 'students') {
          // Fetch both users and buses for the folder-grouped layout
          const [usersRes, busesRes] = await Promise.all([
            api.get('/users?role=student'),
            api.get('/buses')
          ]);
          setUsers(usersRes.data);
          setBuses(busesRes.data);
        } else {
          const res = await api.get('/users?role=driver');
          setUsers(res.data);
        }
      } catch (err) {
        console.error('Error fetching data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab]);

  const toggleBus = (busId: string) => {
    const newSet = new Set(expandedBuses);
    if (newSet.has(busId)) newSet.delete(busId);
    else newSet.add(busId);
    setExpandedBuses(newSet);
  };

  const renderDriversTable = () => (
    <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {!Array.isArray(users) || users.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>No drivers found.</td>
            </tr>
          ) : (
            users.map((user) => (
              <tr key={user.id}>
                <td>{user.full_name}</td>
                <td>{user.email}</td>
                <td style={{ textTransform: 'capitalize' }}>{user.role}</td>
                <td>
                  <span style={{ 
                    padding: '0.25rem 0.5rem', 
                    borderRadius: '9999px', 
                    backgroundColor: user.is_active ? 'var(--color-success)' : 'var(--color-danger)', 
                    color: 'white',
                    fontSize: '0.75rem'
                  }}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <button className="outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>Edit</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  const renderStudentsFolders = () => {
    if (!Array.isArray(buses) || buses.length === 0) return <div style={{ padding: '2rem', textAlign: 'center' }}>No buses available.</div>;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {buses.map((bus, index) => {
          const isExpanded = expandedBuses.has(bus.id);
          
          
          // Mock distribution: sequentially assign students to buses for UI demonstration
          const busStudents = Array.isArray(users) ? users.filter((_, i) => i % buses.length === index) : [];
          
          return (
            <div key={bus.id} className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-color)', transition: 'all 0.3s ease' }}>
              {/* Folder Header */}
              <div 
                onClick={() => toggleBus(bus.id)}
                style={{ 
                  padding: '1.25rem 1.5rem', 
                  backgroundColor: isExpanded ? 'rgba(33, 112, 181, 0.05)' : 'var(--bg-surface)',
                  display: 'flex', 
                  alignItems: 'center', 
                  cursor: 'pointer',
                  borderBottom: isExpanded ? '1px solid var(--border-color)' : 'none',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isExpanded) e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = isExpanded ? 'rgba(33, 112, 181, 0.05)' : 'var(--bg-surface)';
                }}
              >
                <div style={{ marginRight: '1rem', color: '#2170B5', display: 'flex', alignItems: 'center' }}>
                  {isExpanded ? <FolderOpen size={28} /> : <Folder size={28} />}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-primary)', fontWeight: 600 }}>Bus {bus.bus_number}</h3>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {busStudents.length} Students Assigned
                  </span>
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>
                  {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-color)', animation: '_fadeIn 0.3s ease' }}>
                  
                  {/* Driver Details Card */}
                  <div style={{ 
                    marginBottom: '1.5rem', 
                    padding: '1.25rem', 
                    backgroundColor: 'white', 
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                  }}>
                    <div style={{ 
                      width: '44px', height: '44px', 
                      borderRadius: '50%', backgroundColor: 'rgba(33, 112, 181, 0.1)',
                      display: 'flex', justifyContent: 'center', alignItems: 'center',
                      color: '#2170B5'
                    }}>
                      <UserIcon size={24} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>
                        Assigned Driver
                      </h4>
                      <p style={{ margin: '0.2rem 0 0', fontSize: '1.1rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                        {bus.current_assignment?.driver_name || 'No Driver Assigned'}
                      </p>
                    </div>
                  </div>

                  {/* Students Table */}
                  <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <table style={{ margin: 0 }}>
                      <thead style={{ backgroundColor: 'var(--bg-surface)' }}>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {busStudents.length === 0 ? (
                          <tr>
                            <td colSpan={4} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)' }}>
                              No students assigned to this bus.
                            </td>
                          </tr>
                        ) : (
                          busStudents.map(student => (
                            <tr key={student.id}>
                              <td>{student.full_name}</td>
                              <td>{student.email}</td>
                              <td>
                                <span style={{ 
                                  padding: '0.25rem 0.5rem', 
                                  borderRadius: '9999px', 
                                  backgroundColor: student.is_active ? 'var(--color-success)' : 'var(--color-danger)', 
                                  color: 'white',
                                  fontSize: '0.75rem'
                                }}>
                                  {student.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td>
                                <button className="outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>Edit</button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem' }}>{t('nav.users')}</h2>
        <div>
          {activeTab === 'students' && <button className="outline" style={{ marginRight: '1rem' }}>Import CSV</button>}
          <button className="primary">Add New {activeTab === 'students' ? 'Student' : 'Driver'}</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <button 
          className={activeTab === 'students' ? 'primary' : 'outline'} 
          onClick={() => { setActiveTab('students'); setLoading(true); setExpandedBuses(new Set()); }}
        >
          Students
        </button>
        <button 
          className={activeTab === 'drivers' ? 'primary' : 'outline'} 
          onClick={() => { setActiveTab('drivers'); setLoading(true); }}
        >
          Drivers
        </button>
      </div>

      {loading ? (
        <SkeletonTablePage cols={activeTab === 'drivers' ? 5 : 4} />
      ) : activeTab === 'students' ? (
        renderStudentsFolders()
      ) : (
        renderDriversTable()
      )}
    </div>
  );
};
