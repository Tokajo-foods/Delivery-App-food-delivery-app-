import { X } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, Switch, Text, View } from 'react-native';

import { FoodCategoryPicker } from '@/components/menu/item-form/FoodCategoryPicker';
import { ItemEditTools } from '@/components/menu/item-form/ItemEditTools';
import { ItemPhotoField } from '@/components/menu/item-form/ItemPhotoField';
import { ItemSectionDropdown } from '@/components/menu/item-form/ItemSectionDropdown';
import {
  SPICE_OPTIONS,
  type ItemFormPayload,
  type ItemModalState,
  type ItemPhotoFile,
} from '@/components/menu/item-form/item-form-types';
import { useItemForm } from '@/components/menu/item-form/use-item-form';
import { VegMark } from '@/components/menu/MenuExtras';
import { Field } from '@/components/menu/MenuField';
import { menuModalStyles as styles } from '@/components/menu/menu-modal-styles';
import { authTheme } from '@/constants/auth-theme';
import { getApiErrorMessage } from '@/lib/errors';
import { useMenuItem } from '@/lib/restaurant/menu-hooks';
import type { MenuCategory, MenuItem } from '@/lib/restaurant/types';

export function ItemFormModal({
  state,
  restaurantId,
  categories,
  onClose,
  onSubmit,
  onVariants,
  onTimed86,
  onDuplicate,
  onDelete,
  onUploadPhoto,
  onRemovePhoto,
}: {
  state: ItemModalState;
  restaurantId: string;
  categories: MenuCategory[];
  onClose: () => void;
  onSubmit: (payload: ItemFormPayload) => Promise<void>;
  onVariants?: (item: MenuItem) => void;
  onTimed86?: (item: MenuItem) => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onUploadPhoto?: (file: ItemPhotoFile) => Promise<void>;
  onRemovePhoto?: () => Promise<void>;
}) {
  const editId = state?.mode === 'edit' ? state.item.id : null;
  const itemQuery = useMenuItem(restaurantId, editId);
  const liveItem = state?.mode === 'edit' ? (itemQuery.data ?? state.item) : null;
  const form = useItemForm({
    state,
    categories,
    fetchedItem: itemQuery.data,
    fetched: itemQuery.isFetched,
  });
  const [saving, setSaving] = useState(false);

  const onPhotoPicked = async (file: ItemPhotoFile) => {
    if (!liveItem || !onUploadPhoto) {
      form.setPendingImage(file);
      return;
    }
    setSaving(true);
    try {
      await onUploadPhoto(file);
    } catch (error) {
      Alert.alert('Upload failed', getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const submit = () => {
    const payload = form.buildPayload();
    if (!payload) return;
    setSaving(true);
    void onSubmit(payload).finally(() => setSaving(false));
  };

  return (
    <Modal visible={Boolean(state)} animationType="slide" transparent>
      <View style={styles.modalBackdrop}>
        <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{liveItem ? 'Edit dish' : 'Add dish'}</Text>
              <Pressable onPress={onClose}>
                <X color={authTheme.textMuted} size={20} />
              </Pressable>
            </View>

            {liveItem && itemQuery.isError ? (
              <Text style={styles.previewErrorText}>
                {getApiErrorMessage(itemQuery.error, 'Could not load this dish')}
              </Text>
            ) : null}
            {liveItem && itemQuery.isFetching && !itemQuery.data ? (
              <ActivityIndicator color={authTheme.brand} style={{ marginBottom: 12 }} />
            ) : null}

            <ItemPhotoField
              photoUri={form.pendingImage?.uri || liveItem?.imageUrl}
              disabled={saving}
              onPicked={(file) => void onPhotoPicked(file)}
              onRemove={liveItem?.imageUrl ? onRemovePhoto : undefined}
            />

            <Text style={styles.fieldLabel}>Veg / Non-veg</Text>
            <View style={styles.vegPickRow}>
              <Pressable
                style={[styles.vegPick, form.isVeg && styles.vegPickOn]}
                onPress={() => form.setIsVeg(true)}
              >
                <VegMark veg />
                <Text style={styles.vegPickText}>Veg</Text>
              </Pressable>
              <Pressable
                style={[styles.vegPick, !form.isVeg && styles.vegPickNon]}
                onPress={() => form.setIsVeg(false)}
              >
                <VegMark veg={false} />
                <Text style={styles.vegPickText}>Non-veg</Text>
              </Pressable>
            </View>

            <ItemSectionDropdown
              editable={form.isCreate}
              categories={categories}
              value={form.categoryId}
              fallbackName={state?.mode === 'edit' ? state.item.categoryName : undefined}
              onChange={form.setCategoryId}
            />
            <FoodCategoryPicker
              value={form.foodType}
              onChange={form.setFoodType}
              required={form.isCreate}
            />

            <Field label="Item Name" required value={form.name} onChangeText={form.setName} placeholder="e.g., Margherita Pizza" />
            <Field label="Description" value={form.description} onChangeText={form.setDescription} placeholder="Describe this item" multiline />
            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <Field label="Price (₹)" required value={form.price} onChangeText={form.setPrice} placeholder="299" keyboardType="decimal-pad" />
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <Field label="Offer price (₹)" value={form.discountPrice} onChangeText={form.setDiscountPrice} placeholder="Optional" keyboardType="decimal-pad" />
              </View>
            </View>

            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>In stock</Text>
                <Text style={styles.fieldHint}>Off 86’s this dish. Use the clock for a timed sold-out.</Text>
              </View>
              <Switch
                value={form.isAvailable}
                onValueChange={form.setIsAvailable}
                trackColor={{ true: '#BBF7D0', false: '#FECACA' }}
                thumbColor={form.isAvailable ? '#15803D' : '#B91C1C'}
              />
            </View>
            {liveItem ? (
              <ItemEditTools
                item={liveItem}
                isAvailable={form.isAvailable}
                onTimed86={onTimed86}
                onVariants={onVariants}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
              />
            ) : null}

            <Text style={styles.fieldLabel}>Spice Level</Text>
            <View style={styles.spiceRow}>
              {SPICE_OPTIONS.map((option) => {
                const on = form.spiceLevel === option;
                return (
                  <Pressable key={option} style={[styles.spiceChip, on && styles.spiceChipOn]} onPress={() => form.setSpiceLevel(option)}>
                    <Text style={[styles.spiceChipText, on && styles.spiceChipTextOn]}>{option}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Field label="Tags (comma-separated)" value={form.tags} onChangeText={form.setTags} placeholder="bestseller, cheese" />

            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancel} onPress={onClose}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalPrimary} disabled={saving || !form.canSubmit} onPress={submit}>
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalPrimaryText}>{liveItem ? 'Save dish' : 'Add dish'}</Text>
                )}
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
