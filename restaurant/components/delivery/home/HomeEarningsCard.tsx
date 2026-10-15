import { LinearGradient } from 'expo-linear-gradient';
import { Image, Pressable, Text, View } from 'react-native';

import { styles } from '@/components/delivery/home/home-screen-styles';
import { formatCurrency } from '@/lib/delivery-partner/analytics-api';

type Props = {
  amount: number;
  currency: string;
  isOnline: boolean;
  streak: number;
  onPress: () => void;
};

export function HomeEarningsCard({
  amount,
  currency,
  isOnline,
  streak,
  onPress,
}: Props) {
  return (
    <Pressable onPress={onPress} style={styles.earnCard}>
      <LinearGradient
        colors={['#FF8A4C', '#EA4B14', '#C9340C']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.earnWash}
      />
      <View style={styles.dhEarnCol}>
        <Text style={styles.dhEarnLabel}>Today's earning</Text>
        <Text style={styles.dhEarnAmount}>
          {formatCurrency(amount, currency)}
        </Text>
        <Text style={styles.earnHook}>
          {!isOnline
            ? 'Go online and grow today’s number'
            : streak > 0
              ? `${streak}-day streak — one more trip keeps it`
              : 'You are live. Each trip adds to this'}
        </Text>
      </View>
      <View style={styles.scooterSlot}>
        <Image
          source={require('../../../public/scooter.png')}
          style={styles.scooterImg}
          resizeMode="contain"
        />
      </View>
    </Pressable>
  );
}
