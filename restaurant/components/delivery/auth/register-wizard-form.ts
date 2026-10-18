import { isValidSignupPhone } from '@/components/auth/signup-validators';
import type { VehicleType } from '@/lib/delivery-partner/types';

export const REGISTER_STEPS = ['Personal', 'Address', 'Vehicle', 'Verification'] as const;

export type RiderProfileForm = {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
  vehicleType: VehicleType | '';
  vehicleNumber: string;
  aadharNumber: string;
  acceptedTerms: boolean;
};

export const EMPTY_RIDER_FORM: RiderProfileForm = {
  firstName: '',
  lastName: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  latitude: null,
  longitude: null,
  vehicleType: '',
  vehicleNumber: '',
  aadharNumber: '',
  acceptedTerms: false,
};

export function hasRiderPin(form: RiderProfileForm): boolean {
  return (
    form.latitude != null &&
    form.longitude != null &&
    Number.isFinite(form.latitude) &&
    Number.isFinite(form.longitude)
  );
}

export function validateRiderStep(index: number, form: RiderProfileForm): string | null {
  if (index === 0) {
    if (form.firstName.trim().length < 2) return 'Enter your first name.';
    if (!form.phone.trim()) return 'Phone number is required.';
    if (!isValidSignupPhone(form.phone)) return 'Enter a valid mobile number, e.g. +919876543210.';
    return null;
  }
  if (index === 1) {
    if (!hasRiderPin(form)) return 'Open the map and pin your exact home / base location.';
    if (form.address.trim().length < 3) return 'Enter your address (or confirm the pin so it autofills).';
    if (form.city.trim().length < 2) return 'City is required (autofills from the map pin).';
    if (form.state.trim().length < 2) return 'State is required (autofills from the map pin).';
    return null;
  }
  if (index === 2 && !form.vehicleType) return 'Select a vehicle type.';
  if (index === 3 && !form.acceptedTerms) return 'Please agree to the Terms & Conditions.';
  return null;
}
