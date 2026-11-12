import { Image } from 'expo-image';
import {
  MessageSquare,
  MessageSquareQuote,
  Send,
  Star,
  X,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { RestaurantPageHeader } from '@/components/dashboard/RestaurantPageHeader';
import { authTheme, PARTNER_BOTTOM_NAV_INSET } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import {
  useOwnerRestaurantReviews,
  useReviewMutations,
} from '@/lib/review/hooks';
import type { RestaurantReview, ReviewListQuery } from '@/lib/review/types';

type FilterKey = 'all' | 'unanswered' | 1 | 2 | 3 | 4 | 5;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'unanswered', label: 'Unreplied' },
  { key: 5, label: '5★' },
  { key: 4, label: '4★' },
  { key: 3, label: '3★' },
  { key: 2, label: '2★' },
  { key: 1, label: '1★' },
];

function formatDate(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function ratingTone(rating: number): { bg: string; fg: string } {
  if (rating >= 4.5) return { bg: '#16A34A', fg: '#FFFFFF' };
  if (rating >= 3.5) return { bg: '#F59E0B', fg: '#FFFFFF' };
  if (rating >= 2.5) return { bg: '#F97316', fg: '#FFFFFF' };
  return { bg: '#DC2626', fg: '#FFFFFF' };
}

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  const filled = Math.round(value);
  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          color={star <= filled ? '#F59E0B' : '#E2E8F0'}
          fill={star <= filled ? '#F59E0B' : 'transparent'}
        />
      ))}
    </View>
  );
}

