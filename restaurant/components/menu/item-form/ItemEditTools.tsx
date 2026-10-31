import { Clock3, Copy, Layers, Trash2 } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { menuModalStyles as styles } from '@/components/menu/menu-modal-styles';
import { authTheme } from '@/constants/auth-theme';
import type { MenuItem } from '@/lib/restaurant/types';

/** Sold-out window, customisations, copy and delete — only for a saved dish. */
export function ItemEditTools({
  item,
  isAvailable,
  onTimed86,
  onVariants,
  onDuplicate,
  onDelete,
}: {
  item: MenuItem;
  isAvailable: boolean;
  onTimed86?: (item: MenuItem) => void;
  onVariants?: (item: MenuItem) => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
}) {
  const variantCount = item.modifierGroups?.length ?? 0;
  return (
    <>
      {onTimed86 ? (
        <Pressable style={styles.variantBtn} onPress={() => onTimed86(item)}>
          <Clock3 color={authTheme.brand} size={16} />
          <Text style={styles.variantBtnText}>
            {isAvailable ? 'Mark sold out until…' : 'Sold out · change 86 window'}
          </Text>
        </Pressable>
      ) : null}

      {onVariants ? (
        <Pressable style={styles.variantBtn} onPress={() => onVariants(item)}>
          <Layers color={authTheme.brand} size={16} />
          <Text style={styles.variantBtnText}>
            {variantCount ? `${variantCount} customisation group(s)` : 'Add Size / crust / toppings'}
          </Text>
        </Pressable>
      ) : null}

      {onDuplicate || onDelete ? (
        <View style={styles.dishToolRow}>
          {onDuplicate ? (
            <Pressable style={styles.dishToolBtn} onPress={onDuplicate}>
              <Copy color={authTheme.textMuted} size={15} />
              <Text style={styles.dishToolText}>Copy dish</Text>
            </Pressable>
          ) : null}
          {onDelete ? (
            <Pressable style={styles.dishToolBtn} onPress={onDelete}>
              <Trash2 color="#B91C1C" size={15} />
              <Text style={[styles.dishToolText, { color: '#B91C1C' }]}>Delete</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </>
  );
}
