/**
 * SettingsRow — reusable settings list row matching iOS patterns.
 *
 * Types supported:
 *   • navigation  → opens a new page (chevron accessory)
 *   • action      → single action without navigation (no chevron)
 *   • toggle      → boolean switch (native <Switch />)
 *   • expandable  → reveals inline content (chevron-down indicator)
 *   • static      → read-only information (no accessory)
 */

import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/useTheme';
import { radii, spacing, typography } from '../../theme/tokens';
import { fonts } from '../../theme/fonts';
import { hapticSelection } from '../../utils/haptics';

export type SettingsRowType = 'navigation' | 'action' | 'toggle' | 'expandable' | 'static';
export type SettingsRowIconName = React.ComponentProps<typeof Ionicons>['name'];

type BaseProps = {
  icon: SettingsRowIconName;
  iconColor?: string;
  iconBg?: string;
  label: string;
  value?: string;
  hint?: string;
  destructive?: boolean;
  disabled?: boolean;
  showDivider?: boolean;
  accessibilityLabel?: string;
  testID?: string;
};

type NavigationProps = BaseProps & {
  type: 'navigation';
  onPress: () => void;
};

type ActionProps = BaseProps & {
  type: 'action';
  onPress: () => void;
};

type ToggleProps = BaseProps & {
  type: 'toggle';
  toggleValue: boolean;
  onToggle: (next: boolean) => void;
};

type ExpandableProps = BaseProps & {
  type: 'expandable';
  expanded: boolean;
  onPress: () => void;
};

type StaticProps = BaseProps & {
  type: 'static';
};

export type SettingsRowProps =
  | NavigationProps
  | ActionProps
  | ToggleProps
  | ExpandableProps
  | StaticProps;

export function SettingsRow(props: SettingsRowProps) {
  const t = useTheme();
  const {
    icon,
    iconColor,
    iconBg,
    label,
    value,
    hint,
    destructive,
    disabled,
    showDivider = true,
    accessibilityLabel,
    testID,
  } = props;

  const resolvedIconColor = iconColor ?? t.colors.primary;
  const resolvedIconBg = iconBg ?? t.colors.iconTintBlueBg;
  const spokenLabel = useMemo(() => {
    if (!value) return label;
    return `${label}, ${value}`;
  }, [label, value]);

  const renderDivider = () =>
    showDivider ? <View style={[styles.divider, { backgroundColor: t.colors.input }]} /> : null;

  const commonLabelStyle = [
    styles.label,
    { color: destructive ? t.colors.danger : t.colors.text },
    disabled && { opacity: 0.45 },
  ];

  const valueStyle = [styles.value, { color: t.colors.textTertiary }];

  const iconChip = (
    <View style={[styles.iconChip, { backgroundColor: resolvedIconBg }]}
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      <Ionicons name={icon} size={18} color={resolvedIconColor} />
    </View>
  );

  const body = (
    <>
      {iconChip}
      <Text style={commonLabelStyle} numberOfLines={2}>
        {label}
      </Text>
      {value ? (
        <Text style={valueStyle} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {props.type === 'toggle' ? (
        <Switch
          value={props.toggleValue}
          disabled={disabled}
          onValueChange={(next) => {
            hapticSelection();
            props.onToggle(next);
          }}
          trackColor={{ false: t.colors.disabled, true: t.colors.success }}
          thumbColor={t.colors.surface}
          ios_backgroundColor={t.colors.disabled}
          testID={testID ? `${testID}-switch` : undefined}
        />
      ) : null}
      {props.type === 'navigation' ? (
        <Ionicons
          name="chevron-forward"
          size={17}
          color={t.colors.textTertiary}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      ) : null}
      {props.type === 'expandable' ? (
        <Ionicons
          name={props.expanded ? 'chevron-up' : 'chevron-down'}
          size={17}
          color={t.colors.textTertiary}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      ) : null}
    </>
  );

  const commonAccessibilityState = () => {
    switch (props.type) {
      case 'toggle':
        return { checked: props.toggleValue, disabled } as const;
      case 'expandable':
        return { expanded: props.expanded, disabled } as const;
      case 'static':
        return undefined;
      default:
        return disabled ? { disabled } : undefined;
    }
  };

  if (props.type === 'static') {
    return (
      <>
        <View
          style={styles.row}
          accessibilityRole="text"
          accessibilityLabel={accessibilityLabel ?? spokenLabel}
          testID={testID}
        >
          {body}
        </View>
        {renderDivider()}
      </>
    );
  }

  if (props.type === 'toggle') {
    const handleToggle = (next: boolean) => {
      if (disabled) return;
      hapticSelection();
      props.onToggle(next);
    };

    return (
      <>
        <Pressable
          style={({ pressed }) => [styles.row, pressed && { opacity: 0.75 }, disabled && { opacity: 0.45 }]}
          accessibilityRole="switch"
          accessibilityLabel={accessibilityLabel ?? spokenLabel}
          accessibilityHint={hint}
          accessibilityState={commonAccessibilityState()}
          onPress={() => handleToggle(!props.toggleValue)}
          disabled={disabled}
          testID={testID}
        >
          {/* re-create body with Switch hooked into shared handler */}
          {iconChip}
          <Text style={commonLabelStyle} numberOfLines={2}>
            {label}
          </Text>
          {value ? (
            <Text style={valueStyle} numberOfLines={1}>
              {value}
            </Text>
          ) : null}
          <Switch
            value={props.toggleValue}
            disabled={disabled}
            onValueChange={handleToggle}
            trackColor={{ false: t.colors.disabled, true: t.colors.success }}
            thumbColor={t.colors.surface}
            ios_backgroundColor={t.colors.disabled}
            testID={testID ? `${testID}-switch` : undefined}
          />
        </Pressable>
        {renderDivider()}
      </>
    );
  }

  const handlePress = () => {
    if (disabled) return;
    hapticSelection();
    props.onPress();
  };

  const role = props.type === 'action' ? 'button' : 'button';

  return (
    <>
      <Pressable
        style={({ pressed }) => [styles.row, pressed && { opacity: 0.75 }, disabled && { opacity: 0.45 }]}
        accessibilityRole={role}
        accessibilityLabel={accessibilityLabel ?? spokenLabel}
        accessibilityHint={hint}
        accessibilityState={commonAccessibilityState()}
        onPress={handlePress}
        disabled={disabled}
        testID={testID}
      >
        {body}
      </Pressable>
      {renderDivider()}
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
    minHeight: 56,
  },
  iconChip: {
    width: 32,
    height: 32,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    fontFamily: fonts.displayBold,
    fontSize: typography.body,
  },
  value: {
    fontFamily: fonts.body,
    fontSize: typography.callout,
    maxWidth: '40%',
    textAlign: 'right',
  },
  divider: {
    height: 1,
    marginLeft: 32 + spacing.md * 2,
  },
});
