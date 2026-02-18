import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';

export default function AdBanner() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom || 12 }]}>
      <View style={styles.divider} />
      <View style={styles.adWrapper}>
        <View style={styles.adPlaceholder}>
          <Text style={styles.adText}>Ad Banner</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    paddingTop: 0,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 12,
  },
  adWrapper: {
    paddingHorizontal: 16,
  },
  adPlaceholder: {
    height: 50,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  adText: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
});
