import { ChevronRight, Mail, Phone } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { ContactChangeModal } from '@/components/account/ContactChangeModal';
import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import { useAuthStore } from '@/store/auth-store';

type Props = {
  phone?: string;
  email?: string;
  emailVerified?: boolean;
};

/**
 * Login phone / email with dual-OTP change flow.
 */
export function KitchenAccountContactCard({
  phone,
  email,
  emailVerified,
}: Props) {
  const resendEmailVerification = useAuthStore((s) => s.resendEmailVerification);
  const [contactKind, setContactKind] = useState<'phone' | 'email' | null>(null);

  return (
    <>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Phone & email</Text>
        <Text style={styles.hint}>
          Update your login phone or email. We’ll verify the current contact,
          then the new one with OTP.
        </Text>

        <Pressable
          onPress={() => setContactKind('phone')}
          style={styles.row}
          accessibilityRole="button"
          accessibilityLabel="Change phone number"
        >
          <Phone color={authTheme.brand} size={16} />
          <View style={styles.rowBody}>
            <Text style={styles.rowLabel}>Phone number</Text>
            <Text style={styles.meta}>{phone || 'Add a mobile number'}</Text>
          </View>
          <Text style={styles.action}>Change</Text>
          <ChevronRight color={authTheme.textMuted} size={16} />
        </Pressable>

        <Pressable
          onPress={() => setContactKind('email')}
          style={styles.row}
          accessibilityRole="button"
          accessibilityLabel="Change email address"
        >
          <Mail color={authTheme.brand} size={16} />
          <View style={styles.rowBody}>
            <Text style={styles.rowLabel}>Email address</Text>
            <Text style={styles.meta}>{email || 'Add an email'}</Text>
          </View>
          <Text style={styles.action}>Change</Text>
          <ChevronRight color={authTheme.textMuted} size={16} />
        </Pressable>

        <Pressable
          onPress={() => {
            if (emailVerified) {
              Alert.alert('Already verified', 'Your email is already verified.');
              return;
            }
            void resendEmailVerification()
              .then(() =>
                Alert.alert('Email sent', 'Verification link sent to your inbox.')
              )
              .catch((error) =>
                Alert.alert(
                  'Failed',
                  error instanceof Error
                    ? error.message
                    : 'Could not resend email'
                )
              );
          }}
          style={styles.linkRow}
        >
          <Text style={styles.linkText}>
            {emailVerified ? 'Email verified' : 'Resend verification email'}
          </Text>
        </Pressable>
      </View>

      <ContactChangeModal
        kind={contactKind}
        current={contactKind === 'phone' ? phone : email}
        onClose={() => setContactKind(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: authTheme.cardBorder,
    padding: 14,
    gap: 10,
  },
  cardTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: authTheme.text,
  },
  hint: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 17,
    color: authTheme.textMuted,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  rowBody: { flex: 1 },
  rowLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: authTheme.text,
  },
  meta: {
    marginTop: 2,
    fontFamily: fonts.medium,
    fontSize: 12,
    color: authTheme.textMuted,
  },
  action: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: authTheme.brand,
  },
  linkRow: { paddingVertical: 4, alignItems: 'flex-start' },
  linkText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: authTheme.brand,
  },
});
