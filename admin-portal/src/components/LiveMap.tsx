import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useMapStore } from '../store/useMapStore';
import { useThemeStore } from '../store/useThemeStore';
import api from '../services/api';
import { FloatingNavOverlay } from './FloatingNavOverlay';

// Fix standard leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom icon for disconnected buses
const offlineIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Modern custom vehicle marker (Rapido style)
const vehicleHtml = `
  <div style="background-color: #2170B5; width: 36px; height: 36px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 17h16M4 17a2 2 0 0 0-2-2V9a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6a2 2 0 0 0-2 2M4 17v2a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-2M14 17v2a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-2" />
      <path d="M8 7v4" />
      <path d="M16 7v4" />
    </svg>
  </div>
`;
const vehicleIcon = L.divIcon({
  html: vehicleHtml,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

// Hardcoded route path (Triplicane to VELS)
const ROUTE_PATH: [number, number][] = [[13.058717, 80.275488], [13.058902, 80.274169], [13.052771, 80.273752], [13.054693, 80.254445], [13.050746, 80.250566], [13.051685, 80.250207], [13.045115, 80.240477], [13.040344, 80.240502], [13.035362, 80.239323], [13.034156, 80.236964], [13.031214, 80.237221], [13.026496, 80.233073], [13.02368, 80.227829], [13.019499, 80.224556], [13.009676, 80.22791], [13.01139, 80.223282], [13.006697, 80.220601], [13.006452, 80.218955], [13.009952, 80.215406], [13.007728, 80.212988], [13.003711, 80.212036], [13.00355, 80.209724], [13.003961, 80.208615], [13.008141, 80.20993], [13.007051, 80.204584], [13.004968, 80.201419], [13.002082, 80.200367], [13.001753, 80.196507], [12.98392, 80.171062], [12.981969, 80.171401], [12.978068, 80.170529], [12.974092, 80.167383], [12.97509, 80.162286], [12.97374, 80.158632], [12.968863, 80.153473], [12.964742, 80.151757], [12.966337, 80.148711], [12.956243, 80.143305], [12.955392, 80.145689], [12.953091, 80.146927], [12.946208, 80.143108]];

const MapController: React.FC = () => {
  const map = useMap();
  const buses = useMapStore((state) => state.buses);
  const isFollowing = useMapStore((state) => state.isFollowing);
  
  useEffect(() => {
    if (!isFollowing) return;
    
    // Find active simulated bus
    const activeBus = Object.values(buses).find(b => b.status === 'active' || b.speed > 0);
    if (activeBus) {
      map.flyTo([activeBus.lat, activeBus.lng], map.getZoom(), {
        animate: true,
        duration: 1.5,
      });
    }
  }, [buses, isFollowing, map]);

  return null;
};

export const LiveMap: React.FC = () => {
  const buses = useMapStore((state) => state.buses);
  const setAllBuses = useMapStore((state) => state.setAllBuses);
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    // Initial fetch of active buses
    const fetchBuses = async () => {
      try {
        // Assume backend has a /buses/live or /buses endpoint
        const res = await api.get('/buses');
        const activeBuses = res.data.map((b: any) => ({
          id: b.id,
          driverId: b.current_assignment?.driver_id,
          routeId: b.current_assignment?.route_id,
          // Fallback location for the map (Vels University default coords)
          lat: b.last_lat || 12.871,
          lng: b.last_lng || 80.141,
          speed: b.last_speed || 0,
          status: 'idle',
          lastSeen: b.last_updated_at || new Date().toISOString()
        }));
        setAllBuses(activeBuses);
      } catch (err) {
        console.error('Failed to fetch buses', err);
      }
    };
    fetchBuses();
  }, [setAllBuses]);

  const busList = Object.values(buses);

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <MapContainer 
        center={[12.98, 80.20]} 
        zoom={12} 
        style={{ height: '100%', width: '100%', borderRadius: '6px' }}
        zoomControl={false}
      >
        <MapController />
        
        {theme === 'dark' ? (
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
        ) : (
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
        )}
        
        {/* Route Polyline */}
        <Polyline positions={ROUTE_PATH} color="var(--color-primary)" weight={4} opacity={0.6} dashArray="8, 8" />
  
        {busList.map((bus) => (
          <Marker 
            key={bus.id} 
            position={[bus.lat, bus.lng]}
            icon={bus.status === 'active' || bus.speed > 0 ? vehicleIcon : offlineIcon}
          >
            <Popup>
              <div style={{ fontSize: '14px' }}>
                <strong>Bus {bus.id.substring(0, 8)}</strong><br/>
                Status: {bus.status}<br/>
                Speed: {bus.speed.toFixed(1)} km/h<br/>
                Last seen: {new Date(bus.lastSeen).toLocaleTimeString()}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      <FloatingNavOverlay />
    </div>
  );
};
