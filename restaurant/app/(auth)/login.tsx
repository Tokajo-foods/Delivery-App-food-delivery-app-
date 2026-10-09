import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { LoginScreen } from '@/components/auth/LoginScreen';
import { WelcomeScreen } from '@/components/welcome/WelcomeScreen';

export default function LoginRoute() {
  const { registered, form } = useLocalSearchParams<{
    registered?: string;
    form?: string;
  }>();
  const [started, setStarted] = useState(registered === '1' || form === '1');

  return (
    <View style={styles.root}>
      <WelcomeScreen onGetStarted={() => setStarted(true)} />
      {started ? (
        <LoginScreen onDismiss={() => setStarted(false)} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
