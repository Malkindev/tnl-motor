import { create } from 'zustand';

type Vehicle = {
  id: string;
  make: string;
  model: string;
  year: number;
  price?: number;
  askPrice?: boolean;
  mileage: string;
  transmission: string;
  drivetrain?: string;
  condition?: string;
  fuelType: string;
  bodyType: string;
  engine: string;
  seats: number;
  doors: number;
  interior: string;
  exterior: string;
  location: string;
  description: string;
  features?: string[];
  featured?: boolean;
  sold?: boolean;
  images: string[];
  createdAt?: string;
};

type VehicleState = {
  vehicles: Vehicle[];
  inquiries: any[];
  setVehicles: (vehicles: Vehicle[]) => void;
  setInquiries: (inquiries: any[]) => void;
};

export const useVehicleStore = create<VehicleState>((set) => ({
  vehicles: [],
  inquiries: [],
  setVehicles: (vehicles) => set({ vehicles }),
  setInquiries: (inquiries) => set({ inquiries })
}));
