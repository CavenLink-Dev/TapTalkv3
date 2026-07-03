/**
 * PicturePicker — a reusable "Pick A Picture" circle used anywhere the app
 * needs a profile image, folder image, or symbol.
 *
 * Tapping the circle opens a native action sheet — never a preset-only list:
 *   • Upload from Library / Take Photo  (gated until the image picker ships)
 *   • Search Symbol   — full Mulberry search
 *   • Choose Symbol   — quick bundled set
 *   • Choose Colour   — full colour wheel (any colour)
 *   • Use TapTalk Avatar
 *   • Remove Current Picture
 *
 * Value is the same string the app stores in profilePhotoUri (see
 * features/profile/avatar): 'symbol:<id>' | 'color:<hex>' | 'avatar:mascot' |
 * '<uri>' | null. Photo permissions are only ever requested when the user
 * picks that action (privacy rule).
 */

import React, { useCallback, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AvatarView } from '../../features/profile/AvatarView';
import {
  AVATAR_MASCOT_VALUE,
  AVATAR_SYMBOLS,
  encodeColor,
  encodeSymbol,
  hasCustomAvatar,
  parseAvatar,
} from '../../features/profile/avatar';
import { MulberrySymbol } from '../symbols/MulberrySymbol';
import { SymbolSuggestionRow } from '../aac/symbols/SymbolSuggestionRow';
import { ColorPickerSheet } from './ColorPickerSheet';
import { pickFromLibrary, takePhoto, type PickOutcome } from '../../features/profile/pickImage';
import { useTheme } from '../../theme/useTheme';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import { radii, spacing, typography } from '../../theme/tokens';
import { fonts } from '../../theme/fonts';
import { hapticSelection, hapticSuccess } from '../../utils/haptics';

interface PicturePickerProps {
  value: string | null | undefined;
  /** Uppercase initial shown on the fallback avatar. */
  initial: string;
  onChange: (value: string | null) => void;
  size?: number;
  /** Caption under the circle. Defaults to "Pick A Picture". */
  label?: string;
}

