import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, layout, spacing } from '@/constants/theme';

/**
 * Halaman utama NADI — sementara menampilkan placeholder.
 * Akan diganti dengan home dashboard pada tahap berikutnya.
 */
export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.brandMark}>
          <View style={styles.brandDot} />
        </View>
        <View style={styles.textGroup}>
          <View>
            {/* Using raw Text to avoid dependency on AppText during migration */}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.surfaceSoft,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: layout.screenPadding,
    gap: spacing[6],
  },
  brandMark: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.brand[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.neutral.white,
  },
  textGroup: {
    alignItems: 'center',
    gap: spacing[2],
  },
});
