import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useTheme } from '../theme/useTheme';

export type MascotVariant = 'head' | 'business' | 'astronaut';

interface TapTalkMascotProps {
  variant: MascotVariant;
  style?: ViewStyle;
}

const variantAccessory: Record<MascotVariant, string> = {
  head: '',
  business: '✦',
  astronaut: '★',
};

export function TapTalkMascot({ variant, style }: TapTalkMascotProps) {
  const t = useTheme();

  return (
    <View
      accessible
      accessibilityLabel={`TapTalk ${variant} mascot`}
      style={[styles.container, style]}
    >
      <View
        style={[
          styles.body,
          {
            borderColor: t.colors.text,
            backgroundColor: t.colors.mascot,
          },
        ]}
      >
        <View style={[styles.eye, styles.leftEye, { backgroundColor: t.colors.background }]}>
          <View style={[styles.pupil, { backgroundColor: t.colors.text }]} />
        </View>
        <View style={[styles.eye, styles.rightEye, { backgroundColor: t.colors.background }]}>
          <View style={[styles.pupil, { backgroundColor: t.colors.text }]} />
        </View>
        <View style={[styles.mouth, { borderBottomColor: t.colors.text }]} />
        {variantAccessory[variant] ? (
          <Text style={[styles.accessory, { color: t.colors.surface }]}>
            {variantAccessory[variant]}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  accessory: {
    position: 'absolute',
    top: 10,
    right: 18,
    fontSize: 28,
    fontWeight: '900',
  },
  body: {
    width: '86%',
    height: '78%',
    borderWidth: 4,
    borderRadius: 72,
  },
  container: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eye: {
    position: 'absolute',
    top: '30%',
    width: 34,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
  },
  leftEye: {
    left: '20%',
  },
  mouth: {
    position: 'absolute',
    left: '37%',
    bottom: '24%',
    width: '26%',
    height: 13,
    borderBottomWidth: 4,
    borderRadius: 20,
  },
  pupil: {
    width: 17,
    height: 19,
    borderRadius: 10,
  },
  rightEye: {
    right: '20%',
  },
});
