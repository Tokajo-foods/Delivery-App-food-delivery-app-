import { useLocalSearchParams, useRouter } from 'expo-router';
import { Lock, Mail, MessageSquareCode } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { AuthSlideSheet } from '@/components/auth/AuthSlideSheet';
import { AuthBanner } from '@/components/auth/AuthBanner';
import { AuthLoadingScreen } from '@/components/auth/AuthLoadingScreen';
import { CheckboxRow, LegalFooter } from '@/components/auth/AuthExtras';
import { AuthField } from '@/components/auth/AuthField';
import { SwipeToLogin } from '@/components/auth/SwipeToLogin';
import { fonts } from '@/constants/typography';
import { lockedPartnerRole } from '@/lib/app-variant';
import { resolvePostAuthRoute } from '@/lib/navigation/post-auth';
import { useGatewayProbe } from '@/lib/gateway/hooks';
import { useAuthStore } from '@/store/auth-store';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type LoginScreenProps = {
  onDismiss?: () => void;
};

export function LoginScreen({ onDismiss }: LoginScreenProps) {
  const router = useRouter();
  const { height: screenH } = useWindowDimensions();
  const { registered, email: registeredEmail, role: registeredRole } =
    useLocalSearchParams<{
      registered?: string;
      email?: string;
      role?: string;
    }>();
  const role = useAuthStore((s) => s.role);
  const setRole = useAuthStore((s) => s.setRole);
  const lockedRole = lockedPartnerRole();

  useEffect(() => {
    if (lockedRole && role !== lockedRole) setRole(lockedRole);
  }, [lockedRole, role, setRole]);
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const gateway = useGatewayProbe(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const busy = isLoading || isRedirecting;

  useEffect(() => {
    if (registered === '1') {
      const isDelivery = registeredRole === 'delivery' || role === 'delivery';
      setSuccess(
        isDelivery
          ? 'Account created successfully. Sign in to open your delivery dashboard.'
          : 'Account created successfully. Sign in to complete your restaurant profile.'
      );
      if (registeredRole === 'delivery' || registeredRole === 'restaurant') {
        setRole(registeredRole);
      }
      if (typeof registeredEmail === 'string' && registeredEmail) {
        setEmail(registeredEmail);
      }
    }
  }, [registered, registeredEmail, registeredRole, role, setRole]);

  const validate = () => {
    const next: typeof fieldErrors = {};
    if (!EMAIL_RE.test(email.trim())) next.email = 'Enter a valid email address';
    if (password.length < 6) next.password = 'Password must be at least 6 characters';
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleLogin = async () => {
    setError(null);
    setSuccess(null);
    if (!validate()) return;
    try {
      await login({ email: email.trim().toLowerCase(), password, role });
      setIsRedirecting(true);
      const userRole = useAuthStore.getState().user?.role ?? role;
      const target = await resolvePostAuthRoute(userRole);
      router.replace(target);
    } catch (err) {
      setIsRedirecting(false);
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  if (isRedirecting) {
    return <AuthLoadingScreen message="Signing you in…" />;
  }

  return (
    <AuthSlideSheet
      onDismissed={() => (onDismiss ? onDismiss() : router.replace('/'))}
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={{ maxHeight: Math.round(screenH * 0.718) }}
        >
            <View className="bg-white rounded-t-[40px] px-6 pt-6 pb-12">
              <View className="mb-5">
                <Text
                  style={{
                    color: '#020617',
                    fontFamily: fonts.extraBold,
                    fontSize: 26,
                    letterSpacing: -0.4,
                  }}
                >
                  Welcome back
                </Text>
                <Text
                  style={{
                    marginTop: 6,
                    color: '#64748B',
                    fontFamily: fonts.medium,
                    fontSize: 14,
                    lineHeight: 20,
                  }}
                >
                  Sign in to continue
                </Text>
              </View>

              <AuthBanner type="success" message={success} />
              <AuthBanner
                type="error"
                message={
                  error ||
                  (gateway.reachable === false
                    ? `Can't reach TOKAJO servers. Check your internet and try again.`
                    : null)
                }
              />
              {gateway.reachable === false ? (
                <Pressable
                  onPress={gateway.retry}
                  disabled={gateway.checking}
                  className="mb-4 self-start"
                >
                  <Text className="text-sm font-bold text-[#EA4B14]">
                    {gateway.checking ? 'Retrying…' : 'Retry connection'}
                  </Text>
                </Pressable>
              ) : null}

              <AuthField
                label="Email"
                icon={Mail}
                placeholder="Enter your email"
                autofill="email"
                value={email}
                onChangeText={setEmail}
                errorText={fieldErrors.email}
              />

              <AuthField
                label="Password"
                icon={Lock}
                placeholder="Enter your Password"
                secure
                autofill="password"
                value={password}
                onChangeText={setPassword}
                errorText={fieldErrors.password}
                labelAccessory={null}
              />

              <View className="flex-row items-center justify-between mb-4 mt-0">
                <CheckboxRow
                  checked={keepLoggedIn}
                  onToggle={() => setKeepLoggedIn((v) => !v)}
                  label="Remember me"
                />
                <Pressable onPress={() => router.push('/forgot-password')} hitSlop={8}>
                  <Text className="text-sm font-semibold text-[#EA4B14]">
                    Forgot Password?
                  </Text>
                </Pressable>
              </View>

              <View className="mt-2 gap-5">
                <SwipeToLogin busy={busy} onConfirm={() => void handleLogin()} />

                <Pressable
                  onPress={() =>
                    router.push({ pathname: '/verify-otp', params: { role } })
                  }
                  disabled={busy}
                  hitSlop={8}
                  className="h-12 flex-row items-center justify-center gap-2 rounded-full border border-[#FDBA74] bg-[#FFF7ED]"
                >
                  <MessageSquareCode color="#EA4B14" size={18} />
                  <Text className="text-center text-[15px] font-semibold text-[#EA4B14]">
                    Login with OTP
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => router.push({ pathname: '/register', params: { role } })}
                  hitSlop={12}
                  accessibilityRole="link"
                  accessibilityLabel="Create an account"
                  className="items-center py-2"
                >
                  <Text className="text-center text-[15px] text-secondary">
                    Don't have an account?{' '}
                    <Text className="font-bold text-[#EA4B14]">Create an account</Text>
                  </Text>
                </Pressable>
              </View>

              <LegalFooter />
            </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AuthSlideSheet>
  );
}
