import { Check, Plus } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { CategoryAddonEditor } from '@/components/menu/CategoryAddonEditor';
import type { ItemAddonDraft } from '@/components/menu/item-form/item-form-types';
import { menuModalStyles as styles } from '@/components/menu/menu-modal-styles';
import { authTheme } from '@/constants/auth-theme';
import { getApiErrorMessage } from '@/lib/errors';
import { useModifierGroups } from '@/lib/restaurant/menu-hooks';
import type { MenuCategory, ModifierGroup } from '@/lib/restaurant/types';

export function ItemAddonsSection({
  restaurantId,
  kitchenCategory,
  foodLabel,
  selectedIds,
  attached,
  drafts,
  disabled,
  onToggle,
  onDraftsChange,
}: {
  restaurantId: string;
  kitchenCategory: MenuCategory | null;
  foodLabel: string;
  selectedIds: string[];
  attached: ModifierGroup[];
  drafts: ItemAddonDraft[];
  disabled: boolean;
  onToggle: (groupId: string, on: boolean) => void;
  onDraftsChange: (next: ItemAddonDraft[]) => void;
}) {
  const query = useModifierGroups(
    restaurantId,
    kitchenCategory?.id,
    Boolean(kitchenCategory?.id)
  );
  const [adding, setAdding] = useState(false);
  const selected = new Set(selectedIds);

  const groups = useMemo(() => {
    const byId = new Map<string, ModifierGroup>();
    for (const row of query.data ?? []) {
      if (row.id) byId.set(row.id, row);
    }
    for (const row of attached) {
      if (row.id && !byId.has(row.id)) byId.set(row.id, row);
    }
    return [...byId.values()];
  }, [query.data, attached]);

  if (!foodLabel.trim()) {
    return (
      <View style={{ marginBottom: 12 }}>
        <Text style={styles.fieldLabel}>Add-ons</Text>
        <Text style={styles.fieldHint}>
          Pick a food category first. You will see add-ons for that type only.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ marginBottom: 8 }}>
      <Text style={styles.fieldLabel}>Add-ons · {foodLabel}</Text>
      <Text style={styles.fieldHint}>
        Tick what customers should choose on this dish. Create a new add-on if
        this item needs something extra.
      </Text>

      {!kitchenCategory ? (
        <Text style={styles.fieldHint}>
          New add-ons are saved with the dish. Existing {foodLabel} add-ons
          appear after this category is used once.
        </Text>
      ) : query.isLoading ? (
        <ActivityIndicator color={authTheme.brand} style={{ marginVertical: 8 }} />
      ) : query.isError ? (
        <Text style={styles.previewErrorText}>
          {getApiErrorMessage(query.error, 'Could not load add-ons')}
        </Text>
      ) : null}

      {groups.map((group) => {
        const on = selected.has(group.id);
        const optionPreview = group.options
          .map((o) => o.name)
          .filter(Boolean)
          .slice(0, 4)
          .join(', ');
        return (
          <Pressable
            key={group.id}
            style={[styles.vegPick, on && styles.vegPickOn, { marginBottom: 8 }]}
            disabled={disabled}
            onPress={() => onToggle(group.id, !on)}
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 6,
                borderWidth: 1.5,
                borderColor: on ? authTheme.brand : '#CBD5E1',
                backgroundColor: on ? authTheme.brand : '#FFF',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {on ? <Check color="#FFF" size={13} strokeWidth={3} /> : null}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.vegPickText}>
                {group.name}
                {group.isRequired ? ' · required' : ''}
              </Text>
              {optionPreview ? (
                <Text style={styles.fieldHint} numberOfLines={1}>
                  {optionPreview}
                </Text>
              ) : null}
            </View>
          </Pressable>
        );
      })}

      {drafts.map((draft, index) => (
        <View key={`draft-${index}`} style={[styles.vegPick, styles.vegPickOn, { marginBottom: 8 }]}>
          <Check color={authTheme.brand} size={16} />
          <View style={{ flex: 1 }}>
            <Text style={styles.vegPickText}>{draft.name} · new for this dish</Text>
            <Text style={styles.fieldHint} numberOfLines={1}>
              {draft.options.map((o) => o.name).join(', ')}
            </Text>
          </View>
          <Pressable
            onPress={() => onDraftsChange(drafts.filter((_, i) => i !== index))}
            disabled={disabled}
          >
            <Text style={styles.modalCancelText}>Remove</Text>
          </Pressable>
        </View>
      ))}

      {adding ? (
        <CategoryAddonEditor
          restaurantId={restaurantId}
          category={kitchenCategory ?? { id: 'pending', name: foodLabel }}
          editing={null}
          persist={Boolean(kitchenCategory?.id)}
          onCancel={() => setAdding(false)}
          onSaved={(group) => {
            setAdding(false);
            if (group.id) {
              onToggle(group.id, true);
              void query.refetch();
              return;
            }
            onDraftsChange([
              ...drafts,
              {
                name: group.name,
                isRequired: group.isRequired,
                maxSelect: group.maxSelect,
                options: group.options.map((o) => ({
                  name: o.name,
                  price: o.price,
                })),
              },
            ]);
          }}
        />
      ) : (
        <Pressable
          style={styles.variantBtn}
          disabled={disabled}
          onPress={() => setAdding(true)}
        >
          <Plus color={authTheme.brand} size={16} />
          <Text style={styles.variantBtnText}>New add-on for this dish</Text>
        </Pressable>
      )}
    </View>
  );
}
