import 'react-native-gesture-handler';

import '../global.css';

import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Caveat_600SemiBold } from '@expo-google-fonts/caveat';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppSplashScreen } from '@/components/splash/AppSplashScreen';
import { setUnauthorizedHandler } from '@/lib/auth/unauthorized';
import { setupLiveQueryFocus } from '@/lib/live-query';
import { asyncStoragePersister, queryClient } from '@/lib/query-client';
import {
  markColdStartSplashConsumed,
  shouldShowColdStartSplash,
} from '@/lib/splash/cold-start';
import { useAuthStore } from '@/store/auth-store';

void SplashScreen.preventAutoHideAsync();
setupLiveQueryFocus();

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const clearSession = useAuthStore((s) => s.clearSession);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const token = useAuthStore((s) => s.token);
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    Caveat_600SemiBold,
  });
  const [fontWaitDone, setFontWaitDone] = useState(false);
  const [isColdStart] = useState(() => shouldShowColdStartSplash());
  const [progressDone, setProgressDone] = useState(() => !shouldShowColdStartSplash());

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const timer = setTimeout(() => setFontWaitDone(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  const uiReady = fontsLoaded || fontWaitDone;
  const loggedOut = isHydrated && !token;
  const brandSplashVisible =
    isColdStart && !(progressDone && uiReady) && !loggedOut;

  useEffect(() => {
    if (isColdStart) {
      // Hand off to branded art immediately — no spinner flash.
      void SplashScreen.hideAsync();
      return;
    }
    if (uiReady) void SplashScreen.hideAsync();
  }, [isColdStart, uiReady]);

  useEffect(() => {
    if (loggedOut) {
      setProgressDone(true);
      markColdStartSplashConsumed();
    }
  }, [loggedOut]);

  useEffect(() => {
    if (isColdStart && progressDone && uiReady) {
      markColdStartSplashConsumed();
    }
  }, [isColdStart, progressDone, uiReady]);

  const onBrandSplashFinished = useCallback(() => {
    setProgressDone(true);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(async () => {
      await clearSession();
      router.replace('/login');
    });
    return () => setUnauthorizedHandler(null);
  }, [clearSession, router]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister: asyncStoragePersister }}
        >
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'fade',
              contentStyle: { backgroundColor: '#F7EFE4' },
            }}
          >
            <Stack.Screen name="index" options={{ animation: 'none' }} />
            <Stack.Screen name="(auth)" options={{ animation: 'none' }} />
          </Stack>
          {brandSplashVisible ? (
            <AppSplashScreen onFinished={onBrandSplashFinished} />
          ) : null}
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
