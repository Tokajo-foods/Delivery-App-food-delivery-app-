import { MessageCircle, Phone } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

type Props = {
  onChat: () => void;
  onCall: () => void;
};

export function StopContactIcons({ onChat, onCall }: Props) {
  return (
    <View style={styles.row}>
      <Pressable onPress={onChat} hitSlop={6} style={styles.hit} accessibilityLabel="Chat">
        <MessageCircle color="#EA4B14" size={16} />
      </Pressable>
      <Pressable onPress={onCall} hitSlop={6} style={styles.hit} accessibilityLabel="Call">
        <Phone color="#EA4B14" size={16} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginRight: 6,
  },
  hit: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
