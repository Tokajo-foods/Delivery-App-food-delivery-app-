import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { MORE_FEATURES } from '@/components/delivery/home/home-features';
import { styles } from '@/components/delivery/home/home-screen-styles';

export function HomeServicesGrid() {
  const router = useRouter();

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Services</Text>
      <View style={styles.serviceGrid}>
        {MORE_FEATURES.map((item, index) => {
          const Icon = item.icon;
          const showDivider = index % 4 !== 3;
          return (
            <View key={item.key} style={styles.serviceSlot}>
              {showDivider ? <View style={styles.serviceDivider} /> : null}
              <Pressable
                onPress={() => router.push(item.href)}
                style={styles.moreCard}
              >
                <View style={styles.moreIcon}>
                  <Icon color="#EA4B14" size={20} strokeWidth={1.8} />
                </View>
                <Text style={styles.moreLabel} numberOfLines={2}>
                  {item.label}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}
