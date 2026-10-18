import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle2, User } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { AuthBanner } from '@/components/auth/AuthBanner';
import { AuthField } from '@/components/auth/AuthField';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { RegisterAddressStep } from '@/components/delivery/auth/RegisterAddressStep';
import { RegisterInviteBanner } from '@/components/delivery/auth/RegisterInviteBanner';
import { RegisterTermsStep } from '@/components/delivery/auth/RegisterTermsStep';
import { RegisterVehicleStep } from '@/components/delivery/auth/RegisterVehicleStep';
import {
  EMPTY_RIDER_FORM,
  REGISTER_STEPS,
  hasRiderPin,
  validateRiderStep,
  type RiderProfileForm,
} from '@/components/delivery/auth/register-wizard-form';
import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import { formatAuthError } from '@/lib/auth/auth-error-copy';
import { maskPhone } from '@/lib/auth/phone-number';
import { deliveryPartnerApi } from '@/lib/delivery-partner/api';
import { clearFreshRiderSignup } from '@/lib/delivery-partner/fresh-signup';
import { DELIVERY_ROUTES } from '@/lib/delivery-partner/navigation';
import { partnerTrackingApi } from '@/lib/delivery-partner/tracking-api';
import type { PartnerInviteValidation } from '@/lib/delivery-partner/types';
import { getApiErrorMessage } from '@/lib/errors';
import { markDeliveryPartnerSetupComplete } from '@/lib/navigation/post-auth';
import { useAuthStore } from '@/store/auth-store';

type Props = {
  /** Restaurant fleet invite carried over from phone signup (falls back to `?token=`). */
  inviteToken?: string;
};

/** Signed-in rider: personal → address pin → vehicle → terms → POST /partners/register. */
export function DeliveryRegisterWizard({ inviteToken: inviteProp }: Props) {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string }>();
  const inviteToken = useMemo(() => {
    const raw = inviteProp ?? params.token;
    return typeof raw === 'string' ? raw.trim() : '';
  }, [inviteProp, params.token]);

  const authUser = useAuthStore((s) => s.user);
  const verifiedPhone = authUser?.phone?.trim() ?? '';

  const [step, setStep] = useState(0);
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

  const goNext = () => {
    const message = validateRiderStep(step, form);
    setError(message);
    if (!message) setStep((s) => Math.min(s + 1, REGISTER_STEPS.length - 1));
  };

  const goPrev = () => {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  };

  const complete = async () => {
    setError(null);
    if (inviteToken && inviteLoading) return setError('Still validating your invitation. Please wait.');
    for (let i = 0; i < REGISTER_STEPS.length; i += 1) {
      const message = validateRiderStep(i, form);
      if (message) {
        setStep(i);
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
          latitude: form.latitude ?? undefined,
          longitude: form.longitude ?? undefined,
          vehicleType: form.vehicleType,
          vehicleNumber: form.vehicleNumber.trim() || undefined,
          aadharNumber: form.aadharNumber.trim() || undefined,
          acceptedTerms: form.acceptedTerms,
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
      clearFreshRiderSignup();
      router.replace(DELIVERY_ROUTES.home);
    } catch (err) {
      setError(formatAuthError(err, 'Could not create your rider profile.'));
    } finally {
      setSubmitting(false);
    }
  };

  const busy = submitting || inviteLoading;
  const isLast = step === REGISTER_STEPS.length - 1;

  return (
    <View style={{ gap: 12 }}>
      <Text style={{ color: authTheme.textMuted, fontFamily: fonts.medium, fontSize: 13 }}>
        Step {step + 1} of {REGISTER_STEPS.length}: {REGISTER_STEPS[step]}
      </Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {REGISTER_STEPS.map((label, index) => (
          <View
            key={label}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 999,
              backgroundColor: index <= step ? authTheme.brand : '#E5E7EB',
            }}
          />
        ))}
      </View>

      {inviteToken ? <RegisterInviteBanner loading={inviteLoading} invite={invite} /> : null}
      <AuthBanner type="error" message={error} />

      {step === 0 ? (
        <View>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <AuthField
                label="First name *"
                icon={User}
                placeholder="Rajesh"
                autofill="givenName"
                value={form.firstName}
                onChangeText={(firstName) => patch({ firstName })}
              />
            </View>
            <View className="flex-1">
              <AuthField
                label="Last name"
                placeholder="Kumar"
                autofill="familyName"
                value={form.lastName}
                onChangeText={(lastName) => patch({ lastName })}
              />
            </View>
          </View>
          {verifiedPhone ? (
            <View className="mb-2 flex-row items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-3">
              <CheckCircle2 color="#16A34A" size={16} />
              <Text className="flex-1 text-sm font-semibold text-green-700">
                {maskPhone(verifiedPhone)} verified
              </Text>
            </View>
          ) : (
            <AuthField
              label="Phone number *"
              placeholder="+919876543210"
              autofill="telephone"
              value={form.phone}
              onChangeText={(phone) => patch({ phone })}
            />
          )}
        </View>
      ) : null}

      {step === 1 ? (
        <RegisterAddressStep
          values={{
            address: form.address,
            city: form.city,
            state: form.state,
            latitude: form.latitude,
            longitude: form.longitude,
          }}
          onChange={patch}
          disabled={busy}
        />
      ) : null}

      {step === 2 ? (
        <RegisterVehicleStep
          vehicleType={form.vehicleType}
          vehicleNumber={form.vehicleNumber}
          onChange={patch}
        />
      ) : null}

      {step === 3 ? (
        <RegisterTermsStep
          aadharNumber={form.aadharNumber}
          acceptedTerms={form.acceptedTerms}
          onChange={patch}
        />
      ) : null}

      <View className="mt-2 flex-row gap-3">
        {step > 0 ? (
          <View className="flex-1">
            <PrimaryButton label="Previous" variant="outline" onPress={goPrev} disabled={busy} />
          </View>
        ) : null}
        <View className="flex-1">
          {isLast ? (
            <PrimaryButton label="Complete profile" onPress={() => void complete()} loading={busy} />
          ) : (
            <PrimaryButton label="Next" onPress={goNext} disabled={busy} />
          )}
        </View>
      </View>
    </View>
  );
}
