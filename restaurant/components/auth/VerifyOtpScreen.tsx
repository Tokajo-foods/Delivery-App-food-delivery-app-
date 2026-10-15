import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, UserPlus } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AuthBanner } from '@/components/auth/AuthBanner';
import { AuthLoadingScreen } from '@/components/auth/AuthLoadingScreen';
import { AuthShell } from '@/components/auth/AuthShell';
import { PhoneOtpStep } from '@/components/auth/PhoneOtpStep';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { RoleSelector } from '@/components/auth/RoleSelector';
import { useFirebasePhoneOtp } from '@/components/auth/useFirebasePhoneOtp';
import { usePhoneAuthStatus } from '@/components/auth/usePhoneAuthStatus';
import { theme } from '@/constants/theme';
import { formatAuthError } from '@/lib/auth/auth-error-copy';
import { phoneAuthApi } from '@/lib/auth/phone-auth-api';
import { applyPhoneAuthSession } from '@/lib/auth/phone-session';
import { PARTNER_ROLES, type PartnerRole } from '@/lib/auth/types';
import { getApiErrorCode } from '@/lib/errors';
import { resolvePostAuthRoute } from '@/lib/navigation/post-auth';
import { useAuthStore } from '@/store/auth-store';

const RESTART_CODES = new Set([
  'FIREBASE_TOKEN_EXPIRED',
  'FIREBASE_TOKEN_INVALID',
  'PHONE_MISMATCH',
]);

type SignupOffer = { phone: string; message: string };

/** Sign in with Firebase phone OTP → POST /auth/phone/login. */
export function VerifyOtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string; phone?: string }>();
  const role = useAuthStore((s) => s.role);
  const setRole = useAuthStore((s) => s.setRole);
  const availability = usePhoneAuthStatus();
  const otp = useFirebasePhoneOtp({
    initialPhone: typeof params.phone === 'string' ? params.phone : undefined,
    cooldownSeconds: availability.status?.resendCooldownSeconds,
  });
  const [submitting, setSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signupOffer, setSignupOffer] = useState<SignupOffer | null>(null);

  useEffect(() => {
    if (params.role === 'delivery' || params.role === 'restaurant') setRole(params.role);
  }, [params.role, setRole]);

  const roleLabel = (r: PartnerRole) =>
    PARTNER_ROLES.find((x) => x.value === r)?.label ?? r;

  const handleSubmit = async (code?: string) => {
    if (submitting) return;
    setError(null);
    setSignupOffer(null);
    const verified = await otp.obtainIdToken(code);
    if (!verified) return;
    setSubmitting(true);
    try {
      const result = await phoneAuthApi.login({
        idToken: verified.idToken,
        role,
        phone: verified.phone,
      });
      await applyPhoneAuthSession(result, role);
      setRedirecting(true);
      const target = await resolvePostAuthRoute(role);
      router.replace(target);
    } catch (err) {
      setRedirecting(false);
      const errCode = getApiErrorCode(err);
      if (errCode && RESTART_CODES.has(errCode)) {
        otp.restart(formatAuthError(err, 'Verify your phone again.'));
      } else if (errCode === 'USER_NOT_FOUND') {
        setSignupOffer({
          phone: verified.phone,
          message: 'No account uses this number yet. Create one — your number stays verified.',
        });
      } else if (errCode === 'ROLE_NOT_ALLOWED') {
        setSignupOffer({
          phone: verified.phone,
          message: `This number has a Tokajo account, but not as ${roleLabel(role)}. Register it for ${roleLabel(role)} to continue.`,
        });
      } else {
        setError(formatAuthError(err, 'OTP sign-in failed'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (redirecting) return <AuthLoadingScreen message="Signing you in…" />;

  return (
    <AuthShell
      title="Login with OTP"
      subtitle={
        otp.stage === 'phone'
          ? 'Enter your registered mobile number. We’ll text you a one-time code.'
          : 'Enter the 6-digit code from the SMS. It fills in automatically on most phones.'
      }
      showBack
      footer={
        <Pressable
          onPress={() => router.replace('/login')}
          hitSlop={8}
          className="flex-row items-center justify-center gap-1.5"
        >
          <ArrowLeft color={theme.primary} size={16} />
          <Text className="text-sm font-bold text-primary">Back to password sign in</Text>
        </Pressable>
      }
    >
      <RoleSelector value={role} onChange={setRole} disabled={submitting || Boolean(otp.busy)} />
      <AuthBanner type="error" message={error} />

      {signupOffer ? (
        <View className="mb-4 gap-3">
          <AuthBanner type="error" message={signupOffer.message} />
          <PrimaryButton
            label={`Register as ${roleLabel(role)}`}
            icon={UserPlus}
            onPress={() =>
              router.replace({
                pathname: '/register',
                params: { phone: signupOffer.phone, role },
              })
            }
          />
        </View>
      ) : null}

      <PhoneOtpStep
        otp={otp}
        availability={availability}
        onSubmit={(code) => void handleSubmit(code)}
        submitLabel="Verify & sign in"
        submitting={submitting}
      />
    </AuthShell>
  );
}
