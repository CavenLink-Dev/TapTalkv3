import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/tokens';

/**
 * Talk screen — intentionally blank for now. Only the app background and the
 * bottom tab bar (defined in `app/(tabs)/_layout.tsx`) should be visible.
 * Symbols, folders, message bar and category pills will be re-introduced in a
 * later step.
 */
export default function TalkScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.empty} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  empty: {
    flex: 1,
  },
});
