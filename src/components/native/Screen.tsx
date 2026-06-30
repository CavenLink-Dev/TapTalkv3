import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';

interface ScreenProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  scroll?: boolean;
}

export function Screen({ title, subtitle, children, scroll = true }: ScreenProps) {
  const t = useTheme();

  const content = (
    <>
      {title ? (
        <View style={styles.header}>
          <Text
            style={[
              styles.title,
              {
                color: t.colors.text,
                fontFamily: t.typography.fontFamilyDisplay,
                fontSize: t.typography.heading,
              },
            ]}
            accessibilityRole="header"
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={[
                styles.subtitle,
                {
                  color: t.colors.textMuted,
                  fontFamily: t.typography.fontFamily,
                  fontSize: t.typography.callout,
                  lineHeight: Math.round(t.typography.callout * 1.4),
                },
              ]}
            >
              {subtitle}
            </Text>
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
          // Rubber-band bounce on iOS even when content fits; matching
          // overscroll glow on Android. Gives every screen the same feel.
          bounces
          alwaysBounceVertical
          overScrollMode="always"
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
  title: {
    letterSpacing: -0.4,
  },
});
