/**
 * Hidden Words — restore AAC tiles hidden in board edit mode.
 *
 * Hiding a tile (edit mode delete badge) records its ID in
 * `state.hiddenTileIds`. Without a way back, a word can silently vanish from
 * someone's vocabulary — a dignity and communication problem. This screen
 * lists every hidden tile with its symbol and label and restores it with one
 * tap (Rule 12/13/26 — reversible, clear result). Calm, iOS-native, tokens.
 */

import React, { useCallback, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../src/components/native/Card';
import { MulberrySymbol } from '../../src/components/symbols/MulberrySymbol';
import { BOARD_TILES } from '../(tabs)/talk';
import { useAppContext } from '../../src/hooks/useAppContext';
import { useTheme } from '../../src/theme/useTheme';
import { radii, spacing, typography } from '../../src/theme/tokens';
import { fonts } from '../../src/theme/fonts';
import { hapticSelection, hapticSuccess } from '../../src/utils/haptics';

type CatalogTile = {
  id: string;
  label: string;
  mulberrySymbolId?: string;
  mulberryName?: string;
};

// Flatten every board into a single id → tile lookup so a hidden ID from any
// board resolves to its symbol + label.
const TILE_LOOKUP: Record<string, CatalogTile> = (() => {
  const map: Record<string, CatalogTile> = {};
  for (const tiles of Object.values(BOARD_TILES)) {
    for (const tile of tiles) {
      map[tile.id] = {
        id: tile.id,
        label: tile.label,
        mulberrySymbolId: tile.mulberrySymbolId,
        mulberryName: tile.mulberryName,
      };
    }
  }
  return map;
})();

function prettifyId(id: string): string {
  const base = id.replace(/^(home|back|emer)-/, '').replace(/-/g, ' ');
  return base.charAt(0).toUpperCase() + base.slice(1);
}

export default function HiddenTilesScreen() {
  const router = useRouter();
  const { state, dispatch } = useAppContext();
  const t = useTheme();

  const hidden = useMemo(
    () =>
      state.hiddenTileIds.map((id) => {
        const tile = TILE_LOOKUP[id];
        return {
          id,
          label: tile?.label ?? prettifyId(id),
          mulberrySymbolId: tile?.mulberrySymbolId,
          mulberryName: tile?.mulberryName,
        };
      }),
    [state.hiddenTileIds],
  );

  const restore = useCallback(
    (id: string) => {
      hapticSuccess();
      dispatch({ type: 'RESTORE_TILE', payload: id });
    },
    [dispatch],
  );

  const restoreAll = useCallback(() => {
    hapticSuccess();
    state.hiddenTileIds.forEach((id) => dispatch({ type: 'RESTORE_TILE', payload: id }));
  }, [dispatch, state.hiddenTileIds]);

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
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={26} color={t.colors.primary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: t.colors.text }]}>Hidden Words</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces
        alwaysBounceVertical
        overScrollMode="always"
      >
        <Text style={[styles.intro, { color: t.colors.textMuted }]}>
          Words you hide from a board appear here. Bring any of them back with one tap — nothing
          is deleted.
        </Text>

        {hidden.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="checkmark-circle-outline" size={40} color={t.colors.success} />
            <Text style={[styles.emptyTitle, { color: t.colors.text }]}>No hidden words</Text>
            <Text style={[styles.emptyDesc, { color: t.colors.textMuted }]}>
              Every word is on its board. If you hide one in edit mode, it will show up here so you
              can restore it.
            </Text>
          </Card>
        ) : (
          <>
            <Card style={styles.listCard}>
              {hidden.map((tile, i) => (
                <View key={tile.id}>
                  <View style={styles.row}>
                    <View style={[styles.symbolWrap, { backgroundColor: t.colors.input }]}>
                      {tile.mulberrySymbolId || tile.mulberryName ? (
                        <MulberrySymbol symbolId={tile.mulberrySymbolId} name={tile.mulberryName} size={34} />
                      ) : (
                        <Ionicons name="apps-outline" size={22} color={t.colors.textTertiary} />
                      )}
                    </View>
                    <Text style={[styles.rowLabel, { color: t.colors.text }]} numberOfLines={1}>
                      {tile.label}
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Restore ${tile.label}`}
                      accessibilityHint="Puts this word back on its board"
                      onPress={() => restore(tile.id)}
                      hitSlop={8}
                      style={({ pressed }) => [
                        styles.restoreBtn,
                        { backgroundColor: t.colors.selectionBg },
                        pressed && { opacity: 0.7 },
                      ]}
                    >
                      <Ionicons name="arrow-undo-outline" size={16} color={t.colors.primary} />
                      <Text style={[styles.restoreLabel, { color: t.colors.primary }]}>Restore</Text>
                    </Pressable>
                  </View>
                  {i < hidden.length - 1 ? (
                    <View style={[styles.divider, { backgroundColor: t.colors.input }]} />
                  ) : null}
                </View>
              ))}
            </Card>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Restore all hidden words"
              onPress={restoreAll}
              style={({ pressed }) => [
                styles.restoreAll,
                { borderColor: t.colors.primary },
                pressed && { opacity: 0.7, backgroundColor: t.colors.selectionBg },
              ]}
            >
              <Text style={[styles.restoreAllLabel, { color: t.colors.primary }]}>
                Restore All ({hidden.length})
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  backButton: { width: 44, height: 44, alignItems: 'flex-start', justifyContent: 'center' },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.displayHeavy,
    fontSize: typography.body,
    letterSpacing: -0.2,
  },
  headerSpacer: { width: 44 },

  content: { padding: spacing.lg, paddingBottom: 40, gap: spacing.lg },
  intro: {
    fontFamily: fonts.body,
    fontSize: typography.callout,
    lineHeight: 21,
  },

  emptyCard: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  emptyTitle: {
    fontFamily: fonts.displayHeavy,
    fontSize: typography.subheading,
  },
  emptyDesc: {
    fontFamily: fonts.body,
    fontSize: typography.callout,
    lineHeight: 21,
    textAlign: 'center',
  },

  listCard: { padding: 0, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 60,
  },
  symbolWrap: {
    width: 48,
    height: 48,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  rowLabel: {
    flex: 1,
    fontFamily: fonts.displayBold,
    fontSize: typography.body,
  },
  restoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
  },
  restoreLabel: {
    fontFamily: fonts.displayBold,
    fontSize: typography.callout,
  },
  divider: { height: 1, marginLeft: 48 + spacing.md + spacing.md },

  restoreAll: {
    minHeight: 52,
    borderRadius: radii.button,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restoreAllLabel: {
    fontFamily: fonts.displayHeavy,
    fontSize: typography.body,
  },
});