function ReviewCard({
  review,
  busy,
  onReply,
}: {
  review: RestaurantReview;
  busy: boolean;
  onReply: () => void;
}) {
  const tone = ratingTone(review.rating);
  const customerName = review.userName?.trim() || 'Customer';
  return (
    <View style={styles.card}>
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {customerName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.cardHeaderMain}>
            <View style={styles.nameRow}>
              <Text style={styles.userName} numberOfLines={1}>
                {customerName}
              </Text>
              {!review.hasReply ? (
                <View style={styles.unrepliedPill}>
                  <Text style={styles.unrepliedText}>Needs reply</Text>
                </View>
              ) : (
                <View style={styles.repliedPill}>
                  <Text style={styles.repliedText}>Replied</Text>
                </View>
              )}
            </View>
            <Text style={styles.date}>{formatDate(review.createdAt)}</Text>
          </View>
          <View style={[styles.ratingChip, { backgroundColor: tone.bg }]}>
            <Star color={tone.fg} fill={tone.fg} size={11} />
            <Text style={[styles.ratingChipText, { color: tone.fg }]}>
              {review.rating > 0 ? review.rating.toFixed(1) : '—'}
            </Text>
          </View>
        </View>

        <View style={styles.conversation}>
          <View style={styles.msgBlockCustomer}>
            <Text style={styles.msgRole}>Customer</Text>
            {review.comment ? (
              <Text style={styles.msgText}>{review.comment}</Text>
            ) : (
              <Text style={styles.msgEmpty}>No written comment — star rating only.</Text>
            )}
            {review.images.length ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.bubblePhotos}
              >
                {review.images.map((uri) => (
                  <Image
                    key={uri}
                    source={{ uri }}
                    style={styles.photo}
                    contentFit="cover"
                  />
                ))}
              </ScrollView>
            ) : null}
          </View>

          <View style={styles.msgDivider} />

          {review.reply?.message ? (
            <View style={styles.msgBlockOwner}>
              <View style={styles.msgOwnerHead}>
                <Text style={styles.msgRoleOwner}>Your public reply</Text>
                {review.reply.repliedAt ? (
                  <Text style={styles.msgMeta}>{formatDate(review.reply.repliedAt)}</Text>
                ) : null}
              </View>
              <Text style={styles.msgText}>{review.reply.message}</Text>
            </View>
          ) : (
            <View style={styles.msgBlockOwnerEmpty}>
              <Text style={styles.msgEmptyOwner}>
                No reply yet. Customers will see your response on your listing.
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.cardActionBar}>
        <Pressable
          onPress={onReply}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={review.hasReply ? 'Edit reply' : 'Reply'}
          style={({ pressed }) => [
            styles.composerShell,
            pressed && styles.pressed,
            busy && styles.disabled,
          ]}
        >
          <MessageSquare color={authTheme.textDim} size={18} />
          <Text style={styles.composerHint} numberOfLines={1}>
            {review.hasReply ? 'Update your public reply…' : 'Write a public reply…'}
          </Text>
        </Pressable>
        <Pressable
          onPress={onReply}
          disabled={busy}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.replyPill,
            pressed && styles.pressed,
            busy && styles.disabled,
          ]}
        >
          <Send color="#FFFFFF" size={16} />
          <Text style={styles.replyPillText}>{review.hasReply ? 'Edit' : 'Reply'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function ReviewsManager() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [replyTarget, setReplyTarget] = useState<RestaurantReview | null>(null);
  const [replyText, setReplyText] = useState('');

  const query: ReviewListQuery = {
    page,
    limit: 20,
    unanswered: filter === 'unanswered' || undefined,
    rating: typeof filter === 'number' ? filter : undefined,
  };

  const reviews = useOwnerRestaurantReviews(query);
  const mutations = useReviewMutations(reviews.restaurantId);

  const list = reviews.data?.reviews ?? [];
  const stats = reviews.data?.meta?.stats;
  const avg = stats?.avgRating ?? 0;
  const total = stats?.totalReviews ?? 0;
  const distribution = stats?.distribution ?? [];
  const maxDist = useMemo(
    () => Math.max(1, ...distribution.map((row) => row.count), 1),
    [distribution]
  );

  const meta = reviews.data?.meta;
  const hasNext =
    meta?.hasNext ??
    (meta?.totalPages != null ? page < meta.totalPages : list.length >= 20);

  const refreshing = reviews.isRefetching;
  const loading = reviews.isLoading && !reviews.data;
  const busy = mutations.reply.isPending;
  const downstreamDown =
    (reviews.error as Error & { code?: string } | null)?.code ===
    'DOWNSTREAM_UNAVAILABLE';

  const setFilterAndReset = (next: FilterKey) => {
    setFilter(next);
    setPage(1);
  };

  const openReply = (review: RestaurantReview) => {
    setReplyTarget(review);
    setReplyText(review.reply?.message ?? '');
  };

  const submitReply = async () => {
    if (!replyTarget) return;
    const message = replyText.trim();
    if (!message) {
      Alert.alert('Reply required', 'Write a short public reply before sending.');
      return;
    }
    try {
      await mutations.reply.mutateAsync({
        reviewId: replyTarget.id,
        payload: { message },
      });
      setReplyTarget(null);
      setReplyText('');
    } catch (error) {
      Alert.alert(
        'Reply failed',
        error instanceof Error ? error.message : 'Could not send reply'
      );
    }
  };

  return (
    <View style={styles.screen}>
      <RestaurantPageHeader
        title="Reviews"
        subtitle={
          reviews.restaurantName
            ? `${reviews.restaurantName} · customer ratings`
            : 'Ratings & customer feedback'
        }
        showBack
        hideProfile
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: PARTNER_BOTTOM_NAV_INSET },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void reviews.refetch()}
            tintColor={authTheme.brand}
            colors={[authTheme.brand]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={authTheme.brand} size="large" />
          </View>
        ) : null}

        {!loading && reviews.isError ? (
          <View style={styles.emptyCard}>
            <Text style={styles.errorTitle}>Couldn’t load reviews</Text>
            <Text style={styles.muted}>
              {reviews.error instanceof Error
                ? reviews.error.message
                : 'Please try again'}
            </Text>
            <Pressable
              style={styles.retry}
              onPress={() => void reviews.refetch()}
            >
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {!loading && !reviews.isError ? (
          <View style={styles.statsCard}>
            <View style={styles.avgBlock}>
              <View style={styles.avgCircle}>
                <Text style={styles.avgValue}>
                  {avg > 0 ? avg.toFixed(1) : '—'}
                </Text>
              </View>
              <Stars value={avg} size={14} />
              <Text style={styles.avgCount}>
                {total > 0
                  ? `${total} rating${total === 1 ? '' : 's'}`
                  : 'No ratings yet'}
              </Text>
            </View>
            <View style={styles.bars}>
              <Text style={styles.barsTitle}>Rating breakdown</Text>
              {([5, 4, 3, 2, 1] as const).map((star) => {
                const bucket = distribution.find((row) => row.stars === star);
                const count = bucket?.count ?? 0;
                const ratio = Math.max(0, Math.min(1, count / maxDist));
                return (
                  <View key={star} style={styles.barRow}>
                    <Text style={styles.barLabel}>{star}★</Text>
                    <View style={styles.barTrack}>
                      <View
                        style={[styles.barFill, { width: `${Math.max(ratio * 100, count > 0 ? 8 : 0)}%` }]}
                      />
                    </View>
                    <Text style={styles.barCount}>{count}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}

        {!loading && !reviews.isError ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {FILTERS.map((item) => {
              const active = item.key === filter;
              return (
                <Pressable
                  key={String(item.key)}
                  onPress={() => setFilterAndReset(item.key)}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                >
                  <Text
                    style={[
                      styles.filterText,
                      active && styles.filterTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        {!loading && !reviews.isError && list.length === 0 ? (
          <View style={styles.empty}>
            <MessageSquareQuote color={authTheme.textDim} size={36} />
            <Text style={styles.emptyTitle}>
              {filter === 'unanswered'
                ? 'You’re all caught up'
                : filter === 'all'
                  ? 'No reviews yet'
                  : `No ${filter}★ reviews`}
            </Text>
            <Text style={styles.muted}>
              {downstreamDown
                ? 'Reviews will appear once the service is back.'
                : 'New customer ratings show up here after delivered orders.'}
            </Text>
          </View>
        ) : null}

        {!loading && !reviews.isError && list.length > 0 ? (
          <Text style={styles.sectionTitle}>Customer reviews</Text>
        ) : null}

        {!loading && !reviews.isError && list.length > 0 ? (
          <View style={styles.list}>
            {list.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                busy={busy}
                onReply={() => openReply(review)}
              />
            ))}
          </View>
        ) : null}

        {!loading && !reviews.isError && (page > 1 || hasNext) ? (
          <View style={styles.pager}>
            <Pressable
              disabled={page <= 1 || reviews.isFetching}
              onPress={() => setPage((p) => Math.max(1, p - 1))}
              style={[styles.pageBtn, page <= 1 && styles.disabled]}
            >
              <Text style={styles.pageBtnText}>Previous</Text>
            </Pressable>
            <Pressable
              disabled={!hasNext || reviews.isFetching}
              onPress={() => setPage((p) => p + 1)}
              style={[styles.pageBtn, !hasNext && styles.disabled]}
            >
              <Text style={styles.pageBtnText}>Next</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      <Modal
        visible={Boolean(replyTarget)}
        transparent
        animationType="fade"
        onRequestClose={() => setReplyTarget(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setReplyTarget(null)}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalKeyboard}
          >
            <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHandle} />
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {replyTarget?.hasReply ? 'Edit reply' : 'Reply to review'}
                </Text>
                <Pressable
                  onPress={() => setReplyTarget(null)}
                  hitSlop={12}
                  style={styles.modalClose}
                >
                  <X color={authTheme.textMuted} size={20} />
                </Pressable>
              </View>

              {replyTarget ? (
                <View style={styles.modalPreview}>
                  <View style={styles.modalPreviewHead}>
                    <Text style={styles.modalPreviewName}>
                      {replyTarget.userName?.trim() || 'Customer'}
                    </Text>
                    <View style={styles.modalPreviewStars}>
                      <Star size={12} color="#F59E0B" fill="#F59E0B" />
                      <Text style={styles.modalPreviewRating}>
                        {replyTarget.rating.toFixed(1)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.modalPreviewBody} numberOfLines={5}>
                    {replyTarget.comment?.trim() ||
                      'No written comment — star rating only.'}
                  </Text>
                </View>
              ) : null}

              <Text style={styles.modalFieldLabel}>Public reply (visible on listing)</Text>
              <TextInput
                value={replyText}
                onChangeText={setReplyText}
                placeholder="Thank the guest or share what you’ll improve…"
                placeholderTextColor={authTheme.textDim}
                multiline
                maxLength={2000}
                style={styles.modalInputPro}
                autoFocus
              />
              <Text style={styles.modalCharCount}>{replyText.length} / 2,000</Text>

              <Pressable
                onPress={() => void submitReply()}
                disabled={mutations.reply.isPending || !replyText.trim()}
                style={[
                  styles.modalPrimaryBtn,
                  (!replyText.trim() || mutations.reply.isPending) && styles.modalPrimaryBtnDim,
                ]}
              >
                {mutations.reply.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalPrimaryBtnText}>
                    {replyTarget?.hasReply ? 'Save changes' : 'Post reply'}
                  </Text>
                )}
              </Pressable>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F5F5' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 12, paddingTop: 10 },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  muted: {
    color: authTheme.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    fontFamily: fonts.medium,
  },
  errorTitle: {
    color: authTheme.text,
    fontSize: 16,
    fontFamily: fonts.bold,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: authTheme.cardBorder,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  retry: {
    marginTop: 8,
    backgroundColor: authTheme.brand,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryText: { color: '#FFFFFF', fontSize: 13, fontFamily: fonts.bold },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: authTheme.cardBorder,
    padding: 16,
    gap: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  avgBlock: { width: 108, alignItems: 'center', gap: 8, justifyContent: 'center' },
  avgCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: authTheme.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(234, 75, 20, 0.12)',
  },
  avgValue: {
    color: authTheme.brand,
    fontSize: 28,
    fontFamily: fonts.extraBold,
  },
  avgCount: {
    color: authTheme.textMuted,
    fontSize: 11,
    fontFamily: fonts.medium,
    textAlign: 'center',
  },
  bars: { flex: 1, gap: 7, justifyContent: 'center' },
  barsTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: authTheme.textDim,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barLabel: {
    width: 26,
    color: authTheme.textMuted,
    fontSize: 10,
    fontFamily: fonts.semiBold,
  },
  barTrack: {
    flex: 1,
    height: 7,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
  },
  barFill: { height: '100%', backgroundColor: '#F59E0B', borderRadius: 4, minWidth: 0 },
  barCount: {
    width: 28,
    textAlign: 'right',
    color: authTheme.textMuted,
    fontSize: 11,
    fontFamily: fonts.medium,
  },
  starsRow: { flexDirection: 'row', gap: 2 },
  filterRow: { gap: 8, paddingRight: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
  },
  filterChipActive: {
    backgroundColor: authTheme.brand,
    borderColor: authTheme.brand,
  },
  filterText: {
    color: authTheme.textMuted,
    fontSize: 12,
    fontFamily: fonts.semiBold,
  },
  filterTextActive: { color: '#FFFFFF' },
  sectionTitle: {
    color: authTheme.text,
    fontSize: 15,
    fontFamily: fonts.bold,
    marginTop: 4,
    marginBottom: -4,
  },
  list: { gap: 12 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: authTheme.cardBorder,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardBody: { padding: 16, gap: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  cardHeaderMain: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  unrepliedPill: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDBA74',
  },
  unrepliedText: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    color: '#C2410C',
    textTransform: 'uppercase',
    letterSpacing: 0.35,
  },
  repliedPill: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  repliedText: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    color: '#15803D',
    textTransform: 'uppercase',
    letterSpacing: 0.35,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: authTheme.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: authTheme.brand, fontFamily: fonts.bold, fontSize: 14 },
  userName: { color: authTheme.text, fontSize: 15, fontFamily: fonts.bold },
  date: { color: authTheme.textMuted, fontSize: 12, fontFamily: fonts.medium },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  ratingChipText: { fontSize: 12, fontFamily: fonts.bold },
  conversation: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
    overflow: 'hidden',
    backgroundColor: '#FAFBFC',
  },
  msgBlockCustomer: {
    padding: 12,
    gap: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  msgBlockOwner: {
    padding: 12,
    gap: 6,
    borderLeftWidth: 3,
    borderLeftColor: authTheme.brand,
    backgroundColor: '#FFFBF9',
  },
  msgBlockOwnerEmpty: {
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  msgDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: authTheme.cardBorder,
  },
  msgRole: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: authTheme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  msgRoleOwner: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: authTheme.brand,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  msgOwnerHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  msgMeta: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: authTheme.textDim,
  },
  msgText: {
    color: authTheme.text,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: fonts.medium,
  },
  msgEmpty: {
    color: authTheme.textDim,
    fontSize: 13,
    fontStyle: 'italic',
    fontFamily: fonts.medium,
  },
  msgEmptyOwner: {
    color: authTheme.textMuted,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.medium,
    textAlign: 'center',
  },
  bubblePhotos: { gap: 8, paddingTop: 6 },
  photo: { width: 68, height: 68, borderRadius: 8, backgroundColor: authTheme.surface },
  cardActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: authTheme.cardBorder,
    backgroundColor: '#FFFFFF',
  },
  composerShell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 46,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  composerHint: {
    flex: 1,
    color: authTheme.textDim,
    fontSize: 14,
    fontFamily: fonts.medium,
  },
  replyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: authTheme.brand,
  },
  replyPillText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: fonts.bold,
  },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.45 },
  empty: { alignItems: 'center', paddingVertical: 36, gap: 8 },
  emptyTitle: { color: authTheme.text, fontSize: 16, fontFamily: fonts.bold },
  pager: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  pageBtn: {
    backgroundColor: authTheme.surface,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  pageBtnText: { color: authTheme.text, fontFamily: fonts.semiBold, fontSize: 13 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'flex-end',
  },
  modalKeyboard: {
    justifyContent: 'flex-end',
    maxHeight: '88%',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 18,
    paddingBottom: 24,
    paddingTop: 8,
    gap: 10,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 4,
  },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  modalTitle: { color: authTheme.text, fontSize: 18, fontFamily: fonts.bold },
  modalPreview: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
    gap: 8,
  },
  modalPreviewHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  modalPreviewName: {
    flex: 1,
    color: authTheme.text,
    fontSize: 14,
    fontFamily: fonts.bold,
  },
  modalPreviewStars: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  modalPreviewRating: {
    color: authTheme.text,
    fontSize: 13,
    fontFamily: fonts.bold,
  },
  modalPreviewBody: {
    color: authTheme.textMuted,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.medium,
  },
  modalFieldLabel: {
    color: authTheme.textMuted,
    fontSize: 12,
    fontFamily: fonts.semiBold,
    marginTop: 4,
  },
  modalInputPro: {
    minHeight: 112,
    maxHeight: 160,
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    textAlignVertical: 'top',
    color: authTheme.text,
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 22,
  },
  modalCharCount: {
    color: authTheme.textDim,
    fontSize: 11,
    fontFamily: fonts.medium,
    textAlign: 'right',
    marginTop: -2,
  },
  modalPrimaryBtn: {
    marginTop: 4,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: authTheme.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryBtnDim: { opacity: 0.5 },
  modalPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: fonts.bold,
  },
});
