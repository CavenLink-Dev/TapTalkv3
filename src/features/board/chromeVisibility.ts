/**
 * chromeVisibility — tiny shared store for the "Hide" board feature.
 *
 * The board screen (app/(tabs)/talk.tsx) hides/shows the bottom tab bar;
 * the tab navigator (app/(tabs)/_layout.tsx) subscribes and collapses the
 * bar. Module-level store avoids threading a context through the router.
 */
import { useEffect, useState } from 'react';

let tabBarHidden = false;
const listeners = new Set<(hidden: boolean) => void>();

export function setTabBarHidden(hidden: boolean) {
  if (tabBarHidden === hidden) return;
  tabBarHidden = hidden;
  listeners.forEach(l => l(hidden));
}

export function useTabBarHidden(): boolean {
  const [hidden, setHidden] = useState(tabBarHidden);
  useEffect(() => {
    listeners.add(setHidden);
    return () => {
      listeners.delete(setHidden);
    };
  }, []);
  return hidden;
}
