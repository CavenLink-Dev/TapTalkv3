import React, { useEffect, useState } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { seedSymbolBrainDatabase } from '../data/sqlite/seedSymbolBrain';
import { attributionService } from '../features/symbol-brain/attributionService';
import { AttributionRecord } from '../features/symbol-brain/types';
import { useTheme } from '../theme/useTheme';
import { fonts } from '../theme/fonts';
import { radii, spacing, typography } from '../theme/tokens';
import { hapticSelection } from '../utils/haptics';

const MULBERRY_LICENCE_URL = 'https://creativecommons.org/licenses/by-sa/4.0/';

export function SymbolAttributionScreen() {
  const router = useRouter();
  const t = useTheme();
  const [rows, setRows] = useState<AttributionRecord[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      await seedSymbolBrainDatabase();
      const next = await attributionService.getSummary();
      if (!cancelled) setRows(next);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const openUrl = (url: string) => {
    hapticSelection();
    Linking.openURL(url).catch(() => {});
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: t.colors.surface, borderBottomColor: t.colors.border }]}>
        <Pressable
          onPress={() => {
            hapticSelection();
            router.back();
          }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={26} color={t.colors.primary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: t.colors.text }]}>Symbol Licences</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        bounces
        alwaysBounceVertical
        overScrollMode="always"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.intro, { color: t.colors.textMuted }]}>
          TapTalk uses Mulberry Symbols under the Creative Commons Attribution-ShareAlike 4.0
          licence (CC BY-SA 4.0). Attribution records are stored on this device with the symbol
          library.
        </Text>

        <View style={[styles.card, { backgroundColor: t.colors.surface, borderColor: t.colors.border }]}>
          <Text style={[styles.source, { color: t.colors.text }]}>Mulberry Symbols</Text>
          <Text style={[styles.body, { color: t.colors.text }]}>
            Copyright Garry Paxton and Steve Lee. Shared under CC BY-SA 4.0 — you may use and adapt
            these symbols if you credit the authors and share under the same licence.
          </Text>
          <Text style={[styles.meta, { color: t.colors.textMuted }]}>Licence: CC BY-SA 4.0</Text>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Open Creative Commons BY-SA 4.0 licence page"
            accessibilityHint="Opens in Safari"
            onPress={() => openUrl(MULBERRY_LICENCE_URL)}
            style={styles.linkRow}
          >
            <Text style={[styles.link, { color: t.colors.primaryDark }]}>
              creativecommons.org/licenses/by-sa/4.0
            </Text>
            <Ionicons name="open-outline" size={16} color={t.colors.primaryDark} />
          </Pressable>
        </View>

        {rows.length > 0 ? (
          <>
            <Text style={[styles.sectionEyebrow, { color: t.colors.textTertiary }]}>
              RECORDS ON THIS DEVICE
            </Text>
            {rows.map((row) => (
              <View
                key={row.id}
                style={[styles.card, { backgroundColor: t.colors.surface, borderColor: t.colors.border }]}
              >
                <Text style={[styles.source, { color: t.colors.text }]}>{row.source}</Text>
                <Text style={[styles.body, { color: t.colors.text }]}>{row.attribution_text}</Text>
                <Text style={[styles.meta, { color: t.colors.textMuted }]}>Author: {row.author}</Text>
                <Text style={[styles.meta, { color: t.colors.textMuted }]}>Licence: {row.license}</Text>
                {row.source_url ? (
                  <Pressable
                    accessibilityRole="link"
                    accessibilityLabel={`Open source page for ${row.source}`}
                    onPress={() => openUrl(row.source_url!)}
                    style={styles.linkRow}
                  >
                    <Text style={[styles.link, { color: t.colors.primaryDark }]} numberOfLines={2}>
                      {row.source_url}
                    </Text>
                    <Ionicons name="open-outline" size={16} color={t.colors.primaryDark} />
                  </Pressable>
                ) : null}
              </View>
            ))}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.displayHeavy,
    fontSize: typography.body,
    letterSpacing: -0.2,
  },
  headerSpacer: {
    width: 44,
  },
  screen: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 36,
  },
  intro: {
    fontFamily: fonts.body,
    fontSize: typography.callout,
    lineHeight: 21,
    marginBottom: spacing.lg,
  },
  sectionEyebrow: {
    fontFamily: fonts.bodyHeavy,
    fontSize: typography.caption,
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  card: {
    borderRadius: radii.card,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  source: {
    fontFamily: fonts.displayHeavy,
    fontSize: typography.subheading,
  },
  body: {
    marginTop: spacing.sm,
    fontFamily: fonts.body,
    fontSize: typography.body,
    lineHeight: 22,
  },
  meta: {
    marginTop: spacing.sm,
    fontFamily: fonts.body,
    fontSize: typography.callout,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    minHeight: 44,
  },
  link: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: typography.caption,
  },
});
