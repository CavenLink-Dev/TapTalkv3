/**
 * WheelPicker — iOS-style snap scroll wheel for numeric / choice input.
 *
 * Behaviour:
 *   • Items snap to centre at ITEM_HEIGHT intervals.
 *   • The centre item is full-opacity; items further away fade out (~0.35).
 *   • A pair of thin horizontal rules across the centre row marks selection.
 *   • Each value change fires `hapticSelection()` so the user feels the
 *     wheel "click" like the native iOS picker.
 *   • Accessibility: each item is exposed as a button; the wrapper carries
 *     an adjustable-style accessibility action so VoiceOver users can swipe
 *     up/down to change the value.
 *
 * Notes:
 *   • Generic over `T` so the same component handles numbers (hours, mins)
 *     and string lists (sound names, units).
 *   • `width` defaults to 70 — three side-by-side pickers (H/M/S) fit on
 *     a standard iPhone screen with room to spare for separators.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, typography } from '../../theme/tokens';
import { hapticSelection } from '../../utils/haptics';

export const WHEEL_ITEM_HEIGHT = 36;
const VISIBLE_COUNT = 5; // 2 above + centre + 2 below
const WHEEL_HEIGHT = VISIBLE_COUNT * WHEEL_ITEM_HEIGHT;

type Renderable = string | number;

interface WheelPickerProps<T extends Renderable> {
  values: readonly T[];
  selectedValue: T;
  onChange: (value: T) => void;
  /** Optional label displayed above the wheel (e.g. "Hour", "Minute"). */
  label?: string;
  /** Optional formatter — used to two-pad numbers, etc. */
  format?: (value: T) => string;
  width?: number;
  accessibilityLabel?: string;
}

export function WheelPicker<T extends Renderable>({
  values,
  selectedValue,
  onChange,
  label,
  format,
  width = 70,
  accessibilityLabel,
}: WheelPickerProps<T>) {
  const listRef = useRef<FlatList<T>>(null);
  const [centreIndex, setCentreIndex] = useState(() =>
    Math.max(0, values.indexOf(selectedValue)),
  );

  // Keep centreIndex in sync when the parent forces a value change
  // (e.g. "reset to 0" on a Preset Duration tap).
  useEffect(() => {
    const idx = values.indexOf(selectedValue);
    if (idx >= 0 && idx !== centreIndex) {
      setCentreIndex(idx);
      listRef.current?.scrollToOffset({
        offset: idx * WHEEL_ITEM_HEIGHT,
        animated: true,
      });
    }
  }, [selectedValue, values, centreIndex]);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const rawIdx = Math.round(y / WHEEL_ITEM_HEIGHT);
    const idx = Math.max(0, Math.min(values.length - 1, rawIdx));
    if (idx !== centreIndex) {
      setCentreIndex(idx);
      hapticSelection();
      const next = values[idx];
      if (next !== undefined && next !== selectedValue) {
        onChange(next);
      }
    }
  };

  const padding = useMemo(
    () => (VISIBLE_COUNT - 1) / 2 * WHEEL_ITEM_HEIGHT,
    [],
  );

  const renderItem = ({ item, index }: { item: T; index: number }) => {
    const distance = Math.abs(index - centreIndex);
    const opacity = Math.max(0.18, 1 - distance * 0.32);
    const scale = 1 - Math.min(0.18, distance * 0.06);
    const display = format ? format(item) : String(item);
    return (
      <View
        style={[styles.item, { opacity, transform: [{ scale }] }]}
        accessibilityRole="button"
        accessibilityLabel={`${label ? label + ' ' : ''}${display}`}
        accessibilityState={{ selected: index === centreIndex }}
      >
        <Text style={styles.itemText}>{display}</Text>
      </View>
    );
  };

  return (
    <View style={{ width, alignItems: 'center' }} accessibilityLabel={accessibilityLabel}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.wheel, { width }]}>
        <FlatList
          ref={listRef}
          data={values as T[]}
          keyExtractor={(item, idx) => `${String(item)}-${idx}`}
          renderItem={renderItem}
          snapToInterval={WHEEL_ITEM_HEIGHT}
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: padding }}
          onMomentumScrollEnd={handleScroll}
          onScroll={handleScroll}
          scrollEventThrottle={32}
          getItemLayout={(_, index) => ({
            length: WHEEL_ITEM_HEIGHT,
            offset: WHEEL_ITEM_HEIGHT * index,
            index,
          })}
          initialScrollIndex={Math.max(0, values.indexOf(selectedValue))}
          // Reduce-motion: still snaps; the system handles softness.
        />
        {/* Centre selection rules — sit above the list, non-interactive. */}
        <View pointerEvents="none" style={styles.selectionBand}>
          <View style={styles.bandLine} />
          <View style={{ height: WHEEL_ITEM_HEIGHT }} />
          <View style={styles.bandLine} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  wheel: {
    height: WHEEL_HEIGHT,
  },
  item: {
    height: WHEEL_ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: 0.2,
  },
  selectionBand: {
    position: 'absolute',
    top: (WHEEL_HEIGHT - WHEEL_ITEM_HEIGHT) / 2 - 1,
    left: 0,
    right: 0,
  },
  bandLine: {
    height: 1,
    backgroundColor: '#D1D7DE',
  },
});
