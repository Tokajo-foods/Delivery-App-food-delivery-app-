import { isValidSignupPhone } from '@/components/auth/signup-validators';
import type { VehicleType } from '@/lib/delivery-partner/types';

/** Full registration validation order (personal is taken from the account, not a visible step). */
export const REGISTER_STEPS = ['Personal', 'Address', 'Vehicle'] as const;

/** Rider profile wizard screens after phone signup. */
export const RIDER_SETUP_STEPS = ['Address', 'Vehicle'] as const;

export type RiderProfileForm = {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  landmark: string;
  dateOfBirth: string;
  referralCode: string;
  latitude: number | null;
  longitude: number | null;
  vehicleType: VehicleType | '';
  vehicleNumber: string;
  aadharNumber: string;
};

export const EMPTY_RIDER_FORM: RiderProfileForm = {
  firstName: '',
  lastName: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  landmark: '',
  dateOfBirth: '',
  referralCode: '',
  latitude: null,
  longitude: null,
  vehicleType: '',
  vehicleNumber: '',
  aadharNumber: '',
};

export function hasRiderPin(form: RiderProfileForm): boolean {
  return (
    form.latitude != null &&
    form.longitude != null &&
    Number.isFinite(form.latitude) &&
    Number.isFinite(form.longitude)
  );
}

function parseDobIso(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) {
    const d = new Date(`${t}T12:00:00.000Z`);
    return Number.isNaN(d.getTime()) ? null : t;
  }
  const m = t.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
  if (!m) return null;
  const iso = `${m[3]}-${m[2]}-${m[1]}`;
  const d = new Date(`${iso}T12:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : iso;
}

export function riderDateOfBirthIso(form: RiderProfileForm): string | undefined {
  return parseDobIso(form.dateOfBirth) ?? undefined;
}

export function riderAgeYearsFromInput(raw: string): number | null {
  const iso = parseDobIso(raw);
  if (!iso) return null;
  return riderAgeYearsFromIso(iso);
}

export function riderAgeYearsFromIso(iso: string): number {
  const born = new Date(`${iso}T12:00:00.000Z`);
  const now = new Date();
  let age = now.getUTCFullYear() - born.getUTCFullYear();
  const m = now.getUTCMonth() - born.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < born.getUTCDate())) age -= 1;
  return age;
}

function riderMinAgeOk(iso: string, minYears = 18): boolean {
  return riderAgeYearsFromIso(iso) >= minYears;
}

export function validateRiderStep(index: number, form: RiderProfileForm): string | null {
  if (index === 0) {
    if (form.firstName.trim().length < 2) return 'Enter your first name.';
    if (!form.phone.trim()) return 'Phone number is required.';
    if (!isValidSignupPhone(form.phone)) return 'Enter a valid mobile number, e.g. +919876543210.';
    return null;
  }
  if (index === 1) {
    if (!hasRiderPin(form)) return 'Open the map and pin where you live.';
    if (form.address.trim().length < 3) return 'Enter your address (or confirm the pin so it autofills).';
    if (form.city.trim().length < 2) return 'City is required (autofills from the map pin).';
    if (form.state.trim().length < 2) return 'State is required (autofills from the map pin).';
    const pin = form.pincode.trim();
    if (!/^\d{6}$/.test(pin)) return 'Enter a valid 6-digit PIN code.';
    if (form.landmark.trim().length > 120) return 'Landmark is too long (max 120 characters).';
    if (!form.dateOfBirth.trim()) return 'Date of birth is required.';
    const dobIso = parseDobIso(form.dateOfBirth);
    if (!dobIso) return 'Date of birth: use DD-MM-YYYY or YYYY-MM-DD.';
    if (!riderMinAgeOk(dobIso)) return 'Enter a valid date of birth to continue.';
    const ref = form.referralCode.trim();
    if (ref && !/^[A-Za-z0-9]{4,12}$/.test(ref)) return 'Referral code must be 4–12 letters or numbers.';
    return null;
  }
  if (index === 2) {
    if (!form.vehicleType) return 'Select a vehicle type.';
    const reg = form.vehicleNumber.trim().toUpperCase();
    if (reg.length < 4) return 'Enter your vehicle registration number.';
    if (reg.length > 20) return 'Registration number is too long (max 20 characters).';
    if (!/^[A-Z0-9][A-Z0-9\-/\s]{3,19}$/.test(reg)) {
      return 'Enter a valid registration number (letters, numbers, hyphens).';
    }
    return null;
  }
  return null;
}
