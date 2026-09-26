import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert } from 'react-native';

import { getApiErrorMessage } from '@/lib/errors';
import { parseDeliveryAddress } from '@/lib/location';
import { launchLibraryImage } from '@/lib/media/pick-image';
import { markRestaurantSetupComplete } from '@/lib/navigation/post-auth';
import { buildCreateRestaurantPayload, restaurantOwnerApi } from '@/lib/restaurant/api';
import {
  fssaiValidationError,
  gstinValidationError,
  normalizeFssaiInput,
  normalizeGstinInput,
} from '@/lib/restaurant/license-validation';
import { useAuthStore } from '@/store/auth-store';

export type SetupStep = 0 | 1 | 2;

export function useRestaurantSetup() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  const [step, setStep] = useState<SetupStep>(0);
  const [maxStep, setMaxStep] = useState<SetupStep>(0);
  const [busy, setBusy] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [banner, setBanner] = useState<{
    type: 'error' | 'success';
    message: string;
  } | null>(null);

  const [logo, setLogo] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [cover, setCover] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fssai, setFssai] = useState('');
  const [gstin, setGstin] = useState('');
  const [priceRange, setPriceRange] = useState<
    'budget' | 'moderate' | 'expensive' | 'fine_dining'
  >('moderate');
  const [costForTwo, setCostForTwo] = useState('500');
  const [street, setStreet] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [pincode, setPincode] = useState('');
  const [country, setCountry] = useState('India');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const [cuisines, setCuisines] = useState<string[]>([]);

  const costForTwoNumber = useMemo(() => {
    const n = Number(costForTwo);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }, [costForTwo]);

  const pickImage = async (kind: 'logo' | 'cover') => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Photo library permission is required.');
      return;
    }
    try {
      const result = await launchLibraryImage({
        aspect: kind === 'logo' ? [1, 1] : [16, 9],
        quality: 0.85,
        allowsEditing: true,
      });
      if (result.canceled || !result.assets[0]) return;
      if (kind === 'logo') setLogo(result.assets[0]);
      else setCover(result.assets[0]);
    } catch {
      Alert.alert('Could not open photo', 'Try again, or pick a different image.');
    }
  };

  const stepError = (s: SetupStep): string | null => {
    if (s === 0) {
      if (!logo?.uri) return 'Restaurant logo is required.';
      if (name.trim().length < 2) return 'Enter your restaurant name.';
      const fssaiErr = fssaiValidationError(fssai, { required: true });
      if (fssaiErr) return fssaiErr;
      const gstinErr = gstinValidationError(gstin);
      if (gstinErr) return gstinErr;
      return null;
    }
    if (s === 1) {
      if (street.trim().length < 3) return 'Street address is required.';
      if (city.trim().length < 2) return 'City is required.';
      if (stateName.trim().length < 2) return 'State is required.';
      if (pincode.trim().length !== 6 || !/^\d{6}$/.test(pincode.trim())) {
        return 'Pincode must be 6 digits.';
      }
      if (!coords) return 'Pick your location on the map.';
      return null;
    }
    return null;
  };

  const goNext = () => {
    const err = stepError(step);
    if (err) {
      setBanner({ type: 'error', message: err });
      return;
    }
    setBanner(null);
    const next = (step + 1) as SetupStep;
    setStep(next);
    setMaxStep((m) => (next > m ? next : m));
  };

  const goBack = () => {
    setBanner(null);
    if (step > 0) {
      setStep((s) => (s - 1) as SetupStep);
      return;
    }
    Alert.alert(
      'Finish registration first',
      'Your restaurant profile must be completed before you can use the dashboard.',
      [
        { text: 'Continue setup', style: 'cancel' },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const submit = async (serviceOk: boolean | undefined, serviceMessage?: string) => {
    const err0 = stepError(0);
    const err1 = stepError(1);
    if (err0) {
      setStep(0);
      setBanner({ type: 'error', message: err0 });
      return;
    }
    if (err1) {
      setStep(1);
      setBanner({ type: 'error', message: err1 });
      return;
    }
    if (serviceOk === false) {
      setBanner({
        type: 'error',
        message: serviceMessage ?? 'Restaurant service is unreachable. Try again shortly.',
      });
      return;
    }
    if (!logo?.uri || !coords) return;

    setBusy(true);
    setBanner(null);
    try {
      const payload = buildCreateRestaurantPayload({
        name: name.trim(),
        description: description.trim() || undefined,
        fssaiLicense: normalizeFssaiInput(fssai),
        gstin: normalizeGstinInput(gstin) || undefined,
        priceRange,
        costForTwo: costForTwoNumber,
        cuisines,
        address: {
          street: street.trim(),
          area: area.trim() || undefined,
          city: city.trim(),
          state: stateName.trim(),
          country: country.trim() || 'India',
          pincode: pincode.trim(),
        },
        location: { type: 'Point', coordinates: [coords.lng, coords.lat] },
      });

      let restaurantId: string;
      try {
        const created = await restaurantOwnerApi.createRestaurant(payload);
        restaurantId = created.id;
        await restaurantOwnerApi.getRestaurant(restaurantId).catch(() => created);
      } catch (createErr) {
        const createMsg = getApiErrorMessage(createErr, '').toLowerCase();
        const alreadyExists =
          createMsg.includes('already') ||
          createMsg.includes('exists') ||
          createMsg.includes('one restaurant');
        if (!alreadyExists) throw createErr;
        const existing = await restaurantOwnerApi.getMyRestaurant();
        if (!existing?.id) throw createErr;
        restaurantId = existing.id;
      }

      try {
        await restaurantOwnerApi.uploadLogo(restaurantId, {
          uri: logo.uri,
          fileName: logo.fileName ?? 'logo.jpg',
          mimeType: logo.mimeType ?? 'image/jpeg',
        });
      } catch (uploadErr) {
        throw new Error(
          `Logo upload failed: ${getApiErrorMessage(uploadErr, 'upload error')}`
        );
      }

      if (cover?.uri) {
        try {
          await restaurantOwnerApi.uploadCover(restaurantId, {
            uri: cover.uri,
            fileName: cover.fileName ?? 'cover.jpg',
            mimeType: cover.mimeType ?? 'image/jpeg',
          });
        } catch (uploadErr) {
          throw new Error(
            getApiErrorMessage(uploadErr, 'Restaurant created but cover upload failed')
          );
        }
      }

      setBanner({
        type: 'success',
        message: 'Restaurant registered and pending verification.',
      });
      await markRestaurantSetupComplete(restaurantId);
      setTimeout(() => router.replace('/dashboard'), 900);
    } catch (error) {
      setBanner({ type: 'error', message: getApiErrorMessage(error, 'Setup failed') });
    } finally {
      setBusy(false);
    }
  };

  const confirmMap = (result: {
    lat: number;
    lng: number;
    formattedAddress?: string;
    label: string;
    components?: Array<{
      long_name?: string;
      short_name?: string;
      types: string[];
    }>;
  }) => {
    setCoords({ lat: result.lat, lng: result.lng });
    setLocationLabel(result.formattedAddress || result.label);
    const parsed = parseDeliveryAddress({
      formattedAddress: result.formattedAddress || result.label,
      label: result.label,
      lat: result.lat,
      lng: result.lng,
      components: result.components,
    });
    // Street, area, city, state are user-entered (city/state via searchable dropdowns).
    if (parsed.pincode && parsed.pincode !== '000000') {
      setPincode(parsed.pincode);
    }
    if (!country.trim()) setCountry('India');
    setMapOpen(false);
    setBanner({
      type: 'success',
      message:
        'Location pinned. Enter street & area, then pick state and city from the lists.',
    });
  };

  return {
    step,
    setStep,
    maxStep,
    busy,
    mapOpen,
    setMapOpen,
    banner,
    setBanner,
    logo,
    cover,
    name,
    setName,
    description,
    setDescription,
    fssai,
    setFssai,
    gstin,
    setGstin,
    priceRange,
    setPriceRange,
    costForTwo,
    setCostForTwo,
    street,
    setStreet,
    area,
    setArea,
    city,
    setCity,
    stateName,
    setStateName,
    pincode,
    setPincode,
    country,
    setCountry,
    coords,
    locationLabel,
    cuisines,
    setCuisines,
    pickImage,
    goNext,
    goBack,
    submit,
    confirmMap,
  };
}
