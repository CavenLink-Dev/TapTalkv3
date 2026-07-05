import { useCallback, useContext, useRef, useSyncExternalStore } from 'react';
import { AppContext, AppStoreContext } from '../context/AppContext';
import type { AppState } from '../context/types';

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

const objectIs = <T,>(a: T, b: T): boolean => Object.is(a, b);

export function useAppSelector<T>(
  selector: (state: AppState) => T,
  equality: (a: T, b: T) => boolean = objectIs,
): T {
  const store = useContext(AppStoreContext);
  if (!store) {
    throw new Error('useAppSelector must be used within an AppProvider');
  }

  const hasLastRef = useRef(false);
  const lastRef = useRef<T | undefined>(undefined);

  const getSnapshot = useCallback(() => {
    const next = selector(store.getState());
    if (hasLastRef.current && equality(lastRef.current as T, next)) {
      return lastRef.current as T;
    }
    hasLastRef.current = true;
    lastRef.current = next;
    return next;
  }, [equality, selector, store]);

  return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}

export function useAppDispatch() {
  const store = useContext(AppStoreContext);
  if (!store) {
    throw new Error('useAppDispatch must be used within an AppProvider');
  }
  return store.dispatch;
}
