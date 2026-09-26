import { CheckCircle2, Clock3, ShieldAlert } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { TrackCell } from '@/components/onboarding/OnboardingFormParts';
import { onboardingStyles as styles } from '@/components/onboarding/onboarding-styles';
import { isListingLive } from '@/lib/restaurant/listing-status';
import type { OnboardingStatus } from '@/lib/restaurant/onboarding-types';

export function onboardingStatusChip(kycStatus: string, listingStatus: string) {
  if (isListingLive(listingStatus)) {
    return { label: 'Listing live', color: '#15803D', bg: '#DCFCE7' };
  }
  if (kycStatus === 'rejected' || kycStatus === 'documents_pending') {
    return { label: 'Action needed', color: '#B91C1C', bg: '#FEE2E2' };
  }
  if (kycStatus === 'approved') {
    return { label: 'Approved', color: '#15803D', bg: '#DCFCE7' };
  }
  if (kycStatus === 'submitted' || kycStatus === 'under_review') {
    return { label: 'Under review', color: '#B45309', bg: '#FEF3C7' };
  }
  return { label: 'In progress', color: '#475569', bg: '#F1F5F9' };
}

export function OnboardingStatusHeader({
  status,
  bankLabel,
  bankLive,
}: {
  status: OnboardingStatus;
  bankLabel: string;
  bankLive: boolean;
}) {
  const listingLive = isListingLive(status.listingStatus);
  const chip = onboardingStatusChip(status.kycStatus, status.listingStatus);
  const underReview =
    status.kycStatus === 'submitted' || status.kycStatus === 'under_review';
  const needsAction =
    status.kycStatus === 'documents_pending' || status.kycStatus === 'rejected';

  return (
    <>
      <View style={styles.hero}>
        <View style={styles.percentWrap}>
          <Text style={styles.percent}>{status.percent}%</Text>
          <Text style={styles.percentLabel}>complete</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitle}>Partner KYC</Text>
          <Text style={styles.heroSub}>
            Tap a row to upload or re-upload. Verified docs stay locked until
            admin asks again. When all required docs are verified, your listing
            goes live automatically.
          </Text>
          <View style={[styles.chip, { backgroundColor: chip.bg }]}>
            <Text style={[styles.chipText, { color: chip.color }]}>
              {chip.label}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.trackRow}>
        <TrackCell
          label="Listing"
          value={listingLive ? 'Live' : 'Not live'}
          live={listingLive}
        />
        <TrackCell
          label="KYC"
          value={chip.label}
          live={status.kycStatus === 'approved'}
        />
        <TrackCell label="Bank" value={bankLabel} live={bankLive} />
      </View>

      <View style={styles.track}>
        <View
          style={[
            styles.trackFill,
            { width: `${Math.max(6, Math.min(100, status.percent))}%` },
          ]}
        />
      </View>

      {status.rejectReason || needsAction ? (
        <View style={styles.rejectBox}>
          <ShieldAlert color="#B91C1C" size={16} />
          <Text style={styles.rejectText}>
            {status.rejectReason
              ? `Action needed: ${status.rejectReason}`
              : 'A document was rejected. Open the red item, read why, and re-upload.'}
          </Text>
        </View>
      ) : null}

      {underReview && !needsAction ? (
        <View style={styles.waitBox}>
          <Clock3 color="#B45309" size={16} />
          <Text style={styles.waitText}>
            Docs are with ops. Re-upload any file that is not verified yet.
            You’ll get push + inbox alerts on reject or when you’re set to go
            live.
          </Text>
        </View>
      ) : null}

      {listingLive ? (
        <View style={styles.liveBox}>
          <CheckCircle2 color="#15803D" size={16} />
          <Text style={styles.liveText}>
            Listing is live. Go online from Home. Bank payouts stay off until
            ops verifies the account.
          </Text>
        </View>
      ) : null}
    </>
  );
}
