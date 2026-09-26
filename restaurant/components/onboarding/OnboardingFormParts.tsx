import {
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Landmark,
  MapPin,
  Upload,
  UtensilsCrossed,
} from 'lucide-react-native';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { PrimaryButton } from '@/components/auth/PrimaryButton';
import {
  canReuploadDoc,
  docStatusMeta,
  type UploadFile,
} from '@/components/onboarding/kyc-doc-meta';
import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import type { OnboardingStep } from '@/lib/restaurant/onboarding-types';

export function TrackCell({
  label,
  value,
  live,
}: {
  label: string;
  value: string;
  live: boolean;
}) {
  return (
    <View style={styles.trackCell}>
      <Text style={styles.trackLabel}>{label}</Text>
      <Text style={[styles.trackValue, live ? styles.trackValueLive : null]}>
        {value}
      </Text>
    </View>
  );
}

export function StepRow({
  step,
  last,
  expanded,
  docStatus,
  rejectReason,
  onPress,
}: {
  step: OnboardingStep;
  last: boolean;
  expanded?: boolean;
  docStatus?: string;
  rejectReason?: string | null;
  onPress: () => void;
}) {
  const Icon =
    step.key === 'bank'
      ? Landmark
      : step.key === 'address'
        ? MapPin
        : step.key === 'menu'
          ? UtensilsCrossed
          : Building2;
  const meta = docStatus ? docStatusMeta(docStatus) : null;
  const verified = docStatus === 'verified';

  return (
    <Pressable onPress={onPress} disabled={verified && !rejectReason}>
      <View style={[styles.stepRow, !last && styles.stepBorder]}>
        <View
          style={[
            styles.stepIcon,
            step.done || verified ? styles.stepIconDone : styles.stepIconTodo,
          ]}
        >
          {step.done || verified ? (
            <CheckCircle2 color="#15803D" size={16} />
          ) : (
            <Icon color={authTheme.textMuted} size={16} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.stepTitle}>
            {step.label}
            {step.required ? ' · Required' : ''}
          </Text>
          <Text style={styles.stepMeta} numberOfLines={2}>
            {meta
              ? `${meta.label}${
                  rejectReason ? ` — ${rejectReason}` : step.detail ? ` · ${step.detail}` : ''
                }`
              : step.done
                ? step.detail || 'Done'
                : step.required
                  ? 'Tap to upload document'
                  : 'Optional'}
          </Text>
        </View>
        {meta ? (
          <View style={[styles.miniChip, { backgroundColor: meta.bg }]}>
            <Text style={[styles.miniChipText, { color: meta.color }]}>
              {meta.label}
            </Text>
          </View>
        ) : null}
        {expanded ? (
          <ChevronDown color={authTheme.textDim} size={16} />
        ) : (
          <ChevronRight color={authTheme.textDim} size={16} />
        )}
      </View>
    </Pressable>
  );
}

export function LicenseCard({
  title,
  hint,
  placeholder,
  value,
  onChangeText,
  masked,
  doc,
  file,
  busy,
  onPick,
  onSave,
  keyboard,
  autoCapitalize,
  maxLength,
}: {
  title: string;
  hint: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  masked?: string | null;
  doc?: { status: string; url?: string; rejectReason?: string | null };
  file: UploadFile | null;
  busy: boolean;
  onPick: () => void;
  onSave: () => void;
  keyboard?: 'default' | 'number-pad';
  autoCapitalize?: 'none' | 'characters';
  maxLength?: number;
}) {
  const meta = docStatusMeta(doc?.status);
  const locked = !canReuploadDoc(doc?.status);

  return (
    <View style={styles.formCard}>
      <Text style={styles.formTitle}>{title}</Text>
      <Text style={styles.formHint}>{hint}</Text>
      {masked ? <Text style={styles.masked}>On file: {masked}</Text> : null}
      {doc ? (
        <View style={[styles.statusBanner, { backgroundColor: meta.bg }]}>
          <Text style={[styles.statusBannerText, { color: meta.color }]}>
            {meta.label}
          </Text>
          {doc.rejectReason ? (
            <Text style={styles.rejectReason}>Why: {doc.rejectReason}</Text>
          ) : null}
          {locked ? (
            <Text style={styles.lockHint}>
              Verified — re-upload only if admin asks for a new file.
            </Text>
          ) : null}
        </View>
      ) : null}
      {!locked ? (
        <>
          <Field
            label="Number"
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            keyboardType={keyboard}
            autoCapitalize={autoCapitalize}
            maxLength={maxLength}
          />
          <UploadRow
            file={file}
            doc={doc}
            onPick={onPick}
            label={
              doc?.status === 'rejected' || doc?.url
                ? 'Re-upload document'
                : 'Upload document'
            }
          />
          <PrimaryButton
            label={
              doc?.status === 'rejected'
                ? 'Re-upload & save'
                : doc?.url
                  ? 'Replace & save'
                  : 'Upload & save'
            }
            loading={busy}
            onPress={onSave}
          />
        </>
      ) : null}
    </View>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  maxLength,
  editable = true,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'number-pad';
  autoCapitalize?: 'none' | 'characters';
  maxLength?: number;
  editable?: boolean;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={authTheme.textDim}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? 'none'}
        autoCorrect={false}
        maxLength={maxLength}
        editable={editable}
        style={[styles.input, !editable && { opacity: 0.6 }]}
      />
    </View>
  );
}

