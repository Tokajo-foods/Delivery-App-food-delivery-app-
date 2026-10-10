import { Image } from 'expo-image';
import { Camera, ChevronRight } from 'lucide-react-native';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PartnerBankTaxSection } from '@/components/delivery/profile/BankTaxSection';
import { PlatformAccountSection } from '@/components/delivery/profile/PlatformAccountSection';
import { profilePageStyles as styles } from '@/components/delivery/profile/profile-page-styles';
import { PARTNER_BOTTOM_NAV_INSET } from '@/constants/auth-theme';
import { formatPercent, formatRating } from '@/lib/delivery-partner/analytics-api';
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
  birthday: string;
  address: string;
  onChangePhone: () => void;
  onChangeEmail: () => void;
  vehicleTitle: string;
  vehicleMeta: string;
  onEditVehicle: () => void;
  emailVerified: boolean;
  resendingEmail: boolean;
  onResendEmail: () => void;
  onPassword: () => void;
  loggingOut: boolean;
  onLogout: () => void;
};

function Row({
  label,
  value,
  action,
  onAction,
  first,
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
      <Text style={styles.pageTitle}>Profile</Text>
      <Text style={styles.pageSub}>Your delivery partner account</Text>

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
                <Text style={styles.meta} numberOfLines={1}>
                  {formatRating(s.rating)} rating · ID {s.partnerId}
                </Text>
                <View style={styles.pills}>
                  <View style={[styles.pill, { backgroundColor: s.online ? '#DCFCE7' : '#F1F5F9' }]}>
                    <Text style={[styles.pillText, { color: s.online ? '#15803D' : '#64748B' }]}>
                      {s.online ? 'Online' : 'Offline'}
                    </Text>
                  </View>
                  <View style={[styles.pill, { backgroundColor: s.verification.soft }]}>
                    <Text style={[styles.pillText, { color: s.verification.color }]}>
                      {s.verification.label}
                    </Text>
                  </View>
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
            <Row label="Birthday" value={s.birthday} />
            <Row label="Address" value={s.address} lines={2} />
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

          <Text style={styles.groupLabel}>Payout</Text>
          <PartnerBankTaxSection />

          <Text style={styles.groupLabel}>Security</Text>
          <View style={styles.card}>
            <View style={[styles.row, styles.rowFirst]}>
              <View style={styles.secureBody}>
                <Text style={styles.secureTitle}>
                  {s.emailVerified ? 'Email verified' : 'Verify email'}
                </Text>
                <Text style={styles.secureHint} numberOfLines={1}>
                  {s.email}
                </Text>
              </View>
              {!s.emailVerified ? (
                <Pressable onPress={s.onResendEmail} disabled={s.resendingEmail} hitSlop={8}>
                  {s.resendingEmail ? (
                    <ActivityIndicator color="#EA4B14" size="small" />
                  ) : (
                    <Text style={styles.rowAction}>Resend</Text>
                  )}
                </Pressable>
              ) : null}
            </View>
            <Pressable onPress={s.onPassword} style={styles.row}>
              <View style={styles.secureBody}>
                <Text style={styles.secureTitle}>Password</Text>
                <Text style={styles.secureHint}>Change your login password</Text>
              </View>
              <ChevronRight color="#94A3B8" size={16} />
            </Pressable>
          </View>

          <Text style={styles.groupLabel}>Alerts</Text>
          <PlatformAccountSection />

          <Pressable onPress={s.onLogout} disabled={s.loggingOut} style={styles.logout}>
            {s.loggingOut ? (
              <ActivityIndicator color="#EF4444" />
            ) : (
              <Text style={styles.logoutText}>Log out</Text>
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
