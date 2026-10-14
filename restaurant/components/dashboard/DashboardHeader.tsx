import { LinearGradient } from 'expo-linear-gradient';
import { BadgeCheck, Bell, Store } from 'lucide-react-native';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';

type Props = {
  name: string;
  restaurantName?: string;
  restaurantCity?: string;
  logoUrl?: string;
  unreadNotifications?: number;
  activeOrders?: number;
  verificationLabel?: string;
  verificationColor?: string;
  verificationSoft?: string;
  dutyLabel?: string;
  dutyOnline?: boolean;
  onNotificationsPress?: () => void;
  onProfilePress?: () => void;
};

function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return (parts[0]?.[0] ?? 'R').toUpperCase();
}

/** Warm gradient header mirroring the delivery partner home (wordmark + greeting + bell). */
export function DashboardHeader({
  name,
  restaurantName,
  restaurantCity,
  logoUrl,
  unreadNotifications = 0,
  verificationLabel,
  verificationColor,
  verificationSoft,
  dutyLabel,
  dutyOnline,
  onNotificationsPress,
  onProfilePress,
}: Props) {
  const insets = useSafeAreaInsets();
  const firstName = name.split(' ')[0] || name;
  const initials = initialsFrom(restaurantName || name);
  const unread = Math.max(0, unreadNotifications);
  const live = dutyOnline === true;
  const placeLabel =
    [restaurantName || 'Your restaurant', restaurantCity]
      .filter(Boolean)
      .join(' · ');

  return (
    <LinearGradient
      colors={['#FFE9D6', '#FFF4EB', '#F6F3F0']}
      locations={[0, 0.62, 1]}
      style={[styles.wrap, { paddingTop: insets.top + 8 }]}
    >
      <View style={styles.logoRow}>
        <Image
          source={require('../../assets/tokajo-wordmark.webp')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.headerRow}>
        <Pressable
          onPress={onProfilePress}
          style={styles.identityBtn}
          accessibilityRole="button"
          accessibilityLabel="Restaurant profile"
        >
          <View style={styles.avatar}>
            {logoUrl ? (
              <Image source={{ uri: logoUrl }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarText}>{initials}</Text>
            )}
          </View>
          <View style={styles.identityStack}>
            <Text style={styles.greeting} numberOfLines={1}>
              Hi, {firstName}
            </Text>
            <View style={styles.locInline}>
              <Store color="#EA4B14" size={13} strokeWidth={2.4} />
              <Text style={styles.locTitle} numberOfLines={1}>
                {placeLabel}
              </Text>
            </View>
          </View>
        </Pressable>

        <Pressable
          onPress={onNotificationsPress}
          style={styles.bellBtn}
          accessibilityRole="button"
          accessibilityLabel={
            unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'
          }
          hitSlop={6}
        >
          <Bell color="#EA4B14" size={20} strokeWidth={2.2} />
          {unread > 0 ? <View style={styles.bellDot} /> : null}
        </Pressable>
      </View>

      <View style={styles.metaRow}>
        <View
          style={[
            styles.livePill,
            live ? styles.livePillOn : styles.livePillOff,
          ]}
        >
          <View
            style={[
              styles.liveDot,
              { backgroundColor: live ? '#EA4B14' : authTheme.textDim },
            ]}
          />
          <Text style={[styles.liveText, live ? styles.liveTextOn : undefined]}>
            {dutyLabel || (live ? 'Open now' : 'Offline')}
          </Text>
        </View>

        {verificationLabel ? (
          <View
            style={[
              styles.verifyPill,
              { backgroundColor: verificationSoft ?? '#FFFFFF' },
            ]}
          >
            <BadgeCheck
              color={verificationColor ?? authTheme.brand}
              size={13}
              strokeWidth={2.3}
            />
            <Text
              style={[
                styles.verifyText,
                { color: verificationColor ?? authTheme.brand },
              ]}
            >
              {verificationLabel}
            </Text>
          </View>
        ) : null}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 18,
  },
  logoRow: {
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 156,
    height: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  identityBtn: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#FFF1E8',
    borderWidth: 1,
    borderColor: '#F3E7DE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: 44,
    height: 44,
  },
  avatarText: {
    color: '#EA4B14',
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  identityStack: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  greeting: {
    fontFamily: fonts.extraBold,
    fontSize: 18,
    letterSpacing: -0.3,
    color: authTheme.text,
  },
  locInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locTitle: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: '#4B5563',
  },
  bellBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3E7DE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#EA4B14',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: -2,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
    gap: 6,
    borderWidth: 1,
  },
  livePillOn: {
    backgroundColor: '#FFF1E8',
    borderColor: '#F6E4D6',
  },
  livePillOff: {
    backgroundColor: '#FFFFFF',
    borderColor: '#EADFD5',
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  liveText: {
    color: authTheme.textMuted,
    fontSize: 12,
    fontFamily: fonts.bold,
  },
  liveTextOn: {
    color: '#EA4B14',
  },
  verifyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#F3E7DE',
  },
  verifyText: {
    fontSize: 11,
    fontFamily: fonts.bold,
  },
});
