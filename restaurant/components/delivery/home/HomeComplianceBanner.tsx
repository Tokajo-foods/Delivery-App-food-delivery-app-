import { useRouter } from 'expo-router';
import { ChevronRight, ShieldAlert } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { styles } from '@/components/delivery/home/home-screen-styles';
import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import {
  getDocumentProgress,
  getGoOnlineBlocker,
  getPartnerVerificationBadge,
  isPartnerAccountActive,
} from '@/lib/delivery-partner/go-online-guard';
import { DELIVERY_ROUTES } from '@/lib/delivery-partner/navigation';
import type { DeliveryPartnerProfile } from '@/lib/delivery-partner/types';

type Props = {
  profile: DeliveryPartnerProfile | null | undefined;
};

function buildPrompt(profile: DeliveryPartnerProfile | null | undefined) {
  if (!profile?.id) return null;

  const blocker = getGoOnlineBlocker(profile);
  const { verified, total, submitted, pending, rejected } =
    getDocumentProgress(profile);
  const badge = getPartnerVerificationBadge(profile);
  const active = isPartnerAccountActive(profile);

  if (blocker) {
    const progress =
      total > 0 ? `${submitted}/${total} documents uploaded · ${verified} verified` : '';
    return {
      title: blocker.title,
      message: blocker.message,
      detail: progress,
      actionLabel: blocker.actionLabel,
      actionHref: blocker.actionHref,
      tone: rejected > 0 ? 'danger' : ('warn' as const),
    };
  }

  if (active && verified >= total && total > 0) {
    return null;
  }

  if (badge.key === 'verified') {
    return null;
  }

  return {
    title: 'Complete your KYC',
    message:
      'Upload and verify your documents (ID, licence, RC, bank, and photo) before you can go online and receive orders.',
    detail:
      total > 0
        ? `${verified}/${total} verified · ${pending > 0 ? `${pending} under review` : `${total - submitted} remaining`}`
        : undefined,
    actionLabel: 'Open Documents',
    actionHref: DELIVERY_ROUTES.documents,
    tone: 'warn' as const,
  };
}

export function HomeComplianceBanner({ profile }: Props) {
  const router = useRouter();
  const prompt = buildPrompt(profile);
  if (!prompt) return null;

  const border =
    prompt.tone === 'danger' ? '#FECACA' : '#FED7AA';
  const bg = prompt.tone === 'danger' ? '#FEF2F2' : '#FFF7ED';
  const iconColor = prompt.tone === 'danger' ? '#B91C1C' : authTheme.brand;

  return (
    <Pressable
      onPress={() => router.push(prompt.actionHref as never)}
      style={[
        styles.demandCta,
        {
          borderColor: border,
          backgroundColor: bg,
          alignItems: 'flex-start',
          gap: 10,
        },
      ]}
      accessibilityRole="button"
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, flex: 1 }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: '#FFFFFF',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ShieldAlert size={18} color={iconColor} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[styles.demandCtaTitle, { color: authTheme.text }]}>{prompt.title}</Text>
          <Text style={[styles.demandCtaHint, { color: authTheme.textMuted, lineHeight: 19 }]}>
            {prompt.message}
          </Text>
          {prompt.detail ? (
            <Text
              style={{
                fontFamily: fonts.semiBold,
                fontSize: 11,
                color: authTheme.textDim,
                marginTop: 2,
              }}
            >
              {prompt.detail}
            </Text>
          ) : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: authTheme.brand }}>
              {prompt.actionLabel}
            </Text>
            <ChevronRight size={16} color={authTheme.brand} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}
