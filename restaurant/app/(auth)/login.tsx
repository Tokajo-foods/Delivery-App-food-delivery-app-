import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { LoginScreen } from '@/components/auth/LoginScreen';
import { WelcomeScreen } from '@/components/welcome/WelcomeScreen';

export default function LoginRoute() {
  const { registered, form } = useLocalSearchParams<{
    registered?: string;
    form?: string;
  }>();
  const [started, setStarted] = useState(registered === '1' || form === '1');

  if (!started) {
    return <WelcomeScreen onGetStarted={() => setStarted(true)} />;
  }

  return <LoginScreen />;
}
