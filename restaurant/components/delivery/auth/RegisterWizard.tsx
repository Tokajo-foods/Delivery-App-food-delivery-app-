import { useLocalSearchParams, useRouter } from 'expo-router';
import { Bike, ChevronLeft, ChevronRight, MapPin } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { AuthBanner } from '@/components/auth/AuthBanner';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { RiderAccountSummaryCard } from '@/components/delivery/auth/RiderAccountSummaryCard';
import { RiderProfileContextBar } from '@/components/delivery/auth/RiderProfileContextBar';
import { RegisterAddressStep } from '@/components/delivery/auth/RegisterAddressStep';
import { RegisterInviteBanner } from '@/components/delivery/auth/RegisterInviteBanner';
import { RegisterVehicleStep } from '@/components/delivery/auth/RegisterVehicleStep';
import { RiderSetupProgress } from '@/components/delivery/auth/RiderSetupProgress';
import { RiderSetupStepHeader } from '@/components/delivery/auth/RiderSetupStepHeader';
import {
  EMPTY_RIDER_FORM,
  REGISTER_STEPS,
  RIDER_SETUP_STEPS,
  hasRiderPin,
  riderDateOfBirthIso,
  validateRiderStep,
  type RiderProfileForm,
} from '@/components/delivery/auth/register-wizard-form';
import { isValidSignupPhone } from '@/components/auth/signup-validators';
import { loadPartnerSignupName } from '@/lib/auth/partner-signup-name-storage';
import { formatAuthError } from '@/lib/auth/auth-error-copy';
import { deliveryPartnerApi } from '@/lib/delivery-partner/api';
import { clearFreshRiderSignup } from '@/lib/delivery-partner/fresh-signup';
import { DELIVERY_ROUTES } from '@/lib/delivery-partner/navigation';
import {
  clearRiderSetupDraft,
  loadRiderSetupDraft,
  saveRiderSetupDraft,
} from '@/lib/delivery-partner/rider-setup-draft-storage';
import { partnerTrackingApi } from '@/lib/delivery-partner/tracking-api';
import type { PartnerInviteValidation } from '@/lib/delivery-partner/types';
import { getApiErrorMessage } from '@/lib/errors';
import { markDeliveryPartnerSetupComplete } from '@/lib/navigation/post-auth';
import { userAccountApi } from '@/lib/user/account-api';
import { useAuthStore } from '@/store/auth-store';

type Props = {
  inviteToken?: string;
  /** Pins Continue / Back to AuthShell footer (fixed bottom). */
  onFooterChange?: (footer: ReactNode) => void;
};

const STEP_HEADERS = [
  {
    icon: MapPin,
    title: 'Home address',
    subtitle: 'Home address, identity (DOB), and PIN code. Optional landmark or referral.',
  },
  {
    icon: Bike,
    title: 'Vehicle',
    subtitle: 'Select vehicle type and enter the registration number. KYC can be done later in Documents.',
  },
] as const;

function validationIndexForWizardStep(wizardStep: number): number {
  return wizardStep + 1;
}

