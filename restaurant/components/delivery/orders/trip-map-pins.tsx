import { Bike, Store, User } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

export function RiderMapPin() {
  return (
    <View collapsable={false} style={styles.riderHit}>
      <View style={styles.rider}>
        <Bike color="#FFFFFF" size={16} strokeWidth={2.4} />
      </View>
    </View>
  );
}

export function PlaceMapPin({ kind }: { kind: 'restaurant' | 'customer' }) {
  const Icon = kind === 'restaurant' ? Store : User;
  return (
    <View style={styles.placeWrap}>
      <View style={styles.place}>
        <Icon color="#FFFFFF" size={16} strokeWidth={2.4} />
      </View>
      <View style={styles.tail} />
    </View>
  );
}

const styles = StyleSheet.create({
  riderHit: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rider: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0F172A',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeWrap: {
    alignItems: 'center',
  },
  place: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EA4B14',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tail: {
    width: 10,
    height: 10,
    marginTop: -6,
    backgroundColor: '#EA4B14',
    transform: [{ rotate: '45deg' }],
    borderRightWidth: 3,
    borderBottomWidth: 3,
    borderColor: '#FFFFFF',
  },
});
