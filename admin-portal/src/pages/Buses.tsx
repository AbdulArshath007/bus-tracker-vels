import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { useMapStore } from '../store/useMapStore';
import { SkeletonTablePage } from '../components/Skeleton';

export const Buses: React.FC = () => {
  const { t } = useTranslation();
  const [buses, setBuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const [newBus, setNewBus] = useState({ registration_number: '', capacity: 40 });
  const [editBus, setEditBus] = useState<any>(null);

  const liveBusData = useMapStore(state => state.buses);

  useEffect(() => {
    const fetchBuses = async () => {
      try {
        const res = await api.get('/buses');
        setBuses(res.data);
      } catch (err) {
        console.error('Error fetching buses', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBuses();
  }, []);

  const handleAddBus = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const addedBus = {
        id: Math.random().toString(36).substr(2, 9),
        registration_number: newBus.registration_number,
        capacity: newBus.capacity,
        is_active: true,
        current_assignment: null
      };
      setBuses([addedBus, ...buses]);
      setShowAddModal(false);
      setNewBus({ registration_number: '', capacity: 40 });
    } catch (err) {
      console.error('Failed to add bus', err);
    }
  };

  const handleEditBusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Mock saving edits
      setBuses(buses.map(b => b.id === editBus.id ? editBus : b));
      setShowEditModal(false);
      setEditBus(null);
    } catch (err) {
      console.error('Failed to edit bus', err);
    }
  };

  const getStatusDisplay = (bus: any) => {
    // Check live state from map store
    const liveInfo = liveBusData[bus.id];
    
    // If not active or no live info
    if (!bus.is_active) {
      return <span style={{ padding: '0.25rem 0.5rem', borderRadius: '9999px', backgroundColor: 'var(--color-danger)', color: 'white', fontSize: '0.75rem' }}>Inactive</span>;
    }
    
    const lat = liveInfo?.lat || bus.last_lat || 12.871;
    const lng = liveInfo?.lng || bus.last_lng || 80.141;

    // Vels Coordinates: 12.871, 80.141
    const isAtCollege = Math.abs(lat - 12.871) < 0.005 && Math.abs(lng - 80.141) < 0.005;

    if (isAtCollege) {
      return <span style={{ padding: '0.25rem 0.5rem', borderRadius: '9999px', backgroundColor: '#F59E0B', color: 'white', fontSize: '0.75rem' }}>Stalled (At College)</span>;
    }

    return <span style={{ padding: '0.25rem 0.5rem', borderRadius: '9999px', backgroundColor: 'var(--color-success)', color: 'white', fontSize: '0.75rem' }}>Location: {lat.toFixed(4)}, {lng.toFixed(4)}</span>;
  };

  if (loading) return <SkeletonTablePage cols={6} />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem' }}>{t('nav.buses')}</h2>
        <button className="primary" onClick={() => setShowAddModal(true)}>Add New Bus</button>
      </div>

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Registration</th>
                <th>Capacity</th>
                <th>Status</th>
                <th>Current Route</th>
                <th>Driver</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {buses.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No buses found.</td>
                </tr>
              ) : (
                buses.map((bus) => (
                  <tr key={bus.id}>
                    <td>{bus.registration_number}</td>
                    <td>{bus.capacity}</td>
                    <td>{getStatusDisplay(bus)}</td>
                    <td>{bus.current_assignment?.route_name || 'Unassigned'}</td>
                    <td>{bus.current_assignment?.driver_id ? `Driver ${bus.current_assignment.driver_id.substring(0, 4)}` : 'Unassigned'}</td>
                    <td>
                      <button 
                        className="outline" 
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        onClick={() => {
                          setEditBus({
                            ...bus,
                            driver_id: bus.current_assignment?.driver_id || '',
                            route_name: bus.current_assignment?.route_name || ''
                          });
                          setShowEditModal(true);
                        }}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
      </div>

      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '400px' }}>
            <h3 style={{ marginBottom: '1rem' }}>Add New Bus</h3>
            <form onSubmit={handleAddBus} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Registration Number</label>
                <input type="text" required value={newBus.registration_number} onChange={e => setNewBus({ ...newBus, registration_number: e.target.value })} style={{ width: '100%' }} placeholder="TN 01 AB 1234"/>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Capacity</label>
                <input type="number" required value={newBus.capacity} onChange={e => setNewBus({ ...newBus, capacity: parseInt(e.target.value) })} style={{ width: '100%' }} min={10} max={100}/>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" className="outline" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="primary">Save Bus</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && editBus && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '400px' }}>
            <h3 style={{ marginBottom: '1rem' }}>Edit Bus Assignment</h3>
            <form onSubmit={handleEditBusSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Assign Route Name</label>
                <input 
                  type="text" 
                  value={editBus.route_name} 
                  onChange={e => setEditBus({ ...editBus, current_assignment: { ...editBus.current_assignment, route_name: e.target.value } })} 
                  style={{ width: '100%' }} 
                  placeholder="e.g. Pallavaram to Tambaram"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Assign Driver ID</label>
                <input 
                  type="text" 
                  value={editBus.driver_id} 
                  onChange={e => setEditBus({ ...editBus, current_assignment: { ...editBus.current_assignment, driver_id: e.target.value } })} 
                  style={{ width: '100%' }} 
                  placeholder="e.g. DRV1234"
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" className="outline" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="primary">Update Assignment</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
