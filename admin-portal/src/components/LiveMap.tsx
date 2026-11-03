import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, Circle } from 'react-leaflet';
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

// Device current location marker (Pulse radar style)
const deviceLocationHtml = `
  <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
    <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background-color: rgba(33, 112, 181, 0.35); animation: leaflet-pulse 2s infinite ease-out;"></div>
    <div style="width: 16px; height: 16px; border-radius: 50%; background-color: #2170B5; border: 2.5px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.4);"></div>
  </div>
`;
const deviceLocationIcon = L.divIcon({
  html: deviceLocationHtml,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

// Hardcoded route path (Triplicane to VELS)
const ROUTE_PATH: [number, number][] = [[13.058717, 80.275488], [13.058902, 80.274169], [13.052771, 80.273752], [13.054693, 80.254445], [13.050746, 80.250566], [13.051685, 80.250207], [13.045115, 80.240477], [13.040344, 80.240502], [13.035362, 80.239323], [13.034156, 80.236964], [13.031214, 80.237221], [13.026496, 80.233073], [13.02368, 80.227829], [13.019499, 80.224556], [13.009676, 80.22791], [13.01139, 80.223282], [13.006697, 80.220601], [13.006452, 80.218955], [13.009952, 80.215406], [13.007728, 80.212988], [13.003711, 80.212036], [13.00355, 80.209724], [13.003961, 80.208615], [13.008141, 80.20993], [13.007051, 80.204584], [13.004968, 80.201419], [13.002082, 80.200367], [13.001753, 80.196507], [12.98392, 80.171062], [12.981969, 80.171401], [12.978068, 80.170529], [12.974092, 80.167383], [12.97509, 80.162286], [12.97374, 80.158632], [12.968863, 80.153473], [12.964742, 80.151757], [12.966337, 80.148711], [12.956243, 80.143305], [12.955392, 80.145689], [12.953091, 80.146927], [12.946208, 80.143108]];

const MapController: React.FC<{ targetPos?: [number, number] | null }> = ({ targetPos }) => {
  const map = useMap();
  const buses = useMapStore((state) => state.buses);
  const isFollowing = useMapStore((state) => state.isFollowing);
  
  useEffect(() => {
    if (targetPos) {
      map.flyTo(targetPos, 15, { animate: true, duration: 1.2 });
      return;
    }

    if (!isFollowing) return;
    
    // Find active simulated bus
    const activeBus = Object.values(buses).find(b => b.status === 'active' || b.speed > 0);
    if (activeBus) {
      map.flyTo([activeBus.lat, activeBus.lng], map.getZoom(), {
        animate: true,
        duration: 1.5,
      });
    }
  }, [buses, isFollowing, map, targetPos]);

  return null;
};

export const LiveMap: React.FC = () => {
  const buses = useMapStore((state) => state.buses);
  const setAllBuses = useMapStore((state) => state.setAllBuses);
  const theme = useThemeStore((state) => state.theme);

  // Device Location state with mock fallback (VELS University Campus)
  const [deviceLocation, setDeviceLocation] = useState<{ lat: number; lng: number; isMock: boolean }>({
    lat: 12.9698,
    lng: 80.1448,
    isMock: true,
  });
  const [targetFocus, setTargetFocus] = useState<[number, number] | null>(null);

  useEffect(() => {
    // Acquire device location via browser Geolocation API
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setDeviceLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            isMock: false,
          });
        },
        () => {
          // Fallback to VELS campus mock location
          setDeviceLocation({
            lat: 12.9698,
            lng: 80.1448,
            isMock: true,
          });
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );

      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setDeviceLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            isMock: false,
          });
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  useEffect(() => {
    // Initial fetch of active buses
    const fetchBuses = async () => {
      try {
        const res = await api.get('/buses');
        const activeBuses = res.data.map((b: any) => ({
          id: b.id,
          driverId: b.current_assignment?.driver_id,
          routeId: b.current_assignment?.route_id,
          lat: b.last_lat || 12.871,
          lng: b.last_lng || 80.141,
          speed: b.last_speed || 0,
          status: 'idle',
          lastSeen: b.last_updated_at || new Date().toISOString()
        }));
        setAllBuses(activeBuses);
      } catch (err) {
        // Fallback mock bus on route
        setAllBuses([
          {
            id: 'bus-vels-01',
            driverId: 'driver-01',
            routeId: 'route-14',
            lat: 12.9780,
            lng: 80.1705,
            speed: 38.5,
            status: 'active',
            lastSeen: new Date().toISOString()
          }
        ]);
      }
    };
    fetchBuses();
  }, [setAllBuses]);

  const busList = Object.values(buses);

  const handleCenterDevice = () => {
    setTargetFocus([deviceLocation.lat, deviceLocation.lng]);
    setTimeout(() => setTargetFocus(null), 1500);
  };

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      {/* Device Location Indicator Badge */}
      <div style={{
        position: 'absolute',
        top: 14,
        left: 14,
        zIndex: 1000,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(8px)',
        padding: '8px 14px',
        borderRadius: '20px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '12px',
        fontWeight: 600,
        color: '#0F172A',
        border: '1px solid #E2E8F0',
      }}>
        <div style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: '#10B981',
          boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.25)',
        }} />
        <span>Device Location: {deviceLocation.lat.toFixed(4)}, {deviceLocation.lng.toFixed(4)} {deviceLocation.isMock ? '(Mock VELS)' : '(Live GPS)'}</span>
        <button
          onClick={handleCenterDevice}
          style={{
            marginLeft: '6px',
            background: '#2170B5',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '12px',
            padding: '4px 10px',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Center
        </button>
      </div>

      <MapContainer 
        center={[deviceLocation.lat, deviceLocation.lng]} 
        zoom={13} 
        style={{ height: '100%', width: '100%', borderRadius: '6px' }}
        zoomControl={false}
      >
        <MapController targetPos={targetFocus} />
        
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

        {/* Device Current Location Marker & Accuracy Halo */}
        <Circle
          center={[deviceLocation.lat, deviceLocation.lng]}
          radius={60}
          pathOptions={{ color: '#2170B5', fillColor: '#2170B5', fillOpacity: 0.15, weight: 1.5 }}
        />
        <Marker 
          position={[deviceLocation.lat, deviceLocation.lng]}
          icon={deviceLocationIcon}
        >
          <Popup>
            <div style={{ fontSize: '13px', lineHeight: 1.4 }}>
              <strong>Your Device Location</strong><br/>
              Latitude: {deviceLocation.lat.toFixed(6)}<br/>
              Longitude: {deviceLocation.lng.toFixed(6)}<br/>
              Status: {deviceLocation.isMock ? 'Mock Location (VELS)' : 'Active Device GPS'}
            </div>
          </Popup>
        </Marker>
  
        {/* Bus Markers */}
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
