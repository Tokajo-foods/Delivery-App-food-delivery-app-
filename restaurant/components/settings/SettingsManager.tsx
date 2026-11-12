import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  Building2,
  Clock3,
  ImageIcon,
  Lock,
  UserRound,
} from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { RestaurantPageHeader } from '@/components/dashboard/RestaurantPageHeader';
import { KitchenHoursEditor } from '@/components/settings/KitchenHoursEditor';
import { ProfileSettingsTab } from '@/components/settings/ProfileSettingsTab';
import { RestaurantPhotosManager } from '@/components/settings/RestaurantPhotosManager';
import { authTheme, PARTNER_BOTTOM_NAV_INSET } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import {
  useRestaurantDetail,
  useRestaurantSettingsMutations,
} from '@/lib/restaurant/settings-hooks';
import { restaurantOutletKeys } from '@/lib/restaurant/hooks';
import { type RestaurantDetail } from '@/lib/restaurant/settings-types';

type TabKey = 'profile' | 'images' | 'hours' | 'security';

const TABS: { key: TabKey; label: string; Icon: typeof Building2 }[] = [
  { key: 'profile', label: 'Profile', Icon: Building2 },
  { key: 'images', label: 'Photos', Icon: ImageIcon },
  { key: 'hours', label: 'Hours', Icon: Clock3 },
  { key: 'security', label: 'Security', Icon: Lock },
];

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionHint}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

