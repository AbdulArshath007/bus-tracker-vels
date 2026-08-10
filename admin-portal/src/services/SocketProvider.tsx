import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/useAuthStore';
import { useMapStore } from '../store/useMapStore';

interface SocketContextValue {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextValue>({ socket: null, connected: false });

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const { accessToken } = useAuthStore();
  const { updateBusLocation, setBusOffline } = useMapStore();

  useEffect(() => {
    if (!accessToken) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
    const newSocket = io(socketUrl, {
      auth: { token: accessToken },
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      setConnected(true);
      // Admin joins all GPS streams and all Chat rooms.
      // The backend should probably auto-join admins, or the admin can emit a join event.
      // E.g. newSocket.emit('admin.join_all');
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    // Listen to GPS updates from the backend
    newSocket.on('location.update', (data: { bus_id: string; latitude: number; longitude: number; speed_kmh: number; timestamp: string }) => {
      updateBusLocation(data.bus_id, {
        lat: data.latitude,
        lng: data.longitude,
        speed: data.speed_kmh,
      });
    });

    // Listen to bus disconnect events
    newSocket.on('bus.disconnected', (data: { bus_id: string }) => {
      setBusOffline(data.bus_id);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [accessToken, updateBusLocation, setBusOffline]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};
