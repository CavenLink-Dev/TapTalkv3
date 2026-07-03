/**
 * ColorWheel — a reusable HSV colour picker.
 *
 *   • Hue + Saturation on the wheel (angle = hue, radius = saturation)
 *   • Brightness on a slider below
 *   • A draggable handle the user drags to locate any colour
 *   • Hex / RGB text entry for exact values
 *
 * Any colour is reachable — no preset-only choices. Built on react-native-svg
 * + PanResponder (JS thread, same pattern as the Tools screen) so it needs no
 * worklets and stays predictable. Tokens for chrome; the wheel itself is the
 * full spectrum by design.
 *
 * Note: a screen-wide eyedropper (sampling an arbitrary pixel) is not possible
 * in managed React Native — it needs a native module — so it is intentionally
 * omitted rather than faked. Hex/RGB entry covers exact-value needs.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  PanResponder,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useTheme } from '../../theme/useTheme';
import { radii, spacing, typography } from '../../theme/tokens';
import { fonts } from '../../theme/fonts';
import {
  hexToHsv,
  hexToRgb,
  hsvToHex,
  readableInk,
  rgbToHex,
  type HSV,
} from '../../utils/color';

interface ColorWheelProps {
  /** Current colour as hex (#RRGGBB). */
  color: string;
  onChange: (hex: string) => void;
  /** Wheel diameter in points. Defaults to 260. */
  size?: number;
}

const HUE_SEGMENTS = 60;

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