export function PicturePicker({ value, initial, onChange, size = 112, label }: PicturePickerProps) {
  const t = useTheme();
  const reduceMotion = useReduceMotion();
  const [symbolGrid, setSymbolGrid] = useState(false);
  const [symbolSearch, setSymbolSearch] = useState(false);
  const [colorSheet, setColorSheet] = useState(false);
  const [query, setQuery] = useState('');

  const avatar = parseAvatar(value);
  const hasPicture = hasCustomAvatar(value);
  const currentColor = avatar.kind === 'color' ? avatar.hex : t.colors.primary;

  const handleOutcome = useCallback(
    (outcome: PickOutcome, source: 'Library' | 'Camera') => {
      switch (outcome.status) {
        case 'picked':
          hapticSuccess();
          onChange(outcome.uri);
          break;
        case 'denied':
          Alert.alert(
            source === 'Camera' ? 'Camera access is off' : 'Photo access is off',
            `TapTalk needs permission to ${source === 'Camera' ? 'take a photo' : 'choose a photo'}. You can turn it on in Settings, or keep using a symbol, colour, or the TapTalk avatar.`,
            [
              { text: 'Open Settings', onPress: () => Linking.openSettings().catch(() => {}) },
              { text: 'Not now', style: 'cancel' },
            ],
          );
          break;
        case 'unavailable':
          Alert.alert(
            'Photos need an app update',
            'Uploading or taking a photo will work after the next full app update. For now you can search a symbol, choose a symbol, pick any colour, or use the TapTalk avatar.',
            [{ text: 'OK', style: 'cancel' }],
          );
          break;
        case 'cancelled':
        default:
          break;
      }
    },
    [onChange],
  );

  const openSheet = useCallback(() => {
    hapticSelection();
    const options = [
      'Upload from Library',
      'Take Photo',
      'Search Symbol',
      'Choose Symbol',
      'Choose Colour',
      'Use TapTalk Avatar',
      ...(hasPicture ? ['Remove Current Picture'] : []),
      'Cancel',
    ];
    const cancelButtonIndex = options.length - 1;
    const removeIndex = hasPicture ? options.length - 2 : -1;

    const handle = (i: number) => {
      switch (options[i]) {
        case 'Upload from Library':
          pickFromLibrary().then((o) => handleOutcome(o, 'Library'));
          break;
        case 'Take Photo':
          takePhoto().then((o) => handleOutcome(o, 'Camera'));
          break;
        case 'Search Symbol':
          setQuery('');
          setSymbolSearch(true);
          break;
        case 'Choose Symbol':
          setSymbolGrid(true);
          break;
        case 'Choose Colour':
          setColorSheet(true);
          break;
        case 'Use TapTalk Avatar':
          hapticSuccess();
          onChange(AVATAR_MASCOT_VALUE);
          break;
        case 'Remove Current Picture':
          hapticSuccess();
          onChange(null);
          break;
        default:
          break;
      }
    };

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
          destructiveButtonIndex: removeIndex >= 0 ? removeIndex : undefined,
          title: 'Pick A Picture',
        },
        handle,
      );
    } else {
      Alert.alert('Pick A Picture', undefined, [
        ...options.slice(0, cancelButtonIndex).map((opt, i) => ({
          text: opt,
          style: (i === removeIndex ? 'destructive' : 'default') as 'destructive' | 'default',
          onPress: () => handle(i),
        })),
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  }, [hasPicture, onChange, handleOutcome]);

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={hasPicture ? 'Change picture' : 'Pick a picture'}
        accessibilityHint="Opens options for a symbol, colour, avatar, or photo"
        onPress={openSheet}
        style={({ pressed }) => [styles.circle, pressed && { opacity: 0.75 }]}
        hitSlop={8}
      >
        <AvatarView value={value} size={size} initial={initial} />
        <View style={[styles.badge, { backgroundColor: t.colors.primary, borderColor: t.colors.surface }]}>
          <Ionicons name="camera" size={16} color="#FFFFFF" />
        </View>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={label ?? 'Pick A Picture'} onPress={openSheet} hitSlop={8}>
        <Text style={[styles.label, { color: t.colors.primary }]}>{label ?? 'Pick A Picture'}</Text>
      </Pressable>

      {/* Choose Symbol grid */}
      <Modal
        visible={symbolGrid}
        animationType={reduceMotion ? 'fade' : 'slide'}
        presentationStyle="formSheet"
        onRequestClose={() => setSymbolGrid(false)}
      >
        <View style={[styles.sheet, { backgroundColor: t.colors.background }]}>
          <SheetHeader title="Choose Symbol" onClose={() => setSymbolGrid(false)} />
          <View style={styles.grid}>
            {AVATAR_SYMBOLS.map((s) => {
              const on = avatar.kind === 'symbol' && avatar.symbolId === s.symbolId;
              return (
                <Pressable
                  key={s.symbolId}
                  accessibilityRole="button"
                  accessibilityLabel={`Use ${s.name} symbol`}
                  accessibilityState={{ selected: on }}
                  onPress={() => {
                    hapticSuccess();
                    onChange(encodeSymbol(s.symbolId));
                    setSymbolGrid(false);
                  }}
                  style={({ pressed }) => [
                    styles.cell,
                    { backgroundColor: pressed || on ? t.colors.selectionBg : t.colors.input },
                  ]}
                >
                  <MulberrySymbol symbolId={s.symbolId} size={44} />
                  <Text style={[styles.cellLabel, { color: t.colors.text }]} numberOfLines={1}>
                    {s.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </Modal>

      {/* Search Symbol */}
      <Modal
        visible={symbolSearch}
        animationType={reduceMotion ? 'fade' : 'slide'}
        presentationStyle="formSheet"
        onRequestClose={() => setSymbolSearch(false)}
      >
        <View style={[styles.sheet, { backgroundColor: t.colors.background }]}>
          <SheetHeader title="Search Symbol" onClose={() => setSymbolSearch(false)} />
          <View style={styles.searchBody}>
            <TextInput
              accessibilityLabel="Search symbols"
              value={query}
              onChangeText={setQuery}
              autoFocus
              placeholder="Type a word, e.g. dog, happy, bus"
              placeholderTextColor={t.colors.textTertiary}
              style={[styles.searchInput, { color: t.colors.text, backgroundColor: t.colors.input, borderColor: t.colors.border }]}
            />
            <SymbolSuggestionRow
              query={query}
              onSelect={(result) => {
                hapticSuccess();
                onChange(encodeSymbol(result.symbol.id));
                setSymbolSearch(false);
              }}
            />
            {!query.trim() ? (
              <Text style={[styles.searchHint, { color: t.colors.textMuted }]}>
                Search the full symbol library and tap one to use it.
              </Text>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* Choose Colour — full wheel */}
      <ColorPickerSheet
        visible={colorSheet}
        initialColor={currentColor}
        title="Avatar Colour"
        reduceMotion={reduceMotion}
        onCancel={() => setColorSheet(false)}
        onDone={(hex) => {
          hapticSuccess();
          onChange(encodeColor(hex));
          setColorSheet(false);
        }}
      />
    </View>
  );
}

function SheetHeader({ title, onClose }: { title: string; onClose: () => void }) {
  const t = useTheme();
  return (
    <View style={styles.sheetHeader}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cancel"
        onPress={() => {
          hapticSelection();
          onClose();
        }}
        hitSlop={12}
        style={styles.sheetCancel}
      >
        <Text style={[styles.sheetCancelText, { color: t.colors.primary }]}>Cancel</Text>
      </Pressable>
      <Text style={[styles.sheetTitle, { color: t.colors.text }]}>{title}</Text>
      <View style={styles.sheetSpacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: spacing.sm },
  circle: { position: 'relative' },
  badge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontFamily: fonts.displayBold, fontSize: typography.callout, marginTop: spacing.xs },

  sheet: { flex: 1 },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  sheetCancel: { minWidth: 60, minHeight: 44, justifyContent: 'center' },
  sheetCancelText: { fontFamily: fonts.displayBold, fontSize: typography.body },
  sheetTitle: { fontFamily: fonts.displayHeavy, fontSize: typography.heading },
  sheetSpacer: { minWidth: 60 },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  cell: {
    width: 80,
    minHeight: 84,
    borderRadius: radii.card,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    gap: spacing.xs,
  },
  cellLabel: { fontFamily: fonts.body, fontSize: typography.caption, maxWidth: 70, textAlign: 'center' },

  searchBody: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.md },
  searchInput: {
    fontFamily: fonts.body,
    fontSize: typography.body,
    minHeight: 48,
    borderRadius: radii.input,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
  },
  searchHint: { fontFamily: fonts.body, fontSize: typography.callout, textAlign: 'center', marginTop: spacing.md },
});