export function DeliveryRegisterWizard({ inviteToken: inviteProp, onFooterChange }: Props) {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string }>();
  const inviteToken = useMemo(() => {
    const raw = inviteProp ?? params.token;
    return typeof raw === 'string' ? raw.trim() : '';
  }, [inviteProp, params.token]);

  const authUser = useAuthStore((s) => s.user);
  const verifiedPhone = authUser?.phone?.trim() ?? '';
  const accountEmail = authUser?.email?.trim().toLowerCase() ?? '';

  const [step, setStep] = useState(0);
  const [personalHydrated, setPersonalHydrated] = useState(false);
  const [wizardReady, setWizardReady] = useState(false);
  const [form, setForm] = useState<RiderProfileForm>(() => ({
    ...EMPTY_RIDER_FORM,
    firstName: authUser?.firstName ?? '',
    lastName: authUser?.lastName ?? '',
    phone: verifiedPhone,
  }));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(Boolean(inviteToken));
  const [invite, setInvite] = useState<PartnerInviteValidation | null>(null);

  useEffect(() => {
    let cancelled = false;
    setWizardReady(false);
    void (async () => {
      const userId = authUser?.id;
      const phone = authUser?.phone?.trim() ?? '';
      const draft = await loadRiderSetupDraft(userId);
      const local = await loadPartnerSignupName(userId, phone);
      let firstName = authUser?.firstName?.trim() || local?.firstName || '';
      let lastName = authUser?.lastName?.trim() || local?.lastName || '';

      if (firstName.length < 2 && userId) {
        try {
          const me = await userAccountApi.getMe();
          firstName = firstName || me.firstName?.trim() || '';
          lastName = lastName || me.lastName?.trim() || '';
        } catch {
          /* fallbacks */
        }
      }

      if (cancelled) return;

      const base: RiderProfileForm = {
        ...EMPTY_RIDER_FORM,
        firstName,
        lastName,
        phone: phone || draft?.form.phone?.trim() || '',
      };
      const restored: RiderProfileForm = draft?.form
        ? {
            ...base,
            ...draft.form,
            firstName: draft.form.firstName?.trim() || base.firstName,
            lastName: draft.form.lastName?.trim() || base.lastName,
            phone: phone || draft.form.phone?.trim() || base.phone,
          }
        : base;

      setForm(restored);
      if (draft) {
        setStep(
          Math.min(
            Math.max(0, draft.step),
            RIDER_SETUP_STEPS.length - 1
          )
        );
      }
      setPersonalHydrated(true);
      setWizardReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [authUser?.firstName, authUser?.id, authUser?.lastName, authUser?.phone]);

  useEffect(() => {
    const userId = authUser?.id;
    if (!wizardReady || !userId) return;
    const timer = setTimeout(() => {
      void saveRiderSetupDraft(userId, {
        step,
        form,
        updatedAt: new Date().toISOString(),
      });
    }, 350);
    return () => clearTimeout(timer);
  }, [authUser?.id, form, step, wizardReady]);

  useEffect(() => {
    if (!inviteToken) {
      setInvite(null);
      setInviteLoading(false);
      return;
    }
    let cancelled = false;
    setInviteLoading(true);
    void deliveryPartnerApi
      .validateInvite(inviteToken)
      .then((result) => {
        if (cancelled) return;
        setInvite(result);
        if (result.valid && result.invitePhone) {
          setForm((prev) => ({ ...prev, phone: prev.phone || result.invitePhone || '' }));
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setInvite({
          valid: false,
          token: inviteToken,
          message: getApiErrorMessage(err, 'Could not validate this invitation link.'),
        });
      })
      .finally(() => {
        if (!cancelled) setInviteLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [inviteToken]);

  const patch = (partial: Partial<RiderProfileForm>) => setForm((prev) => ({ ...prev, ...partial }));

  const personalReady =
    personalHydrated &&
    form.firstName.trim().length >= 2 &&
    Boolean(form.phone.trim()) &&
    isValidSignupPhone(form.phone);

  const displayName = [form.firstName.trim(), form.lastName.trim()].filter(Boolean).join(' ');

  const goNext = () => {
    setError(null);
    const personalError = validateRiderStep(0, form);
    if (personalError) {
      setError(personalError);
      return;
    }
    const message = validateRiderStep(validationIndexForWizardStep(step), form);
    if (message) {
      setError(
        step === 0 && !hasRiderPin(form) ? 'Pin your home address on the map to continue.' : message
      );
      return;
    }
    setStep((s) => Math.min(s + 1, RIDER_SETUP_STEPS.length - 1));
  };

  const goPrev = () => {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  };

  const goNextRef = useRef(goNext);
  const goPrevRef = useRef(goPrev);
  const completeRef = useRef(async () => undefined);
  goNextRef.current = goNext;
  goPrevRef.current = goPrev;

  const complete = async () => {
    setError(null);
    if (inviteToken && inviteLoading) return setError('Still validating your invitation. Please wait.');
    for (let i = 0; i < REGISTER_STEPS.length; i += 1) {
      const message = validateRiderStep(i, form);
      if (message) {
        if (i === 0) {
          setError(message);
          return;
        }
        setStep(Math.max(0, i - 1));
        return setError(message);
      }
    }
    if (!form.vehicleType) return;

    setSubmitting(true);
    try {
      let profile;
      try {
        profile = await deliveryPartnerApi.register({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim() || undefined,
          phone: form.phone.trim(),
          email: authUser?.email?.trim().toLowerCase() || undefined,
          address: form.address.trim() || undefined,
          city: form.city.trim() || undefined,
          state: form.state.trim() || undefined,
          pincode: form.pincode.trim() || undefined,
          landmark: form.landmark.trim() || undefined,
          dateOfBirth: riderDateOfBirthIso(form),
          referralCode: form.referralCode.trim() || undefined,
          latitude: form.latitude ?? undefined,
          longitude: form.longitude ?? undefined,
          vehicleType: form.vehicleType,
          vehicleNumber: form.vehicleNumber.trim().toUpperCase(),
          inviteToken: invite?.valid ? inviteToken : undefined,
        });
      } catch (regErr) {
        const existing = await deliveryPartnerApi.getMe().catch(() => null);
        if (!existing?.id) throw regErr;
        profile = existing;
      }

      if (hasRiderPin(form)) {
        await partnerTrackingApi
          .saveHomeLocation({
            latitude: form.latitude as number,
            longitude: form.longitude as number,
            address:
              [form.address.trim(), form.city.trim(), form.state.trim()].filter(Boolean).join(', ') ||
              undefined,
          })
          .catch(() => undefined);
      }

      await markDeliveryPartnerSetupComplete(profile.id);
      await clearRiderSetupDraft(authUser?.id);
      clearFreshRiderSignup();
      router.replace(DELIVERY_ROUTES.home);
    } catch (err) {
      setError(formatAuthError(err, 'Could not create your rider profile.'));
    } finally {
      setSubmitting(false);
    }
  };

  completeRef.current = complete;

  const busy = submitting || inviteLoading;
  const isLast = step === RIDER_SETUP_STEPS.length - 1;
  const header = STEP_HEADERS[step];

  useEffect(() => {
    if (!onFooterChange) return;
    onFooterChange(
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {step > 0 ? (
          <View style={{ flex: 1 }}>
            <PrimaryButton
              label="Back"
              variant="outline"
              onPress={() => goPrevRef.current()}
              disabled={busy}
              icon={ChevronLeft}
            />
          </View>
        ) : null}
        <View style={{ flex: step > 0 ? 1.5 : 1 }}>
          {isLast ? (
            <PrimaryButton
              label="Complete profile"
              onPress={() => void completeRef.current()}
              loading={busy}
            />
          ) : (
            <PrimaryButton
              label="Continue"
              onPress={() => goNextRef.current()}
              disabled={busy}
              trailingIcon={ChevronRight}
            />
          )}
        </View>
      </View>
    );
  }, [onFooterChange, step, busy, isLast, submitting, inviteLoading]);

  return (
    <View style={{ gap: 16 }}>
      {personalReady ? (
        <RiderProfileContextBar
          displayName={displayName}
          phone={verifiedPhone || form.phone}
          email={accountEmail}
        />
      ) : (
        <RiderAccountSummaryCard
          personalReady={personalReady}
          form={{ firstName: form.firstName, lastName: form.lastName, phone: form.phone }}
          onPatch={patch}
        />
      )}

      <RiderSetupProgress step={step} />

      {inviteToken ? <RegisterInviteBanner loading={inviteLoading} invite={invite} /> : null}
      <AuthBanner type="error" message={error} />

      <View style={{ gap: 14 }}>
        <RiderSetupStepHeader icon={header.icon} title={header.title} subtitle={header.subtitle} />

        {step === 0 ? (
          <RegisterAddressStep
            values={{
              address: form.address,
              city: form.city,
              state: form.state,
              pincode: form.pincode,
              landmark: form.landmark,
              dateOfBirth: form.dateOfBirth,
              referralCode: form.referralCode,
              latitude: form.latitude,
              longitude: form.longitude,
            }}
            onChange={patch}
            disabled={busy}
          />
        ) : null}

        {step === 1 ? (
          <RegisterVehicleStep
            vehicleType={form.vehicleType}
            vehicleNumber={form.vehicleNumber}
            onChange={patch}
          />
        ) : null}

      </View>
    </View>
  );
}