export function ColorWheel({ color, onChange, size = 260 }: ColorWheelProps) {
  const t = useTheme();
  const R = size / 2;
  const seeded = useMemo(() => hexToHsv(color) ?? { h: 210, s: 0.7, v: 1 }, []); // seed once
  const [hsv, setHsv] = useState<HSV>(seeded);
  const [hexText, setHexText] = useState(color.toUpperCase());
  const hsvRef = useRef(hsv);
  hsvRef.current = hsv;

  const currentHex = hsvToHex(hsv);

  // Re-seed if the parent changes the colour to something we didn't emit.
  useEffect(() => {
    if (color.toUpperCase() !== currentHex.toUpperCase()) {
      const next = hexToHsv(color);
      if (next) {
        setHsv(next);
        setHexText(color.toUpperCase());
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [color]);

  const emit = (next: HSV) => {
    setHsv(next);
    const hex = hsvToHex(next);
    setHexText(hex);
    onChange(hex);
  };

  // ── Wheel drag (hue + saturation) ──
  const wheelResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) => handleWheel(e.nativeEvent.locationX, e.nativeEvent.locationY),
        onPanResponderMove: (e) => handleWheel(e.nativeEvent.locationX, e.nativeEvent.locationY),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const handleWheel = (x: number, y: number) => {
    const dx = x - R;
    const dy = y - R;
    const dist = Math.hypot(dx, dy);
    const s = Math.min(1, dist / R);
    let h = (Math.atan2(dy, dx) * 180) / Math.PI;
    if (h < 0) h += 360;
    emit({ ...hsvRef.current, h, s });
  };

  // ── Brightness slider ──
  const sliderW = size;
  const sliderResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) => handleSlider(e.nativeEvent.locationX),
        onPanResponderMove: (e) => handleSlider(e.nativeEvent.locationX),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const handleSlider = (x: number) => {
    const v = Math.min(1, Math.max(0, x / sliderW));
    emit({ ...hsvRef.current, v });
  };

  // Handle position on the wheel.
  const handlePos = polar(R, R, hsv.s * R, hsv.h);
  const ink = readableInk(currentHex);
  const fullBright = hsvToHex({ h: hsv.h, s: hsv.s, v: 1 });

  const onHexChange = (raw: string) => {
    setHexText(raw);
    const parsed = hexToHsv(raw);
    if (parsed) {
      setHsv(parsed);
      onChange(hsvToHex(parsed));
    }
  };

  const rgb = hexToRgb(currentHex);

  return (
    <View style={styles.wrap}>
      {/* Wheel */}
      <View style={{ width: size, height: size }} {...wheelResponder.panHandlers}>
        <Svg width={size} height={size}>
          <Defs>
            <RadialGradient id="sat" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={1} />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          {Array.from({ length: HUE_SEGMENTS }).map((_, i) => {
            const seg = 360 / HUE_SEGMENTS;
            const a0 = i * seg - 0.7;
            const a1 = (i + 1) * seg + 0.7;
            const p0 = polar(R, R, R, a0);
            const p1 = polar(R, R, R, a1);
            const hue = i * seg + seg / 2;
            return (
              <Path
                key={i}
                d={`M ${R} ${R} L ${p0.x} ${p0.y} A ${R} ${R} 0 0 1 ${p1.x} ${p1.y} Z`}
                fill={hsvToHex({ h: hue, s: 1, v: 1 })}
              />
            );
          })}
          <Circle cx={R} cy={R} r={R} fill="url(#sat)" />
          {/* Dim the whole wheel to reflect the brightness value. */}
          {hsv.v < 1 ? <Circle cx={R} cy={R} r={R} fill="#000000" opacity={1 - hsv.v} /> : null}
        </Svg>
        {/* Draggable handle */}
        <View
          pointerEvents="none"
          style={[
            styles.handle,
            {
              left: handlePos.x - 14,
              top: handlePos.y - 14,
              backgroundColor: currentHex,
              borderColor: ink === '#000000' ? 'rgba(0,0,0,0.55)' : '#FFFFFF',
            },
          ]}
        />
      </View>

      {/* Brightness slider */}
      <View style={styles.sliderBlock}>
        <Text style={[styles.sliderLabel, { color: t.colors.textTertiary }]}>BRIGHTNESS</Text>
        <View style={{ width: sliderW, height: 30 }} {...sliderResponder.panHandlers}>
          <Svg width={sliderW} height={30}>
            <Defs>
              <LinearGradient id="bright" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0%" stopColor="#000000" />
                <Stop offset="100%" stopColor={fullBright} />
              </LinearGradient>
            </Defs>
            <Rect x={0} y={9} width={sliderW} height={12} rx={6} fill="url(#bright)" />
          </Svg>
          <View
            pointerEvents="none"
            style={[
              styles.sliderThumb,
              { left: Math.max(0, Math.min(sliderW - 24, hsv.v * sliderW - 12)), borderColor: t.colors.surface, backgroundColor: currentHex },
            ]}
          />
        </View>
      </View>

      {/* Value entry + preview */}
      <View style={styles.valueRow}>
        <View style={[styles.preview, { backgroundColor: currentHex, borderColor: t.colors.border }]} />
        <View style={styles.hexField}>
          <Text style={[styles.fieldLabel, { color: t.colors.textTertiary }]}>HEX</Text>
          <TextInput
            accessibilityLabel="Hex colour value"
            value={hexText}
            onChangeText={onHexChange}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={7}
            placeholder="#199AEE"
            placeholderTextColor={t.colors.textTertiary}
            style={[styles.hexInput, { color: t.colors.text, backgroundColor: t.colors.input, borderColor: t.colors.border }]}
          />
        </View>
        <View style={styles.rgbField}>
          <Text style={[styles.fieldLabel, { color: t.colors.textTertiary }]}>RGB</Text>
          <Text style={[styles.rgbValue, { color: t.colors.text }]}>
            {rgb ? `${rgb.r}, ${rgb.g}, ${rgb.b}` : '—'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: spacing.lg },
  handle: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
  },
  sliderBlock: { alignItems: 'flex-start', gap: spacing.xs },
  sliderLabel: {
    fontFamily: fonts.bodyHeavy,
    fontSize: typography.eyebrow,
    letterSpacing: 0.8,
  },
  sliderThumb: {
    position: 'absolute',
    top: 3,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.md,
    alignSelf: 'stretch',
  },
  preview: {
    width: 44,
    height: 44,
    borderRadius: radii.button,
    borderWidth: 1,
  },
  hexField: { flex: 1, gap: spacing.xs },
  rgbField: { gap: spacing.xs, minWidth: 96 },
  fieldLabel: {
    fontFamily: fonts.bodyHeavy,
    fontSize: typography.eyebrow,
    letterSpacing: 0.8,
    marginLeft: spacing.xs,
  },
  hexInput: {
    fontFamily: fonts.body,
    fontSize: typography.body,
    minHeight: 44,
    borderRadius: radii.input,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
  },
  rgbValue: {
    fontFamily: fonts.body,
    fontSize: typography.callout,
    minHeight: 44,
    textAlignVertical: 'center',
  },
});
