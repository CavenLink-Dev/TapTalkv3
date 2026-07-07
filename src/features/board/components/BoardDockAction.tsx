import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Icon } from '../../../components/native/Icon';
import { colors, spacing } from '../../../theme/tokens';
import { useTheme } from '../../../theme/useTheme';
import {
  DOCK_ACTION_PADDING,
  DOCK_ACTION_SIZE,
  DOCK_ICON_ACTION,
  DOCK_ICON_ROW,
  DOCK_ICON_STROKE,
  DOCK_ICON_TOGGLE,
} from '../talk/constants';
import { styles } from '../talk/styles';
import type { DockActionKind } from '../talk/types';

export const BoardDockAction = React.memo(function BoardDockAction({
  label,
  icon,
  iconOnly = false,
  iconLabelLayout = 'stack',
  a11yLabel,
  a11yHint,
  onPress,
  size = DOCK_ACTION_SIZE,
  kind = 'neutral',
  disabled = false,
  isToggle = false,
  isActive = false,
  wide = false,
  tint,
}: {
  label?: string;
  icon?: string;
  iconOnly?: boolean;
  iconLabelLayout?: 'stack' | 'row';
  a11yLabel: string;
  a11yHint?: string;
  onPress: () => void;
  size?: number;
  kind?: DockActionKind;
  disabled?: boolean;
  /** 44pt square — Add toggle or chevrons. */
  isToggle?: boolean;
  /** Toggle is on (Add flow open). */
  isActive?: boolean;
  /** Auto-width for readable multi-word labels (e.g. Board Settings). */
  wide?: boolean;
  /** Optional border + content colour override (e.g. red Unselect). */
  tint?: string;
}) {
  const t = useTheme();
  const dim = size;
  const isRowLabel = Boolean(icon && label && iconLabelLayout === 'row');
  const softFill = t.colors.surface;
  const effectiveKind: DockActionKind = kind;
  const activeNeutral = isActive && effectiveKind !== 'primary';
  const dockIconProps = {
    strokeWidth: DOCK_ICON_STROKE,
  } as const;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      accessibilityHint={a11yHint}
      accessibilityState={{ disabled, selected: isActive }}
      disabled={disabled}
      hitSlop={iconOnly ? { top: 4, bottom: 4, left: 4, right: 4 } : undefined}
      onPress={onPress}
      style={({ pressed }) => {
        const bg =
          effectiveKind === 'primary'
            ? (pressed ? t.colors.primaryPressed : t.colors.primary)
            : activeNeutral
              ? t.colors.selectionBg
              : softFill;
        return [
          styles.dockAction,
          {
            width: wide || isRowLabel ? undefined : dim,
            minWidth: isRowLabel ? 76 : dim,
            minHeight: dim,
            height: dim,
            paddingHorizontal: wide
              ? spacing.md
              : isRowLabel
                ? spacing.sm + 2
                : DOCK_ACTION_PADDING,
            paddingVertical: DOCK_ACTION_PADDING,
            backgroundColor: bg,
            borderColor: activeNeutral
              ? (tint ?? t.colors.primary)
              : (tint ?? t.colors.symbolOutline),
            borderWidth: effectiveKind === 'primary' ? 0 : activeNeutral ? 2 : 1.6,
            opacity: pressed ? 0.82 : 1,
          },
          disabled && { opacity: 0.4 },
        ];
      }}
    >
      {({ pressed }) => {
        const contentColor =
          effectiveKind === 'primary'
            ? '#FFFFFF'
            : tint
              ? tint
              : activeNeutral
                ? t.colors.primary
                : effectiveKind === 'muted'
                  ? t.colors.textMuted
                  : t.colors.text;

        if (iconOnly && icon) {
          return (
            <View style={styles.dockIconOnlyMount}>
              <Icon
                name={icon}
                size={DOCK_ICON_TOGGLE}
                color={contentColor}
                {...dockIconProps}
              />
            </View>
          );
        }

        if (icon && label && iconLabelLayout === 'row') {
          return (
            <View style={styles.dockIconRow}>
              <View style={styles.dockIconRowGlyph}>
                <Icon
                  name={icon}
                  size={DOCK_ICON_ROW}
                  color={contentColor}
                  {...dockIconProps}
                />
              </View>
              <Text
                style={[styles.dockRowLabel, { color: contentColor }]}
                numberOfLines={1}
                maxFontSizeMultiplier={1.3}
              >
                {label}
              </Text>
            </View>
          );
        }

        if (icon && label) {
          return (
            <View style={styles.dockIconStack}>
              <View style={styles.dockIconStackGlyph}>
                <Icon
                  name={icon}
                  size={DOCK_ICON_ACTION}
                  color={contentColor}
                  {...dockIconProps}
                />
              </View>
              <Text
                style={[styles.dockActionLabel, { color: contentColor }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.65}
                maxFontSizeMultiplier={1.3}
              >
                {label}
              </Text>
            </View>
          );
        }

        return (
          <Text
            style={[
              isToggle
                ? styles.dockAddToggleLabel
                : styles.dockActionLabel,
              { color: contentColor },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
            maxFontSizeMultiplier={1.3}
          >
            {label}
          </Text>
        );
      }}
    </Pressable>
  );
});
