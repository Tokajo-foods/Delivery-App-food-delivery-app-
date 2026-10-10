import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Alert } from 'react-native';

import { useProfileEditor } from '@/components/delivery/profile/use-profile-editor';
import { partnerBankKeys } from '@/lib/delivery-partner/bank-hooks';
import {
  getDocumentProgress,
  getPartnerVerificationBadge,
} from '@/lib/delivery-partner/go-online-guard';
import { useDeliveryPartnerMe } from '@/lib/delivery-partner/hooks';
import { DELIVERY_ROUTES } from '@/lib/delivery-partner/navigation';
import { VEHICLE_TYPE_OPTIONS } from '@/lib/delivery-partner/types';
import { getApiErrorMessage } from '@/lib/errors';
import { platformAccountKeys, usePlatformMe } from '@/lib/user/account-hooks';
import { displayPlatformName } from '@/lib/user/account-types';
import { useAuthStore } from '@/store/auth-store';

function dash(value?: string | null) {
  const v = value?.trim();
  return v ? v : '—';
}

function partnerIdShort(id?: string) {
  if (!id?.trim()) return '—';
  const clean = id.replace(/[^a-zA-Z0-9]/g, '');
  return (clean.slice(-8) || id.slice(-8)).toUpperCase();
}

function vehicleLabel(type?: string) {
  if (!type?.trim()) return 'Vehicle';
  const key = type.trim().toLowerCase().replace(/\s+/g, '_');
  const match = VEHICLE_TYPE_OPTIONS.find(
    (o) => o.value === key || o.label.toLowerCase() === type.trim().toLowerCase()
  );
  if (match) return match.label;
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function usePartnerProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const me = useDeliveryPartnerMe();
  const platformMe = usePlatformMe();
  const logout = useAuthStore((s) => s.logout);
  const authUser = useAuthStore((s) => s.user);
  const [pullRefreshing, setPullRefreshing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [contactKind, setContactKind] = useState<'phone' | 'email' | null>(null);

  const profile = me.data;
  const platform = platformMe.data;
  const displayName = useMemo(() => {
    const fromPlatform = displayPlatformName(platform);
    if (fromPlatform) return fromPlatform;
    return (
      profile?.name?.trim() ||
      [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') ||
      '—'
    );
  }, [platform, profile]);
  const initials = useMemo(() => {
    const parts = displayName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (parts[0]?.[0] ?? '?').toUpperCase();
  }, [displayName]);

  const photoUrl = platform?.photoUrl || profile?.photoUrl;
  const accountPhone = platform?.phone || profile?.phone;
  const accountEmail =
    authUser?.email?.trim() || platform?.email?.trim() || profile?.email?.trim() || '';
  const emailVerified = Boolean(platform?.emailVerified ?? authUser?.emailVerified);
  const editor = useProfileEditor({
    profile,
    platform,
    photoUrl,
    emailVerified,
    accountEmail,
  });
  const verification = useMemo(() => getPartnerVerificationBadge(profile), [profile]);
  const docProgress = useMemo(() => getDocumentProgress(profile), [profile]);
  const vehicleTypeRaw = profile?.vehicle?.type ?? profile?.vehicleType;
  const vehicleBits = [
    dash(profile?.vehicle?.number ?? profile?.vehicleNumber),
    dash(profile?.vehicle?.model ?? profile?.vehicleModel),
    dash(profile?.vehicle?.color ?? profile?.vehicleColor),
  ].filter((bit) => bit !== '—');

  const onRefresh = async () => {
    setPullRefreshing(true);
    try {
      await Promise.all([
        me.refetch(),
        platformMe.refetch(),
        queryClient.invalidateQueries({ queryKey: platformAccountKeys.preferences() }),
        queryClient.invalidateQueries({ queryKey: partnerBankKeys.all }),
      ]);
    } finally {
      setPullRefreshing(false);
    }
  };

  const onLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setLoggingOut(true);
            try {
              await logout();
            } finally {
              setLoggingOut(false);
              router.replace('/login');
            }
          })();
        },
      },
    ]);
  };

  return {
    view: {
      loading: me.isLoading && !profile,
      error:
        me.isError && !profile
          ? getApiErrorMessage(me.error, 'Could not load profile.')
          : null,
      empty: !profile && !me.isLoading && !me.isError,
      refreshing: pullRefreshing,
      onRefresh: () => void onRefresh(),
      displayName,
      initials,
      photoUrl,
      uploadingPhoto: editor.uploadingPhoto,
      onPhoto: editor.onPhoto,
      partnerId: partnerIdShort(profile?.id),
      rating: profile?.stats?.avgRating ?? 0,
      deliveries: profile?.stats?.totalDeliveries ?? 0,
      completion: profile?.stats?.completionRate ?? 0,
      acceptance: profile?.stats?.acceptanceRate ?? 0,
      online: Boolean(profile?.isOnline ?? profile?.isAvailable),
      verification,
      docLine:
        verification.key === 'verified'
          ? null
          : `Documents ${docProgress.verified}/${docProgress.total} verified${
              docProgress.pending ? ` · ${docProgress.pending} pending` : ''
            }${docProgress.rejected ? ` · ${docProgress.rejected} rejected` : ''}`,
      onKyc: () => router.push(DELIVERY_ROUTES.documents),
      phone: dash(accountPhone),
      email: dash(accountEmail || profile?.email),
      birthday: dash(profile?.dateOfBirth),
      address: dash(
        [profile?.homeAddress, profile?.city].filter(Boolean).join(', ')
      ),
      onChangePhone: () => setContactKind('phone'),
      onChangeEmail: () => setContactKind('email'),
      vehicleTitle: vehicleLabel(vehicleTypeRaw),
      vehicleMeta: vehicleBits.length ? vehicleBits.join(' · ') : 'Add your vehicle details',
      onEditVehicle: () => editor.openEdit('vehicle'),
      emailVerified,
      resendingEmail: editor.resendingEmail,
      onResendEmail: editor.onResendEmail,
      onPassword: () => editor.openEdit('password'),
      loggingOut,
      onLogout,
    },
    contactKind,
    accountPhone,
    accountEmail,
    setContactKind,
    edit: editor.edit,
  };
}
