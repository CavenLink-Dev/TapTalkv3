import { renderHook, act } from '@testing-library/react-native';
import { useTileTap } from '../useTileTap';

const motorMock = { current: { tileGap: 4, tapDebounceMs: 0, dwellMs: 0, longPress: true, minTile: 88 } };
jest.mock('../../accessibility/motor', () => ({
  useMotor: () => motorMock.current,
}));

describe('useTileTap', () => {
  beforeEach(() => {
    motorMock.current = { tileGap: 4, tapDebounceMs: 0, dwellMs: 0, longPress: true, minTile: 88 };
    jest.useFakeTimers();
  });
  afterEach(() => { jest.useRealTimers(); });

  it('fires on tap under standard profile', () => {
    const onFire = jest.fn();
    const { result } = renderHook(() => useTileTap(onFire));
    act(() => result.current.onPress('t1'));
    expect(onFire).toHaveBeenCalledWith('t1');
  });

  it('debounces double taps under tremor profile', () => {
    motorMock.current = { ...motorMock.current, tapDebounceMs: 120 };
    const onFire = jest.fn();
    const { result } = renderHook(() => useTileTap(onFire));
    act(() => result.current.onPress('t1'));
    act(() => result.current.onPress('t1'));
    expect(onFire).toHaveBeenCalledTimes(1);
  });

  it('dwell activation fires only after hold time', () => {
    motorMock.current = { ...motorMock.current, dwellMs: 800 };
    const onFire = jest.fn();
    const { result } = renderHook(() => useTileTap(onFire));
    act(() => result.current.onPressIn('t1'));
    act(() => { jest.advanceTimersByTime(500); });
    act(() => result.current.onPressOut());
    expect(onFire).not.toHaveBeenCalled();

    act(() => result.current.onPressIn('t2'));
    act(() => { jest.advanceTimersByTime(800); });
    expect(onFire).toHaveBeenCalledWith('t2');
  });

  it('dwell mode ignores plain onPress', () => {
    motorMock.current = { ...motorMock.current, dwellMs: 800 };
    const onFire = jest.fn();
    const { result } = renderHook(() => useTileTap(onFire));
    act(() => result.current.onPress('t1'));
    expect(onFire).not.toHaveBeenCalled();
  });
});