export function UploadRow({
  file,
  doc,
  disabled,
  onPick,
  label,
}: {
  file: UploadFile | null;
  doc?: { url?: string; status?: string };
  disabled?: boolean;
  onPick: () => void;
  label?: string;
}) {
  return (
    <Pressable onPress={onPick} disabled={disabled}>
      <View style={[styles.uploadRow, disabled && { opacity: 0.5 }]}>
        {file?.uri || doc?.url ? (
          <Image
            source={{ uri: file?.uri || doc?.url }}
            style={styles.thumb}
          />
        ) : (
          <View style={styles.thumbEmpty}>
            <Upload color={authTheme.textMuted} size={16} />
          </View>
        )}
        <Text style={styles.uploadLabel}>
          {file
            ? file.fileName
            : label ||
              (doc?.url ? 'Replace document photo' : 'Add document photo')}
        </Text>
      </View>
    </Pressable>
  );
}

export function BusyRow({ busy }: { busy: boolean }) {
  if (!busy) return null;
  return <ActivityIndicator color={authTheme.brand} style={{ marginTop: 8 }} />;
}

const styles = StyleSheet.create({
  trackCell: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: authTheme.cardBorder,
    padding: 10,
  },
  trackLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: authTheme.textMuted,
  },
  trackValue: {
    marginTop: 4,
    fontFamily: fonts.bold,
    fontSize: 13,
    color: authTheme.text,
  },
  trackValueLive: { color: '#15803D' },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  stepBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: authTheme.cardBorder,
  },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIconDone: { backgroundColor: '#DCFCE7' },
  stepIconTodo: { backgroundColor: '#F1F5F9' },
  stepTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: authTheme.text,
  },
  stepMeta: {
    marginTop: 2,
    fontFamily: fonts.medium,
    fontSize: 12,
    color: authTheme.textMuted,
    lineHeight: 16,
  },
  miniChip: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  miniChipText: { fontFamily: fonts.bold, fontSize: 10 },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: authTheme.cardBorder,
    padding: 14,
    gap: 10,
  },
  formTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: authTheme.text,
  },
  formHint: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: authTheme.textMuted,
    lineHeight: 17,
  },
  masked: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: authTheme.brand,
  },
  statusBanner: {
    borderRadius: 12,
    padding: 10,
    gap: 4,
  },
  statusBannerText: { fontFamily: fonts.bold, fontSize: 13 },
  rejectReason: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: '#991B1B',
    lineHeight: 16,
  },
  lockHint: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: '#166534',
  },
  fieldLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: authTheme.textMuted,
  },
  input: {
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: authTheme.text,
    backgroundColor: '#FFFFFF',
  },
  uploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
    borderRadius: 12,
    padding: 10,
    backgroundColor: '#F8FAFC',
  },
  thumb: { width: 44, height: 44, borderRadius: 10 },
  thumbEmpty: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadLabel: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: authTheme.text,
  },
});
