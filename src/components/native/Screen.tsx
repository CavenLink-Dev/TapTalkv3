import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';
import { ThemedText } from './ThemedText';

interface ScreenProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  scroll?: boolean;
  /** Pull-to-refresh — only active when `scroll` is true. */
  refreshing?: boolean;
  onRefresh?: () => void;
}

export function Screen({
  title,
  subtitle,
  children,
  scroll = true,
  refreshing = false,
  onRefresh,
}: ScreenProps) {
  const t = useTheme();

  const content = (
    <>
      {title ? (
        <View style={styles.header}>
          <ThemedText
            variant="title"
            accessibilityRole="header"
          >
            {title}
          </ThemedText>
          {subtitle ? (
            <ThemedText
              variant="callout"
              color={t.colors.textMuted}
              style={styles.subtitle}
            >
              {subtitle}
            </ThemedText>
          ) : null}
        </View>
      ) : null}
      {children}
    </>
  );

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: t.colors.background }]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces
          alwaysBounceVertical
          overScrollMode="always"
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={t.colors.primary}
                colors={[t.colors.primary]}
              />
            ) : undefined
          }
        >
          {content}
        </ScrollView>
      ) : (
        <View style={styles.staticContent}>{content}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.lg,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 28,
  },
  staticContent: {
    flex: 1,
    padding: spacing.lg,
  },
  subtitle: {
    marginTop: 4,
  },
});
