/**
 * useChromeGesture — Item 3 (collapse the chrome).
 *
 * The child using the board should only ever see the message strip + grid.
 * Caregiver chrome (TopNav / Dock) stays hidden until a deliberate two-finger
 * swipe reveals it, and a two-finger swipe up hides it again. A two-finger
 * gesture is used so a child dragging a single finger across tiles never
 * triggers it by accident.
 *
 * Returns a shared value (`chromeVisible`) to drive height/opacity animations
 * and the gesture to wrap the board in <GestureDetector>.
 */
import { Gesture } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';

export function useChromeGesture() {
  const chromeVisible = useSharedValue(false);

  const twoFingerSwipe = Gesture.Pan()
    .minPointers(2)
    .maxPointers(2)
    .activeOffsetY([-20, 20])
    .onEnd((e) => {
      'worklet';
      // Swipe down (positive translationY) reveals; swipe up hides.
      chromeVisible.value = e.translationY > 0;
    });

  return { chromeVisible, twoFingerSwipe };
}
