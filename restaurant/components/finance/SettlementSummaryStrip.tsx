import { ChevronRight, Wallet } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import { formatCurrency } from '@/lib/dashboard/format';
import type { RestaurantWallet } from '@/lib/restaurant/finance-types';

type Props = {
  wallet?: RestaurantWallet | null;
  onRequestWithdraw?: () => void;
  withdrawDisabled?: boolean;
};

/** Wallet hero + settlement overview — primary numbers from the wallet API. */
export function SettlementSummaryStrip({
  wallet,
  onRequestWithdraw,
  withdrawDisabled,
}: Props) {
  if (!wallet) return null;

  const available = wallet.available ?? wallet.remaining ?? wallet.balance ?? 0;
  const earned = wallet.lifetimeCredited ?? 0;
  const paidOut = wallet.settled ?? wallet.lifetimeDebited ?? 0;
  const atStore = wallet.collectedAtStore ?? 0;
  const canWithdraw = !withdrawDisabled && available >= 1;

  return (
    <View style={styles.card}>
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Wallet color={authTheme.brand} size={18} strokeWidth={2.2} />
        </View>
        <View style={styles.heroCopy}>
          <Text style={styles.kicker}>Available to withdraw</Text>
          <Text style={styles.balance} numberOfLines={1} adjustsFontSizeToFit>
            {formatCurrency(available)}
          </Text>
          <Text style={styles.sub}>
            Withdraw to any UPI id anytime — you enter UPI in the next step. Pay-at-counter
            earnings stay in “At store” and are not withdrawable here.
          </Text>
        </View>
      </View>

      <View style={styles.rule} />

      <View style={styles.stats}>
        <Stat label="Earned" value={formatCurrency(earned)} />
        <View style={styles.divider} />
        <Stat label="Paid out" value={formatCurrency(paidOut)} />
        <View style={styles.divider} />
        <Stat label="At store" value={formatCurrency(atStore)} hint="Not withdrawable" />
      </View>

      {onRequestWithdraw ? (
        <Pressable
          disabled={!canWithdraw}
          onPress={onRequestWithdraw}
          style={[styles.withdrawBtn, !canWithdraw && styles.withdrawBtnDisabled]}
        >
          <Text
            style={[
              styles.withdrawBtnText,
              !canWithdraw && styles.withdrawBtnTextDisabled,
            ]}
          >
            {canWithdraw ? 'Withdraw to UPI' : 'Nothing to withdraw yet'}
          </Text>
          {canWithdraw ? <ChevronRight color="#FFFFFF" size={18} strokeWidth={2.4} /> : null}
        </Pressable>
      ) : null}
    </View>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
      {hint ? <Text style={styles.statHint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#F1EAE3',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
    shadowColor: '#1F1300',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
    gap: 12,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  heroIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: authTheme.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  kicker: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: '#1C1917',
  },
  balance: {
    fontFamily: fonts.extraBold,
    fontSize: 32,
    color: authTheme.brand,
    letterSpacing: -0.8,
    marginTop: 2,
  },
  sub: {
    marginTop: 4,
    fontFamily: fonts.medium,
    fontSize: 12,
    color: authTheme.textMuted,
    lineHeight: 17,
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E8ECF1',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 4,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: '#E2E8F0',
    marginVertical: 2,
  },
  statValue: {
    fontFamily: fonts.extraBold,
    fontSize: 15,
    color: authTheme.text,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: authTheme.textMuted,
    textAlign: 'center',
  },
  statHint: {
    fontFamily: fonts.medium,
    fontSize: 9,
    color: authTheme.textDim,
    textAlign: 'center',
  },
  withdrawBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: authTheme.brand,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  withdrawBtnDisabled: {
    backgroundColor: '#E2E8F0',
  },
  withdrawBtnText: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  withdrawBtnTextDisabled: {
    color: authTheme.textMuted,
  },
});
