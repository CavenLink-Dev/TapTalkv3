import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors } from '../theme/tokens';

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
  return (
    <View
      accessible
      accessibilityLabel={`TapTalk ${variant} mascot`}
      style={[styles.container, style]}
    >
      <View style={styles.body}>
        <View style={[styles.eye, styles.leftEye]}>
          <View style={styles.pupil} />
        </View>
        <View style={[styles.eye, styles.rightEye]}>
          <View style={styles.pupil} />
        </View>
        <View style={styles.mouth} />
        {variantAccessory[variant] ? (
          <Text style={styles.accessory}>{variantAccessory[variant]}</Text>
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
    color: colors.surface,
    fontSize: 28,
    fontWeight: '900',
  },
  body: {
    width: '86%',
    height: '78%',
    borderWidth: 4,
    borderColor: colors.text,
    borderRadius: 72,
    backgroundColor: colors.mascot,
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
    backgroundColor: colors.background,
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
    borderBottomColor: colors.text,
    borderRadius: 20,
  },
  pupil: {
    width: 17,
    height: 19,
    borderRadius: 10,
    backgroundColor: colors.text,
  },
  rightEye: {
    right: '20%',
  },
});
