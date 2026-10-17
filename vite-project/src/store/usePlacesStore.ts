import { create } from 'zustand';
import type { TouristPlace } from '../types/place';
import { initialPlaces } from '../data/mockPlaces';

interface PlacesState {
  places: TouristPlace[];
  addPlace: (newPlace: TouristPlace) => void;
  deletePlace: (id: string) => void;
  incrementListens: (id: string) => void;
}

export const usePlacesStore = create<PlacesState>((set) => ({
  places: initialPlaces,
  addPlace: (newPlace) =>
    set((state) => ({ places: [newPlace, ...state.places] })),
  deletePlace: (id) =>
    set((state) => ({ places: state.places.filter((p) => p.id !== id) })),
  incrementListens: (id) =>
    set((state) => ({
      places: state.places.map((p) =>
        p.id === id ? { ...p, totalListens: p.totalListens + 1 } : p
      ),
    })),
}));
