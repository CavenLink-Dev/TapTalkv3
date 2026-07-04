/**
 * SymbolPackPickerModal — replaces one-symbol-at-a-time add with curated
 * preset pack installation from the Talk Board Symbol action.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MulberrySymbol } from '../symbols/MulberrySymbol';
import { ThemedText } from '../native/ThemedText';
import { useTheme } from '../../theme/useTheme';
import { radii, spacing, typography } from '../../theme/tokens';
import { fonts } from '../../theme/fonts';
import { hapticSelection } from '../../utils/haptics';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import {
  PRESET_SYMBOL_PACKS,
  PresetSymbolPack,
  presetPackStats,
} from '../../features/board/presetSymbolPacks';

interface Props {
  visible: boolean;
  installedPackIds: string[];
  onDismiss: () => void;
  onAddPack: (pack: PresetSymbolPack) => void;
}

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

export function SymbolPackPickerModal({
  visible,
  installedPackIds,
  onDismiss,
  onAddPack,
}: Props) {
  const t = useTheme();
  const reduceMotion = useReduceMotion();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('All');
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setQuery('');
      setCategory('All');
      setSelectedPackId(null);
    }
  }, [visible]);

  const installedSet = useMemo(
    () => new Set(installedPackIds),
    [installedPackIds],
  );

  const categories = useMemo(() => {
    const values = Array.from(new Set(PRESET_SYMBOL_PACKS.map(pack => pack.category))).sort();
    return ['All', ...values];
  }, []);

  const filteredPacks = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return PRESET_SYMBOL_PACKS.filter(pack => {
      const categoryMatch = category === 'All' || pack.category === category;
      const queryMatch =
        needle.length === 0 ||
        pack.title.toLowerCase().includes(needle) ||
        pack.summary.toLowerCase().includes(needle) ||
        pack.category.toLowerCase().includes(needle);
      return categoryMatch && queryMatch;
    });
  }, [category, query]);

  const selectedPack = useMemo(
    () => PRESET_SYMBOL_PACKS.find(pack => pack.id === selectedPackId) ?? null,
    [selectedPackId],
  );

  const selectedStats = selectedPack ? presetPackStats(selectedPack) : null;
  const canAdd = selectedPack != null && !installedSet.has(selectedPack.id);

  const handleSelectPack = (pack: PresetSymbolPack) => {
    hapticSelection();
    setSelectedPackId(pack.id);
  };

  const handleAdd = () => {
    if (!selectedPack || installedSet.has(selectedPack.id)) return;
    hapticSelection();
    onAddPack(selectedPack);
  };

  return (
    <Modal
      visible={visible}
      animationType={reduceMotion ? 'fade' : 'slide'}
      presentationStyle="formSheet"
      onRequestClose={onDismiss}
    >
      <KeyboardAvoidingView
        behavior="padding"
        style={[styles.container, { backgroundColor: t.colors.background, paddingBottom: insets.bottom }]}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            onPress={onDismiss}
            hitSlop={12}
            style={({ pressed }) => [styles.headerButton, pressed && { opacity: 0.6 }]}
          >
            <ThemedText variant="body" color={t.colors.primary} style={styles.headerButtonText}>
              Cancel
            </ThemedText>
          </Pressable>
          <ThemedText variant="heading" color={t.colors.text} style={styles.title}>
            Symbol Pack
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={selectedPack ? `Add ${selectedPack.title}` : 'Add symbol pack'}
            accessibilityState={{ disabled: !canAdd }}
            onPress={handleAdd}
            disabled={!canAdd}
            hitSlop={12}
            style={({ pressed }) => [styles.headerButton, pressed && canAdd && { opacity: 0.6 }]}
          >
            <ThemedText
              variant="body"
              color={canAdd ? t.colors.primary : t.colors.disabled}
              style={[styles.headerButtonText, styles.headerButtonRight]}
            >
              Add
            </ThemedText>
          </Pressable>
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
          bounces
          alwaysBounceVertical
          overScrollMode="always"
        >
          <View style={[styles.searchWrap, { backgroundColor: t.colors.inputBg }]}>
            <Ionicons name="search" size={20} color={t.colors.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: t.colors.text }]}
              value={query}
              onChangeText={setQuery}
              placeholder="e.g. food, health, transport"
              placeholderTextColor={t.colors.textTertiary}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              accessibilityLabel="Search symbol packs"
            />
            {query.length > 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Clear search"
                onPress={() => setQuery('')}
                hitSlop={12}
              >
                <Ionicons name="close-circle" size={20} color={t.colors.textMuted} />
              </Pressable>
            ) : null}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryRow}
            bounces
            alwaysBounceHorizontal
            overScrollMode="always"
            accessibilityLabel="Symbol pack categories"
          >
            {categories.map(cat => {
              const active = cat === category;
              return (
                <Pressable
                  key={cat}
                  accessibilityRole="button"
                  accessibilityLabel={`Show ${cat} packs`}
                  accessibilityState={{ selected: active }}
                  onPress={() => {
                    hapticSelection();
                    setCategory(cat);
                  }}
                  style={({ pressed }) => [
                    styles.categoryChip,
                    {
                      backgroundColor: active ? t.colors.primary : t.colors.surface,
                    },
                    pressed && { opacity: 0.72 },
                  ]}
                >
                  <ThemedText
                    variant="caption"
                    color={active ? t.colors.textOnDark : t.colors.textMuted}
                    style={styles.categoryText}
                  >
                    {cat}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>

          {selectedPack && selectedStats ? (
            <View
              accessible
              accessibilityLabel={`${selectedPack.title} preview, ${plural(selectedStats.symbols, 'symbol')}, ${plural(selectedStats.folders, 'folder')}`}
              style={[styles.preview, { backgroundColor: t.colors.surface }]}
            >
              <View style={styles.previewTop}>
                <View style={[styles.previewIcon, { backgroundColor: selectedPack.color + '22' }]}>
                  <MulberrySymbol symbolId={selectedPack.iconId} size={42} />
                </View>
                <View style={styles.previewText}>
                  <ThemedText variant="subheading" color={t.colors.text} style={styles.previewTitle}>
                    {selectedPack.title}
                  </ThemedText>
                  <ThemedText variant="callout" color={t.colors.textMuted}>
                    Adds one Home folder with nested boards.
                  </ThemedText>
                </View>
                {installedSet.has(selectedPack.id) ? (
                  <View style={[styles.addedPill, { backgroundColor: t.colors.selectionBg }]}>
                    <ThemedText variant="caption" color={t.colors.primary} style={styles.addedText}>
                      Added
                    </ThemedText>
                  </View>
                ) : null}
              </View>
              <View style={styles.statRow}>
                <ThemedText variant="caption" color={t.colors.textMuted} style={styles.statText}>
                  {plural(selectedStats.symbols, 'symbol')}
                </ThemedText>
                <ThemedText variant="caption" color={t.colors.textMuted} style={styles.statText}>
                  {plural(selectedStats.folders, 'folder')}
                </ThemedText>
              </View>
              <View style={styles.pathList}>
                {selectedStats.samplePaths.map(path => (
                  <View key={path} style={[styles.pathPill, { backgroundColor: t.colors.inputBg }]}>
                    <ThemedText variant="caption" color={t.colors.text} numberOfLines={1}>
                      {path}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={[styles.emptyPreview, { backgroundColor: t.colors.surface }]}>
              <ThemedText variant="callout" color={t.colors.textMuted} style={styles.emptyPreviewText}>
                Choose a pack to preview what will be added.
              </ThemedText>
            </View>
          )}

          <ThemedText variant="eyebrow" color={t.colors.textTertiary} style={styles.sectionEyebrow}>
            SYMBOL PACKS
          </ThemedText>

          {filteredPacks.map(pack => {
            const stats = presetPackStats(pack);
            const selected = selectedPackId === pack.id;
            const installed = installedSet.has(pack.id);
            return (
              <Pressable
                key={pack.id}
                accessibilityRole="button"
                accessibilityLabel={`${pack.title}, ${plural(stats.symbols, 'symbol')}, ${plural(stats.folders, 'folder')}`}
                accessibilityHint="Selects this pack for preview before adding"
                accessibilityState={{ selected, disabled: installed }}
                onPress={() => handleSelectPack(pack)}
                style={({ pressed }) => [
                  styles.packRow,
                  {
                    backgroundColor: selected ? t.colors.selectionBg : t.colors.surface,
                  },
                  pressed && { opacity: 0.76 },
                ]}
              >
                <View style={[styles.packIcon, { backgroundColor: pack.color + '1F' }]}>
                  <MulberrySymbol symbolId={pack.iconId} size={38} />
                </View>
                <View style={styles.packText}>
                  <ThemedText variant="subheading" color={t.colors.text} numberOfLines={1} style={styles.packTitle}>
                    {pack.title}
                  </ThemedText>
                  <ThemedText variant="body" color={t.colors.textMuted} numberOfLines={1}>
                    {plural(stats.symbols, 'symbol')}, {plural(stats.folders, 'folder')}
                  </ThemedText>
                </View>
                {installed ? (
                  <Ionicons name="checkmark-circle" size={24} color={t.colors.primary} />
                ) : (
                  <Ionicons name="chevron-forward" size={22} color={t.colors.textTertiary} />
                )}
              </Pressable>
            );
          })}

          {filteredPacks.length === 0 ? (
            <View style={[styles.empty, { backgroundColor: t.colors.surface }]}>
              <ThemedText variant="body" color={t.colors.text} style={styles.emptyTitle}>
                No packs found
              </ThemedText>
              <ThemedText variant="callout" color={t.colors.textMuted}>
                Try another search or category.
              </ThemedText>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  headerButton: {
    minWidth: 72,
    minHeight: 44,
    justifyContent: 'center',
  },
  headerButtonText: {
    fontFamily: fonts.displayBold,
  },
  headerButtonRight: {
    textAlign: 'right',
  },
  title: {
    flex: 1,
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  searchWrap: {
    minHeight: 56,
    borderRadius: radii.input,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    minHeight: 44,
    fontFamily: fonts.body,
    fontSize: typography.body,
  },
  categoryRow: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  categoryChip: {
    minHeight: 44,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  categoryText: {
    fontFamily: fonts.displayBold,
  },
  preview: {
    borderRadius: radii.card,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  previewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  previewIcon: {
    width: 56,
    height: 56,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewText: {
    flex: 1,
  },
  previewTitle: {
    fontFamily: fonts.displayHeavy,
  },
  addedPill: {
    minHeight: 32,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addedText: {
    fontFamily: fonts.displayBold,
  },
  statRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  statText: {
    fontFamily: fonts.displayBold,
  },
  pathList: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  pathPill: {
    minHeight: 36,
    borderRadius: radii.button,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  emptyPreview: {
    minHeight: 72,
    borderRadius: radii.card,
    padding: spacing.md,
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyPreviewText: {
    textAlign: 'center',
  },
  sectionEyebrow: {
    marginBottom: spacing.sm,
  },
  packRow: {
    minHeight: 86,
    borderRadius: radii.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  packIcon: {
    width: 56,
    height: 56,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  packText: {
    flex: 1,
    gap: 2,
  },
  packTitle: {
    fontFamily: fonts.displayHeavy,
  },
  empty: {
    borderRadius: radii.card,
    padding: spacing.lg,
    gap: spacing.xs,
    alignItems: 'center',
  },
  emptyTitle: {
    fontFamily: fonts.displayBold,
  },
});

