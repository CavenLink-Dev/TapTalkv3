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
  backgroundColor?: string;
  subtitleTopSpacing?: number;
  headerBottomSpacing?: number;
  /** Pull-to-refresh — only active when `scroll` is true. */
  refreshing?: boolean;
  onRefresh?: () => void;
}

export function Screen({
  title,
  subtitle,
  children,
  scroll = true,
  backgroundColor,
  subtitleTopSpacing = spacing.sm,
  headerBottomSpacing = spacing.xl,
  refreshing = false,
  onRefresh,
}: ScreenProps) {
  const t = useTheme();
  const resolvedBackgroundColor = backgroundColor ?? t.colors.background;

  const content = (
    <>
      {title ? (
        <View style={[styles.header, { marginBottom: headerBottomSpacing }]}>
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
              style={[styles.subtitle, { marginTop: subtitleTopSpacing }]}
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
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: resolvedBackgroundColor }]}>
      {scroll ? (
        <ScrollView
          style={{ backgroundColor: resolvedBackgroundColor }}
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
        <View style={[styles.staticContent, { backgroundColor: resolvedBackgroundColor }]}>{content}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {},
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
  subtitle: {},
});
