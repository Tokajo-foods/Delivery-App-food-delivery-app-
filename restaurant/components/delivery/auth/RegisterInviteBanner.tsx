import { ActivityIndicator, Text, View } from 'react-native';

import { AuthBanner } from '@/components/auth/AuthBanner';
import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import type { PartnerInviteValidation } from '@/lib/delivery-partner/types';

type Props = { loading: boolean; invite: PartnerInviteValidation | null };

export function RegisterInviteBanner({ loading, invite }: Props) {
  if (loading) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }}>
        <ActivityIndicator color={authTheme.brand} />
        <Text style={{ color: authTheme.textMuted, fontFamily: fonts.medium, fontSize: 13 }}>
          Validating restaurant invitation…
        </Text>
      </View>
    );
  }
  if (invite?.valid) {
    return (
      <AuthBanner
        type="success"
        message={
          invite.restaurantName
            ? `Invite verified for ${invite.restaurantName}. Finish your profile to join.`
            : 'Restaurant invite verified. Finish your profile to accept.'
        }
      />
    );
  }
  return (
    <AuthBanner
      type="error"
      message={
        invite?.message ||
        'This invitation link is invalid or expired. Ask the restaurant for a new invite.'
      }
    />
  );
}
