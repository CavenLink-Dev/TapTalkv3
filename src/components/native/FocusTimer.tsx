import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, radii, spacing, typography } from '../../theme/tokens';

type Mode = 'work' | 'break';

const DURATIONS: Record<Mode, number> = {
  work: 25 * 60,
  break: 5 * 60,
};

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function formatTime(seconds: number) {
  return `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`;
}

export function FocusTimer() {
  const [mode, setMode] = useState<Mode>('work');
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(DURATIONS.work);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressAnim = useRef(new Animated.Value(1)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const reduceMotion = useRef(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      reduceMotion.current = v;
    });
  }, []);

  const total = DURATIONS[mode];
  const progress = remaining / total;

  useEffect(() => {
    if (reduceMotion.current) return;
    Animated.spring(progressAnim, {
      toValue: progress,
      tension: 60,
      friction: 12,
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnim]);

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

  const complete = useCallback(
    (currentMode: Mode) => {
      stop();
      setRunning(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const next: Mode = currentMode === 'work' ? 'break' : 'work';
      setMode(next);
      setRemaining(DURATIONS[next]);
    },
    [stop]
  );

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          complete(mode);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return stop;
  }, [running, mode, complete, stop]);

  const toggle = () => {
    const next = !running;
    setRunning(next);
    Haptics.impactAsync(
      next ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light
    );
    if (!reduceMotion.current) {
      Animated.spring(btnScale, {
        toValue: 0.92,
        tension: 180,
        friction: 10,
        useNativeDriver: true,
      }).start(() => {
        Animated.spring(btnScale, {
          toValue: 1,
          tension: 120,
          friction: 8,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  const reset = () => {
    stop();
    setRunning(false);
    setRemaining(DURATIONS[mode]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const switchMode = (m: Mode) => {
    stop();
    setRunning(false);
    setMode(m);
    setRemaining(DURATIONS[m]);
    Haptics.selectionAsync();
  };

  const fillWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const isWork = mode === 'work';
  const accentColor = isWork ? colors.primary : colors.success;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Focus Timer</Text>
        <View style={styles.modeToggle}>
          <Pressable
            accessibilityRole="tab"
            accessibilityLabel="Work mode, 25 minutes"
            accessibilityState={{ selected: isWork }}
            onPress={() => switchMode('work')}
            style={[styles.modeTab, isWork && styles.modeTabActive]}
          >
            <Text style={[styles.modeTabText, isWork && styles.modeTabTextActive]}>
              Work
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="tab"
            accessibilityLabel="Break mode, 5 minutes"
            accessibilityState={{ selected: !isWork }}
            onPress={() => switchMode('break')}
            style={[styles.modeTab, !isWork && styles.modeTabActive]}
          >
            <Text style={[styles.modeTabText, !isWork && styles.modeTabTextActive]}>
              Break
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.clockFace}>
        <View style={styles.trackBar}>
          <Animated.View
            style={[styles.fillBar, { width: fillWidth, backgroundColor: accentColor }]}
          />
        </View>
        <Text
          style={styles.timeDisplay}
          accessibilityLabel={`${formatTime(remaining)} remaining`}
          accessibilityLiveRegion="polite"
        >
          {formatTime(remaining)}
        </Text>
        <Text style={[styles.modeLabel, { color: accentColor }]}>
          {isWork ? 'Stay focused' : 'Take a breath'}
        </Text>
      </View>

      <View style={styles.controls}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Reset timer"
          onPress={reset}
          style={styles.secondaryBtn}
          hitSlop={8}
        >
          <Text style={styles.secondaryBtnText}>Reset</Text>
        </Pressable>

        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={running ? 'Pause timer' : 'Start timer'}
            onPress={toggle}
            style={[styles.primaryBtn, { backgroundColor: accentColor }]}
          >
            <Text style={styles.primaryBtnText}>{running ? 'Pause' : 'Start'}</Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  clockFace: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  container: {
    gap: spacing.md,
  },
  controls: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fillBar: {
    height: '100%',
    borderRadius: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modeLabel: {
    fontSize: typography.caption,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginTop: spacing.xs,
  },
  modeTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
  },
  modeTabActive: {
    backgroundColor: colors.primary,
  },
  modeTabText: {
    fontSize: typography.caption,
    fontWeight: '600',
    color: colors.textMuted,
  },
  modeTabTextActive: {
    color: colors.surface,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.input,
    borderRadius: radii.pill,
    padding: 3,
    gap: 2,
  },
  primaryBtn: {
    borderRadius: radii.button,
    paddingHorizontal: spacing.xl,
    paddingVertical: 14,
    minWidth: 110,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: colors.surface,
    fontSize: typography.callout,
    fontWeight: '700',
  },
  secondaryBtn: {
    borderRadius: radii.button,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    minWidth: 80,
    alignItems: 'center',
    backgroundColor: colors.input,
  },
  secondaryBtnText: {
    color: colors.textMuted,
    fontSize: typography.callout,
    fontWeight: '600',
  },
  timeDisplay: {
    fontSize: 52,
    fontWeight: '300',
    color: colors.text,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  title: {
    fontSize: typography.callout,
    fontWeight: '700',
    color: colors.text,
  },
  trackBar: {
    width: '100%',
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
});
