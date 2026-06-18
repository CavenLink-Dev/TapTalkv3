import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography } from '../../theme/tokens';

type Provider = 'phone' | 'outlook' | 'google' | 'facebook';

interface ProviderIconsProps {
  onProviderPress: (provider: Provider) => void;
  /**
   * Entrance delay for the whole component
   */
  entranceDelay?: number;
}

/**
 * Provider icons component showing phone, Outlook, Google, Facebook.
 * Each icon has press feedback with scale animation and haptics.
 */
export function ProviderIcons({ onProviderPress, entranceDelay = 0 }: ProviderIconsProps) {
  return (
    <Animated.View
      entering={FadeInDown.duration(300).delay(entranceDelay)}
      style={styles.container}
    >
      <Text style={styles.title}>CONTINUE USING YOUR EMAIL</Text>
      <View style={styles.iconRow}>
        <ProviderIcon
          icon="📞"
          label="Phone"
          color={colors.primary}
          onPress={() => onProviderPress('phone')}
        />
        <ProviderIcon
          icon="📧"
          label="Outlook"
          color="#0078D4"
          onPress={() => onProviderPress('outlook')}
        />
        <ProviderIcon
          icon="G"
          label="Google"
          color="#4285F4"
          onPress={() => onProviderPress('google')}
        />
        <ProviderIcon
          icon="f"
          label="Facebook"
          color="#1877F2"
          onPress={() => onProviderPress('facebook')}
        />
      </View>
    </Animated.View>
  );
}

interface ProviderIconProps {
  icon: string;
  label: string;
  color: string;
  onPress: () => void;
}

function ProviderIcon({ icon, label, color, onPress }: ProviderIconProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.985, { duration: 100 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 100 });
  };

  return (
    <Animated.View style={styles.iconWrap}>
      <Animated.View style={animatedStyle}>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={onPress}
          style={[styles.iconButton, { backgroundColor: color }]}
          accessibilityRole="button"
          accessibilityLabel={`Sign in with ${label}`}
        >
          <Text style={styles.iconText}>{icon}</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  iconWrap: {},
  iconButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  iconText: {
    fontSize: 28,
    color: colors.surface,
  },
});
