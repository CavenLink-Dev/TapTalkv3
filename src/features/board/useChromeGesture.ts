/**
 * Two-finger swipe toggles caregiver chrome (TopNav + Dock). The
 * communicating user sees only the message strip + tile grid; the caregiver
 * pulls the chrome down when they need to edit.
 *
 *   const { chromeVisible, twoFingerSwipe, chromeStyle } = useChromeGesture();
 *   <GestureDetector gesture={twoFingerSwipe}>
 *     <View style={{ flex: 1 }}>
 *       <Reanimated.View style={chromeStyle}><TopNav /></Reanimated.View>
 *       <BoardGrid />
 *     </View>
 *   </GestureDetector>
 */
import { Gesture } from 'react-native-gesture-handler';
import {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

const CHROME_HEIGHT = 120;

export function useChromeGesture() {
  const chromeVisible = useSharedValue(0); // 0 = hidden, 1 = shown

  const twoFingerSwipe = Gesture.Pan()
    .minPointers(2)
    .maxPointers(2)
    .activeOffsetY([-20, 20])
    .onEnd((e) => {
      'worklet';
      chromeVisible.value = withTiming(e.translationY > 0 ? 1 : 0, { duration: 220 });
    });

  const chromeStyle = useAnimatedStyle(() => ({
    height: chromeVisible.value * CHROME_HEIGHT,
    opacity: chromeVisible.value,
    overflow: 'hidden',
  }));

  return { chromeVisible, twoFingerSwipe, chromeStyle };
}
