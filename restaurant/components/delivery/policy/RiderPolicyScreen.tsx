import { useRouter } from 'expo-router';
import { Check, ShieldCheck } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  BackHandler,
  Pressable,
  ScrollView,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { PolicyDocument } from '@/components/delivery/policy/PolicyDocument';
import { policyStyles as styles } from '@/components/delivery/policy/policy-styles';
import { authTheme } from '@/constants/auth-theme';
import { DELIVERY_ROUTES } from '@/lib/delivery-partner/navigation';
import {
  RIDER_POLICY_TITLE,
  RIDER_POLICY_VERSION,
} from '@/lib/delivery-partner/policy-content';
import {
  useAcceptRiderPolicy,
  useRiderPolicyStatus,
} from '@/lib/delivery-partner/policy-hooks';
import { getApiErrorCode, getApiErrorMessage } from '@/lib/errors';
import { useAuthStore } from '@/store/auth-store';

const END_SLACK_PX = 48;

export function RiderPolicyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const clearSession = useAuthStore((s) => s.clearSession);
  const status = useRiderPolicyStatus();
  const accept = useAcceptRiderPolicy();
  const [progress, setProgress] = useState(0);
  const [readToEnd, setReadToEnd] = useState(false);
  const [checked, setChecked] = useState(false);
  const [viewportH, setViewportH] = useState(0);

  const alreadyAccepted = status.data?.accepted === true;
  const acceptedOn = status.data?.acceptedAt
    ? new Date(status.data.acceptedAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const scrollable = Math.max(1, contentSize.height - layoutMeasurement.height);
    setProgress(Math.min(1, Math.max(0, contentOffset.y / scrollable)));
    if (contentOffset.y + layoutMeasurement.height >= contentSize.height - END_SLACK_PX) {
      setReadToEnd(true);
    }
  };

  const onContentSize = (_w: number, h: number) => {
    if (viewportH > 0 && h <= viewportH + END_SLACK_PX) {
      setReadToEnd(true);
      setProgress(1);
    }
  };

  const signOut = useCallback(async () => {
    await clearSession();
    router.replace({ pathname: '/login', params: { role: 'delivery' } } as never);
  }, [clearSession, router]);

  const onDecline = useCallback(() => {
    Alert.alert(
      'Decline the policy?',
      'You can’t deliver with Tokajo without accepting the rider onboarding policy. You will be signed out.',
      [
        { text: 'Review again', style: 'cancel' },
        { text: 'Decline & sign out', style: 'destructive', onPress: () => void signOut() },
      ]
    );
  }, [signOut]);

  useEffect(() => {
    if (alreadyAccepted) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onDecline();
      return true;
    });
    return () => sub.remove();
  }, [alreadyAccepted, onDecline]);

  const onAccept = () => {
    if (!readToEnd || !checked) return;
    accept.mutate(RIDER_POLICY_VERSION, {
      onSuccess: () => router.replace(DELIVERY_ROUTES.home as never),
      onError: (err) => {
        const code = getApiErrorCode(err);
        Alert.alert(
          code === 'POLICY_VERSION_MISMATCH' ? 'Policy updated' : 'Could not save',
          code === 'POLICY_VERSION_MISMATCH'
            ? 'A newer version of the policy is available. Update the app, then accept it again.'
            : getApiErrorMessage(err, 'Please check your connection and try again.')
        );
      },
    });
  };

  const canCheck = readToEnd || alreadyAccepted;

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.brandRow}>
          <ShieldCheck color={authTheme.brand} size={18} />
          <Text style={styles.brand}>TOKAJO</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>OFFICIAL POLICY</Text>
          </View>
        </View>
        <Text style={styles.title}>{RIDER_POLICY_TITLE}</Text>
        <Text style={styles.meta}>Version {RIDER_POLICY_VERSION} · 15 sections</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        onScroll={onScroll}
        scrollEventThrottle={64}
        onLayout={(e) => setViewportH(e.nativeEvent.layout.height)}
        onContentSizeChange={onContentSize}
      >
        <PolicyDocument />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        {alreadyAccepted ? (
          <>
            <Text style={styles.acceptedNote}>
              Accepted{acceptedOn ? ` on ${acceptedOn}` : ''}
            </Text>
            <PrimaryButton
              label="Continue"
              onPress={() => router.replace(DELIVERY_ROUTES.home as never)}
            />
          </>
        ) : (
          <>
            {!readToEnd ? (
              <Text style={styles.hint}>Scroll to the end to accept the policy</Text>
            ) : null}
            <Pressable
              style={[styles.checkRow, !canCheck && styles.disabled]}
              disabled={!canCheck}
              onPress={() => setChecked((v) => !v)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked, disabled: !canCheck }}
            >
              <View style={[styles.checkbox, checked && styles.checkboxOn]}>
                {checked ? <Check color="#FFFFFF" size={14} strokeWidth={3} /> : null}
              </View>
              <Text style={styles.checkLabel}>
                I have read, understood and accept all the terms and conditions of the
                Tokajo Rider Onboarding Policy, including the declaration.
              </Text>
            </Pressable>
            <PrimaryButton
              label="Accept & continue"
              onPress={onAccept}
              loading={accept.isPending}
              disabled={!readToEnd || !checked}
            />
            <Pressable onPress={onDecline} style={styles.declineBtn} disabled={accept.isPending}>
              <Text style={styles.declineText}>Decline</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}