function SecurityTab() {
  const router = useRouter();

  return (
    <View style={{ gap: 14 }}>
      <Section title="Change Password">
        <Text style={styles.meta}>
          We send a code to your registered email and phone. After you verify
          them, you choose a new password.
        </Text>
      </Section>
      <PrimaryButton
        label="Change Password"
        icon={Lock}
        onPress={() => router.push('/change-password')}
      />
      <Pressable
        onPress={() => router.push('/account')}
        style={styles.chainRow}
      >
        <UserRound color={authTheme.brand} size={18} />
        <View style={{ flex: 1 }}>
          <Text style={styles.toggleLabel}>Your account</Text>
          <Text style={styles.meta}>
            Name, photo, phone, email, language, sessions, and delete.
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

export function SettingsManager() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabKey>('profile');
  const detailQuery = useRestaurantDetail(true);
  const restaurantId = detailQuery.restaurantId;
  const mutations = useRestaurantSettingsMutations(restaurantId);

  const detail = detailQuery.data;

  const busy =
    mutations.updateProfile.isPending ||
    mutations.updateStatus.isPending ||
    mutations.updateTimings.isPending ||
    mutations.uploadLogo.isPending ||
    mutations.uploadCover.isPending ||
    mutations.uploadGallery.isPending ||
    mutations.deleteGalleryImage.isPending;

  const refresh = async () => {
    await Promise.all([
      detailQuery.refetch(),
      queryClient.invalidateQueries({ queryKey: restaurantOutletKeys.all }),
    ]);
  };

  const run = async (fn: () => Promise<unknown>, success: string) => {
    try {
      await fn();
      Alert.alert('Saved', success);
    } catch (error) {
      Alert.alert(
        'Save failed',
        error instanceof Error ? error.message : 'Could not save changes'
      );
    }
  };

  return (
    <View style={styles.screen}>
      <RestaurantPageHeader
        title="Settings"
        subtitle={
          detail?.name
            ? `${detail.name} · profile, photos & hours`
            : 'Profile, photos, hours & security'
        }
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: PARTNER_BOTTOM_NAV_INSET,
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={detailQuery.isRefetching}
            onRefresh={() => void refresh()}
            tintColor={authTheme.brand}
            colors={[authTheme.brand]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
        >
          {TABS.map(({ key, label, Icon }) => {
            const active = tab === key;
            return (
              <Pressable
                key={key}
                onPress={() => setTab(key)}
                style={[styles.tab, active && styles.tabActive]}
              >
                <Icon
                  color={active ? authTheme.brand : authTheme.textMuted}
                  size={16}
                />
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {!restaurantId ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No restaurant found</Text>
            <Text style={styles.meta}>
              Complete restaurant setup before editing settings.
            </Text>
          </View>
        ) : detailQuery.isLoading && !detail ? (
          <View style={styles.center}>
            <ActivityIndicator color={authTheme.brand} size="large" />
          </View>
        ) : detailQuery.isError && !detail ? (
          <View style={styles.empty}>
            <Text style={styles.errorText}>
              {detailQuery.error instanceof Error
                ? detailQuery.error.message
                : 'Could not load restaurant'}
            </Text>
            <PrimaryButton label="Retry" onPress={() => void refresh()} />
          </View>
        ) : detail ? (
          <>
            {tab === 'profile' ? (
              <ProfileSettingsTab
                detail={detail}
                busy={busy}
                onSave={(payload) =>
                  void run(
                    () => mutations.updateProfile.mutateAsync(payload),
                    'Profile updated.'
                  )
                }
              />
            ) : null}
            {tab === 'images' ? (
              <RestaurantPhotosManager
                detail={detail}
                busy={busy}
                onUploadLogo={(file) => mutations.uploadLogo.mutateAsync(file)}
                onUploadCover={(file) => mutations.uploadCover.mutateAsync(file)}
                onUploadGallery={(files) =>
                  mutations.uploadGallery.mutateAsync(files)
                }
                onDeleteImage={(image) =>
                  mutations.deleteGalleryImage.mutateAsync(image)
                }
              />
            ) : null}
            {tab === 'hours' ? (
              <KitchenHoursEditor
                restaurantId={restaurantId}
                busy={busy}
                onSave={(next) =>
                  void run(
                    () =>
                      mutations.updateTimings.mutateAsync({ timings: next }),
                    'Hours saved.'
                  )
                }
              />
            ) : null}
            {tab === 'security' ? <SecurityTab /> : null}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F5F5' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 14 },
  heading: {
    color: authTheme.text,
    fontSize: 26,
    fontFamily: fonts.extraBold,
    letterSpacing: -0.4,
  },
  subheading: {
    color: authTheme.textMuted,
    fontSize: 13,
    fontFamily: fonts.medium,
    marginTop: -6,
  },
  tabs: { gap: 8, paddingVertical: 4 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(122,14,34,0.08)',
  },
  tabActive: {
    borderColor: authTheme.brand,
    backgroundColor: authTheme.brandSoft,
  },
  tabText: {
    color: authTheme.textMuted,
    fontSize: 12,
    fontFamily: fonts.bold,
  },
  tabTextActive: { color: authTheme.brand },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(122,14,34,0.08)',
    padding: 14,
    gap: 10,
  },
  sectionTitle: {
    color: authTheme.text,
    fontSize: 16,
    fontFamily: fonts.bold,
  },
  sectionHint: {
    color: authTheme.textMuted,
    fontSize: 12,
    fontFamily: fonts.medium,
    lineHeight: 17,
    marginTop: -4,
  },
  field: { gap: 6 },
  label: {
    color: authTheme.text,
    fontSize: 12,
    fontFamily: fonts.semiBold,
  },
  input: {
    borderWidth: 1,
    borderColor: authTheme.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: authTheme.text,
    fontFamily: fonts.medium,
    fontSize: 14,
    backgroundColor: '#FAFAFA',
  },
  inputMultiline: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(122,14,34,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  chipActive: {
    backgroundColor: authTheme.brand,
    borderColor: authTheme.brand,
  },
  chipText: {
    color: authTheme.textMuted,
    fontSize: 12,
    fontFamily: fonts.semiBold,
  },
  chipTextActive: { color: '#FFFFFF' },
  meta: {
    color: authTheme.textMuted,
    fontSize: 12,
    fontFamily: fonts.medium,
    lineHeight: 17,
  },
  secondaryBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(122,14,34,0.18)',
    backgroundColor: authTheme.brandSoft,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  secondaryBtnText: {
    color: authTheme.brand,
    fontSize: 13,
    fontFamily: fonts.bold,
  },
  locationOk: {
    backgroundColor: '#ECFDF5',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  locationOkText: {
    color: '#059669',
    fontSize: 12,
    fontFamily: fonts.semiBold,
  },
  logoBox: {
    width: 110,
    height: 110,
    borderRadius: 16,
    backgroundColor: authTheme.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: { width: '100%', height: '100%' },
  coverBox: {
    width: '100%',
    height: 140,
    borderRadius: 16,
    backgroundColor: authTheme.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  coverImage: { width: '100%', height: '100%' },
  galleryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  galleryItem: {
    width: 96,
    height: 96,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: authTheme.surface,
  },
  galleryImage: { width: '100%', height: '100%' },
  galleryDelete: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(15,23,42,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(122,14,34,0.1)',
    paddingTop: 10,
    gap: 8,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayLabel: {
    color: authTheme.text,
    fontSize: 14,
    fontFamily: fonts.semiBold,
  },
  slotRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  slotInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: authTheme.inputBorder,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    color: authTheme.text,
    fontFamily: fonts.medium,
    backgroundColor: '#FAFAFA',
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  statusText: {
    color: authTheme.text,
    fontSize: 13,
    fontFamily: fonts.semiBold,
    flex: 1,
  },
  statusBtn: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusBtnOffline: { borderColor: 'rgba(239,68,68,0.35)' },
  statusBtnOnline: { borderColor: 'rgba(34,197,94,0.35)' },
  statusBtnText: { fontSize: 12, fontFamily: fonts.bold },
  statusBtnTextOffline: { color: authTheme.error },
  statusBtnTextOnline: { color: authTheme.success },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  toggleLabel: {
    color: authTheme.text,
    fontSize: 13,
    fontFamily: fonts.semiBold,
    flex: 1,
    paddingRight: 12,
  },
  chainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(122,14,34,0.08)',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 36,
    gap: 8,
  },
  emptyTitle: {
    color: authTheme.text,
    fontSize: 15,
    fontFamily: fonts.extraBold,
  },
  center: { paddingVertical: 40, alignItems: 'center' },
  errorText: {
    color: authTheme.error,
    fontSize: 13,
    fontFamily: fonts.medium,
    textAlign: 'center',
  },
  pressed: { opacity: 0.88 },
  disabled: { opacity: 0.5 },
  cancelText: {
    color: authTheme.textMuted,
    fontFamily: fonts.bold,
    fontSize: 14,
  },
});
