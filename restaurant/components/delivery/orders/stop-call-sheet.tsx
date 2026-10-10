import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Phone, Video, X } from 'lucide-react-native';

import { fonts } from '@/constants/typography';

type Props = {
  visible: boolean;
  title: string;
  notice?: string | null;
  onClose: () => void;
  onNormal: () => void;
  onInternet: () => void;
};

export function StopCallSheet({
  visible,
  title,
  notice,
  onClose,
  onNormal,
  onInternet,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => undefined}>
          <View style={styles.head}>
            <Text style={styles.title} numberOfLines={2}>
              Call {title}
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <X color="#6B7280" size={18} />
            </Pressable>
          </View>
          {notice ? <Text style={styles.notice}>{notice}</Text> : null}
          <Pressable style={styles.row} onPress={onNormal}>
            <Phone color="#EA4B14" size={18} />
            <Text style={styles.rowText}>Normal call</Text>
          </Pressable>
          <Pressable style={styles.row} onPress={onInternet}>
            <Video color="#EA4B14" size={18} />
            <Text style={styles.rowText}>Internet call</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
    gap: 8,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  title: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 17,
    color: '#1E293B',
  },
  notice: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: '#9A3412',
    lineHeight: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 48,
    paddingHorizontal: 4,
  },
  rowText: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: '#1E293B',
  },
});
