import { create } from 'zustand';

export interface BusState {
  id: string;
  driverId: string;
  routeId: string;
  lat: number;
  lng: number;
  speed: number;
  status: 'active' | 'disconnected' | 'idle';
  lastSeen: string;
}

export interface MapStoreState {
  buses: Record<string, BusState>;
  updateBusLocation: (busId: string, data: Partial<BusState>) => void;
  setBusOffline: (busId: string) => void;
  setAllBuses: (buses: BusState[]) => void;
  isFollowing: boolean;
  setIsFollowing: (following: boolean) => void;
}

export const useMapStore = create<MapStoreState>((set) => ({
  buses: {},
  isFollowing: true,
  setIsFollowing: (following) => set({ isFollowing: following }),
  updateBusLocation: (busId, data) =>
    set((state) => ({
      buses: {
        ...state.buses,
        [busId]: {
          ...(state.buses[busId] || { id: busId, status: 'active', speed: 0 }),
          ...data,
          lastSeen: new Date().toISOString(),
          status: 'active',
        },
      },
    })),
  setBusOffline: (busId) =>
    set((state) => {
      if (!state.buses[busId]) return state;
      return {
        buses: {
          ...state.buses,
          [busId]: {
            ...state.buses[busId],
            status: 'disconnected',
          },
        },
      };
    }),
  setAllBuses: (buses) =>
    set(() => {
      const busesRecord: Record<string, BusState> = {};
      buses.forEach(b => { busesRecord[b.id] = b; });
      return { buses: busesRecord };
    }),
}));
