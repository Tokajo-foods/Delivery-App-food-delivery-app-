import { Image } from 'expo-image';
import { Camera, ChevronRight, LogOut } from 'lucide-react-native';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PlatformAccountSection } from '@/components/delivery/profile/PlatformAccountSection';
import { DeliveryHeaderActions } from '@/components/delivery/shared/HeaderActions';
import { profilePageStyles as styles } from '@/components/delivery/profile/profile-page-styles';
import { PARTNER_BOTTOM_NAV_INSET } from '@/constants/auth-theme';
import { formatPercent } from '@/lib/delivery-partner/analytics-api';
import type { PartnerVerificationBadge } from '@/lib/delivery-partner/go-online-guard';

type Props = {
  loading: boolean;
  error: string | null;
  empty: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  displayName: string;
  initials: string;
  photoUrl?: string | null;
  uploadingPhoto: boolean;
  onPhoto: () => void;
  partnerId: string;
  rating: number;
  deliveries: number;
  completion: number;
  acceptance: number;
  online: boolean;
  verification: PartnerVerificationBadge;
  docLine: string | null;
  onKyc: () => void;
  phone: string;
  email: string;
  age: string;
  address: string;
  onEditAddress: () => void;
  onChangePhone: () => void;
  onChangeEmail: () => void;
  onForgotPassword: () => void;
  vehicleTitle: string;
  vehicleMeta: string;
  onEditVehicle: () => void;
  loggingOut: boolean;
  onLogout: () => void;
};

function Row({
  label,
  value,
  action,
  onAction,
  first,
  lines,
}: {
  label: string;
  value: string;
  action?: string;
  onAction?: () => void;
  first?: boolean;
  lines?: number;
}) {
  return (
    <View style={[styles.row, first && styles.rowFirst]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={lines ?? 1}>
        {value}
      </Text>
      {onAction ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.rowAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function ProfilePageView(props: Props) {
  const insets = useSafeAreaInsets();
  const s = props;

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[
        styles.scroll,
        {
          paddingTop: insets.top + 8,
          paddingBottom: PARTNER_BOTTOM_NAV_INSET + 12,
        },
      ]}
      refreshControl={
        <RefreshControl
          refreshing={s.refreshing}
          onRefresh={s.onRefresh}
          tintColor="#EA4B14"
          colors={['#EA4B14']}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.pageTitle}>Profile</Text>
          <Text style={styles.pageSub}>Your delivery partner account</Text>
        </View>
        <DeliveryHeaderActions onBrand hideProfile compact />
      </View>

      {s.loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#EA4B14" size="large" />
          <Text style={styles.muted}>Loading profile…</Text>
        </View>
      ) : s.error ? (
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Could not load profile</Text>
          <Text style={styles.muted}>{s.error}</Text>
          <Pressable onPress={s.onRefresh} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : s.empty ? (
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>No partner profile</Text>
          <Text style={styles.muted}>
            Complete partner registration to view your profile.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.hero}>
            <View style={styles.idBand}>
              <Text style={styles.idBrand}>TOKAJO</Text>
              <Text style={styles.idRole}>Delivery partner</Text>
            </View>
            <View style={styles.identity}>
              <View style={styles.avatarWrap}>
                {s.photoUrl ? (
                  <Image source={{ uri: s.photoUrl }} style={styles.avatar} contentFit="cover" />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarInitials}>{s.initials}</Text>
                  </View>
                )}
                <Pressable onPress={s.onPhoto} disabled={s.uploadingPhoto} style={styles.cameraBtn}>
                  {s.uploadingPhoto ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Camera color="#FFFFFF" size={13} />
                  )}
                </Pressable>
              </View>
              <View style={styles.identityBody}>
                <Text style={styles.name} numberOfLines={2}>
                  {s.displayName}
                </Text>
                <Text style={styles.idKicker}>Partner ID</Text>
                <Text style={styles.idCode}>{s.partnerId}</Text>
                <View style={styles.statusLine}>
                  <View style={[styles.statusDot, { backgroundColor: s.online ? '#16A34A' : '#94A3B8' }]} />
                  <Text style={styles.statusText}>{s.online ? 'Online' : 'Offline'}</Text>
                  <Text style={styles.statusSep}>·</Text>
                  <Text style={[styles.statusText, { color: s.verification.color }]} numberOfLines={1}>
                    {s.verification.label}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.performanceDivider} />
            <View style={styles.stats}>
              <Stat value={String(s.deliveries)} label="Trips" />
              <View style={styles.statDivider} />
              <Stat value={Number.isFinite(s.rating) ? s.rating.toFixed(1) : '0.0'} label="Rating" />
              <View style={styles.statDivider} />
              <Stat value={formatPercent(s.completion)} label="Done" />
              <View style={styles.statDivider} />
              <Stat value={formatPercent(s.acceptance)} label="Accept" />
            </View>
            {s.docLine ? (
              <Pressable onPress={s.onKyc} style={styles.kyc}>
                <Text style={styles.kycText}>{s.docLine}</Text>
                <Text style={styles.kycLink}>KYC</Text>
                <ChevronRight color="#EA4B14" size={14} />
              </Pressable>
            ) : null}
          </View>

          <Text style={styles.groupLabel}>Account</Text>
          <View style={styles.card}>
            <Row first label="Email" value={s.email} action="Change" onAction={s.onChangeEmail} />
            <Row label="Phone" value={s.phone} action="Change" onAction={s.onChangePhone} />
            <Row label="Age" value={s.age} />
            <Row label="Address" value={s.address} lines={2} action="Edit" onAction={s.onEditAddress} />
            <Row label="Password" value="••••••••" action="Forgot password" onAction={s.onForgotPassword} />
          </View>

          <Text style={styles.groupLabel}>Vehicle</Text>
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.cardTitle}>{s.vehicleTitle}</Text>
              <Pressable onPress={s.onEditVehicle} hitSlop={8}>
                <Text style={styles.edit}>Edit</Text>
              </Pressable>
            </View>
            <Text style={styles.vehicleLine}>{s.vehicleMeta}</Text>
          </View>

          <Text style={styles.groupLabel}>Alerts</Text>
          <PlatformAccountSection />

          <Pressable onPress={s.onLogout} disabled={s.loggingOut} style={styles.logout}>
            {s.loggingOut ? (
              <ActivityIndicator color="#B91C1C" />
            ) : (
              <>
                <LogOut color="#B91C1C" size={16} />
                <Text style={styles.logoutText}>Log out</Text>
              </>
            )}
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}
