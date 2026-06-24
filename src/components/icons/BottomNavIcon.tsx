import { Asset } from 'expo-asset';
import React, { useEffect, useState } from 'react';
import { SvgUri } from 'react-native-svg';

export type BottomNavIconName = 'board' | 'activity' | 'calendar' | 'profile';

const ICONS: Record<BottomNavIconName, { selected: number; unselected: number }> = {
  board: {
    selected: require('../../../assets/bottom_nav_icons/board-selected.svg'),
    unselected: require('../../../assets/bottom_nav_icons/board-unselected.svg'),
  },
  activity: {
    selected: require('../../../assets/bottom_nav_icons/activity-selected.svg'),
    unselected: require('../../../assets/bottom_nav_icons/activity-unselected.svg'),
  },
  calendar: {
    selected: require('../../../assets/bottom_nav_icons/calendar-selected.svg'),
    unselected: require('../../../assets/bottom_nav_icons/calendar-unselected.svg'),
  },
  profile: {
    selected: require('../../../assets/bottom_nav_icons/profile-selected.svg'),
    unselected: require('../../../assets/bottom_nav_icons/profile-unselected.svg'),
  },
};

const ICON_SIZE: Record<BottomNavIconName, number> = {
  board: 50,
  activity: 54,
  calendar: 50,
  profile: 50,
};

export function BottomNavIcon({
  name,
  focused,
}: {
  name: BottomNavIconName;
  focused: boolean;
}) {
  const [uri, setUri] = useState<string | null>(null);
  const source = focused ? ICONS[name].selected : ICONS[name].unselected;

  useEffect(() => {
    let cancelled = false;

    async function resolveIcon() {
      const asset = Asset.fromModule(source);
      await asset.downloadAsync();
      if (!cancelled) {
        setUri(asset.localUri ?? asset.uri);
      }
    }

    resolveIcon();
    return () => {
      cancelled = true;
    };
  }, [source]);

  if (!uri) return null;

  return <SvgUri uri={uri} width={ICON_SIZE[name]} height={ICON_SIZE[name]} />;
}
