import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated as RNAnimated,
  Easing as RNEasing,
  Image,
  LayoutRectangle,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Reanimated, {
  Easing as ReanimatedEasing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Polyline } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { BackspaceIcon, BoardBackIcon, BoardHomeIcon } from '../../src/components/icons/FigmaIcons';
import { useAppContext } from '../../src/hooks/useAppContext';
import { useSpeech } from '../../src/hooks/useSpeech';
import { colors, spacing } from '../../src/theme/tokens';
import { hapticSelection } from '../../src/utils/haptics';

type TileKind = 'folder' | 'word' | 'action';
type BoardMode = 'home' | 'foods' | 'animals' | 'tools' | 'quick' | 'settings';
type TopTab = 'taptalk' | 'tools' | 'quick' | 'setting';

type BoardTile = {
  id: string;
  label: string;
  kind: TileKind;
  color: string;
  target?: BoardMode;
  speech?: string;
  background?: keyof typeof TILE_ASSETS;
};

type WindowRect = LayoutRectangle;

type GhostTile = {
  id: string;
  tile: BoardTile;
  from: WindowRect;
  to: WindowRect;
  size: number;
};

const FIGMA_WIDTH = 393;
const MESSAGE_HEIGHT = 104;
const TOP_NAV_HEIGHT = 76;
const COLLAPSED_TOGGLE_HEIGHT = 17;
const BOARD_COLUMNS = 4;
const TILE_GAP = 3;
const TILE_LEFT_PADDING = 16;
const BOARD_TOP_GAP = 18;
const TILE_SIZE = 88;
const FOLDER_HEIGHT_RATIO = 181 / 176;
const MESSAGE_CHIP_SIZE = 40;
const MESSAGE_SLOT_COUNT = 6;
const MESSAGE_SLOT_GAP = 5;

const TILE_ASSETS = {
  folder: require('../../assets/aac/board_tiles/folder-cyan.png'),
  folderExample: require('../../assets/aac/board_tiles/folder-example.png'),
  loud: require('../../assets/aac/board_tiles/symbol-loud.png'),
  straw: require('../../assets/aac/board_tiles/symbol-straw.png'),
  green: require('../../assets/aac/board_tiles/symbol-green.png'),
  red: require('../../assets/aac/board_tiles/symbol-red.png'),
  yellow: require('../../assets/aac/board_tiles/symbol-yellow.png'),
  cyan: require('../../assets/aac/board_tiles/symbol-cyan.png'),
  blue: require('../../assets/aac/board_tiles/symbol-blue.png'),
  coral: require('../../assets/aac/board_tiles/symbol-coral.png'),
  purple: require('../../assets/aac/board_tiles/symbol-purple.png'),
};

// Top-nav tab metadata. Replaces the brightly-coloured cartoon PNGs with
// neutral outlined Ionicons + uppercase text labels — matches the bottom
// nav vocabulary (one tint, two states: idle grey, active brand blue).
const TOP_TAB_META: Record<TopTab, { icon: React.ComponentProps<typeof Ionicons>['name']; label: string }> = {
  taptalk: { icon: 'keypad-outline',    label: 'TAPTALK' },
  tools:   { icon: 'construct-outline', label: 'TOOLS'   },
  quick:   { icon: 'flash-outline',     label: 'QUICK'   },
  setting: { icon: 'settings-outline',  label: 'SETTING' },
};

// Idle / active colours, kept inline so the tint animation has explicit
// endpoints to interpolate between.
const TOP_TAB_IDLE_COLOR   = '#8A8F95';
const TOP_TAB_ACTIVE_COLOR = colors.primary;

// ─── Symbol palette ──────────────────────────────────────────────────────────
// Vibrant, matte primaries chosen from the iOS system palette. The tile
// background renders these flat (no PNG) at 30% opacity so the boards read
// as clean, soft-coloured chips rather than busy stickers.
const SYMBOL_RED    = '#FF3B30';
const SYMBOL_ORANGE = '#FF9F0A';
const SYMBOL_YELLOW = '#FFD60A';
const SYMBOL_GREEN  = '#34C759';
const SYMBOL_BLUE   = '#0A84FF';
const SYMBOL_PURPLE = '#BF5AF2';

const HOME_TILES: BoardTile[] = [
  { id: 'people', label: 'People', kind: 'folder', target: 'quick', color: '#1DCDFF', background: 'folderExample' },
  { id: 'foods', label: 'Foods', kind: 'folder', target: 'foods', color: '#1DCDFF', background: 'folderExample' },
  { id: 'places', label: 'Places', kind: 'folder', target: 'animals', color: '#1DCDFF', background: 'folderExample' },
  { id: 'actions', label: 'Actions', kind: 'folder', target: 'tools', color: '#1DCDFF', background: 'folderExample' },
];

const BOARD_TILES: Record<BoardMode, BoardTile[]> = {
  home: HOME_TILES,
  foods: [
    { id: 'cheese', label: 'Cheese', kind: 'word',   color: SYMBOL_YELLOW, speech: 'cheese' },
    { id: 'apple',  label: 'Apple',  kind: 'word',   color: SYMBOL_RED,    speech: 'apple'  },
    { id: 'bread',  label: 'Bread',  kind: 'word',   color: SYMBOL_ORANGE, speech: 'bread'  },
    { id: 'back-foods', label: 'Home', kind: 'folder', target: 'home', color: '#1DCDFF' },
  ],
  animals: [
    { id: 'cat',  label: 'Cat',  kind: 'word', color: SYMBOL_ORANGE, speech: 'cat'  },
    { id: 'dog',  label: 'Dog',  kind: 'word', color: SYMBOL_GREEN,  speech: 'dog'  },
    { id: 'fish', label: 'Fish', kind: 'word', color: SYMBOL_BLUE,   speech: 'fish' },
    { id: 'back-animals', label: 'Home', kind: 'folder', target: 'home', color: '#1DCDFF' },
  ],
  tools: [
    { id: 'loud-tool', label: 'Loud',   kind: 'word',   color: SYMBOL_BLUE   , speech: 'loud'  },
    { id: 'quiet',     label: 'Quiet',  kind: 'word',   color: SYMBOL_PURPLE , speech: 'quiet' },
    { id: 'repeat',    label: 'Repeat', kind: 'action', color: SYMBOL_GREEN },
    { id: 'clear-tool',label: 'Clear',  kind: 'action', color: SYMBOL_RED   },
  ],
  quick: [
    { id: 'yes',  label: 'Yes',  kind: 'word', color: SYMBOL_GREEN, speech: 'yes'  },
    { id: 'no',   label: 'No',   kind: 'word', color: SYMBOL_RED,   speech: 'no'   },
    { id: 'help', label: 'Help', kind: 'word', color: SYMBOL_BLUE,  speech: 'help' },
    { id: 'stop', label: 'Stop', kind: 'word', color: SYMBOL_RED,   speech: 'stop' },
  ],
  settings: [
    { id: 'hide-nav',        label: 'Hide nav', kind: 'action', color: SYMBOL_PURPLE },
    { id: 'clear-settings',  label: 'Clear',    kind: 'action', color: SYMBOL_RED    },
    { id: 'home-settings',   label: 'Home',     kind: 'folder', target: 'home', color: '#1DCDFF' },
    { id: 'repeat-settings', label: 'Repeat',   kind: 'action', color: SYMBOL_GREEN  },
  ],
};

const BACK_TILE: BoardTile = { id: 'back', label: 'Back', kind: 'action', color: '#6B7580' };
const HOME_TILE: BoardTile = { id: 'home', label: 'Home', kind: 'action', color: '#6B7580' };

function BoardNavTile({ tile, size }: { tile: BoardTile; size: number }) {
  return (
    <View style={[styles.navTileShell, { width: size, height: size }]}>
      <View style={styles.navTileIconMount}>
        {tile.id === 'back' ? <BoardBackIcon size={40} /> : <BoardHomeIcon size={40} />}
      </View>
      <Text style={styles.navTileLabel} numberOfLines={1} adjustsFontSizeToFit>
        {tile.label}
      </Text>
    </View>
  );
}

function BoardFolderTile({ tile, size }: { tile: BoardTile; size: number }) {
  const folderHeight = Math.round(size * FOLDER_HEIGHT_RATIO);

  return (
    <View style={[styles.tileShell, { width: size, height: folderHeight }]}>
      <Image
        source={TILE_ASSETS[tile.background ?? 'folder']}
        resizeMode="stretch"
        style={[styles.tileBackground, { width: size, height: folderHeight }]}
      />
      <Text style={styles.folderLabel} numberOfLines={1} adjustsFontSizeToFit>
        {tile.label}
      </Text>
      <View style={styles.symbolMount} />
    </View>
  );
}

function BoardWordTile({ tile, size }: { tile: BoardTile; size: number }) {
  // Flat coloured fill at 30% opacity — replaces the previous baked PNG
  // backgrounds so the tile reads as a clean tinted chip. The label sits
  // above at full opacity for legibility.
  return (
    <View style={[styles.wordTile, { width: size, height: size }]}>
      <View
        style={[
          styles.wordTileFill,
          { width: size, height: size, backgroundColor: tile.color, opacity: 0.3 },
        ]}
      />
      <Text style={styles.wordLabel} numberOfLines={1} adjustsFontSizeToFit>
        {tile.label}
      </Text>
      <View style={styles.symbolMount} />
    </View>
  );
}

function MessageChip({ tile, label }: { tile?: BoardTile; label: string }) {
  const chipTile = tile ?? {
    id: label,
    label,
    kind: 'word' as const,
    color: '#5CC9E8',
    background: 'cyan' as const,
  };

  return (
    <View style={styles.messageChip}>
      <Image
        source={wordBackgroundForTile(chipTile)}
        resizeMode="stretch"
        style={styles.messageChipBackground}
      />
      <Text style={styles.messageChipLabel} numberOfLines={1} adjustsFontSizeToFit>
        {label}
      </Text>
    </View>
  );
}

function GhostTileClone({
  ghost,
  onDone,
}: {
  ghost: GhostTile;
  onDone: (id: string) => void;
}) {
  const progress = useSharedValue(0);
  const fromX = ghost.from.x + ghost.from.width / 2 - ghost.size / 2;
  const fromY = ghost.from.y + ghost.from.height / 2 - ghost.size / 2;
  const toX = ghost.to.x + ghost.to.width / 2 - ghost.size / 2;
  const toY = ghost.to.y + ghost.to.height / 2 - ghost.size / 2;

  useEffect(() => {
    progress.value = withTiming(
      1,
      {
        duration: 430,
        easing: ReanimatedEasing.bezier(0.22, 1, 0.36, 1),
      },
      finished => {
        if (finished) runOnJS(onDone)(ghost.id);
      },
    );
  }, [ghost.id, onDone, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.55 * (1 - progress.value),
    transform: [
      { translateX: fromX + (toX - fromX) * progress.value },
      { translateY: fromY + (toY - fromY) * progress.value },
      { scale: 1 - 0.55 * progress.value },
    ],
  }));

  const cloneHeight = ghost.tile.kind === 'folder'
    ? Math.round(ghost.size * FOLDER_HEIGHT_RATIO)
    : ghost.size;

  return (
    <Reanimated.View
      pointerEvents="none"
      style={[
        styles.ghostTile,
        {
          width: ghost.size,
          height: cloneHeight,
        },
        animatedStyle,
      ]}
    >
      {ghost.tile.kind === 'folder' ? (
        <BoardFolderTile tile={ghost.tile} size={ghost.size} />
      ) : (
        <BoardWordTile tile={ghost.tile} size={ghost.size} />
      )}
    </Reanimated.View>
  );
}

function BoardTileButton({
  tile,
  size,
  onPress,
  onMeasuredPress,
}: {
  tile: BoardTile;
  size: number;
  onPress: (rect: WindowRect | null) => void;
  onMeasuredPress?: () => void;
}) {
  const pressableRef = useRef<View>(null);
  const scale = useRef(new RNAnimated.Value(1)).current;

  const animateTo = useCallback((toValue: number) => {
    RNAnimated.spring(scale, {
      toValue,
      speed: 30,
      bounciness: 7,
      useNativeDriver: true,
    }).start();
  }, [scale]);

  const isNav = tile.id === 'back' || tile.id === 'home';
  const tileHeight = (!isNav && tile.kind === 'folder') ? Math.round(size * FOLDER_HEIGHT_RATIO) : size;

  const handlePress = useCallback(() => {
    onMeasuredPress?.();
    pressableRef.current?.measureInWindow((x, y, width, height) => {
      onPress({ x, y, width, height });
    });
  }, [onMeasuredPress, onPress]);

  return (
    <RNAnimated.View style={{ width: size, height: tileHeight, transform: [{ scale }] }}>
      <Pressable
        ref={pressableRef}
        accessibilityRole="button"
        accessibilityLabel={isNav ? tile.label : tile.kind === 'folder' ? `Open ${tile.label}` : `Say ${tile.label}`}
        onPress={handlePress}
        onPressIn={() => animateTo(0.94)}
        onPressOut={() => animateTo(1)}
        style={({ pressed }) => [styles.tilePressable, pressed && styles.tilePressed]}
      >
        {tile.id === 'back' || tile.id === 'home' ? (
          <BoardNavTile tile={tile} size={size} />
        ) : tile.kind === 'folder' ? (
          <BoardFolderTile tile={tile} size={size} />
        ) : (
          <BoardWordTile tile={tile} size={size} />
        )}
      </Pressable>
    </RNAnimated.View>
  );
}

function TopNavTab({
  tab,
  active,
  onPress,
}: {
  tab: TopTab;
  active: boolean;
  onPress: () => void;
}) {
  const meta = TOP_TAB_META[tab];

  // Single shared value drives both colour and scale so the active tab
  // brightens and lifts together. JS-driver because of the colour
  // interpolation; only 1–4 tabs animate at a time so this is fine.
  const activeAnim = useRef(new RNAnimated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    RNAnimated.timing(activeAnim, {
      toValue: active ? 1 : 0,
      duration: 180,
      easing: RNEasing.out(RNEasing.cubic),
      useNativeDriver: false,
    }).start();
  }, [active, activeAnim]);

  const tintColor = activeAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [TOP_TAB_IDLE_COLOR, TOP_TAB_ACTIVE_COLOR],
  });
  const scale = activeAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [1, 1.05],
  });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${meta.label} top tab`}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.topTab,
        // Subtle press-in dip — uses Pressable's own state so it doesn't
        // need its own Animated value.
        pressed && styles.topTabPressed,
      ]}
    >
      <RNAnimated.View style={[styles.topTabContent, { transform: [{ scale }] }]}>
        <Ionicons
          name={meta.icon}
          size={28}
          // Animated.Color can't pass directly into Ionicons' color prop, so
          // we let the parent View tint via animated text-style trick.
          color={TOP_TAB_IDLE_COLOR}
          // Replace the static icon with an absolute-positioned overlay that
          // fades in the active tint on top.
        />
        {/* Active-coloured overlay icon — opacity tracks activeAnim. */}
        <RNAnimated.View style={[styles.topTabIconOverlay, { opacity: activeAnim }]}>
          <Ionicons name={meta.icon} size={28} color={TOP_TAB_ACTIVE_COLOR} />
        </RNAnimated.View>
        <RNAnimated.Text style={[styles.topTabLabel, { color: tintColor }]}>
          {meta.label}
        </RNAnimated.Text>
      </RNAnimated.View>
    </Pressable>
  );
}

function ToggleChevron({ open, active }: { open: boolean; active: boolean }) {
  // Arrow lights blue only when the nav is open (active) or while pressed.
  const stroke = active ? colors.primaryDark : '#9A9A9A';
  return (
    <Svg width={36} height={16} viewBox="0 0 36 16">
      <Polyline
        points={open ? '9,10 18,4 27,10' : '9,5 18,11 27,5'}
        fill="none"
        stroke={stroke}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TopNav({
  visible,
  activeTab,
  onTabPress,
  onToggle,
}: {
  visible: boolean;
  activeTab: TopTab;
  onTabPress: (tab: TopTab) => void;
  onToggle: () => void;
}) {
  const anim = useRef(new RNAnimated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    RNAnimated.timing(anim, {
      toValue: visible ? 1 : 0,
      duration: 220,
      easing: RNEasing.out(RNEasing.cubic),
      useNativeDriver: false,
    }).start();
  }, [anim, visible]);

  const slotHeight = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLLAPSED_TOGGLE_HEIGHT, TOP_NAV_HEIGHT],
  });
  const panelOpacity = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  return (
    <RNAnimated.View style={[styles.topNavSlot, { height: slotHeight }]}>
      <RNAnimated.View
        pointerEvents={visible ? 'auto' : 'none'}
        style={[styles.topNavPanel, { opacity: panelOpacity }]}
      >
        {(['taptalk', 'tools', 'quick', 'setting'] as TopTab[]).map(tab => (
          <TopNavTab
            key={tab}
            tab={tab}
            active={activeTab === tab}
            onPress={() => onTabPress(tab)}
          />
        ))}
      </RNAnimated.View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={visible ? 'Hide top navigation' : 'Show top navigation'}
        onPress={onToggle}
        style={({ pressed }) => [
          styles.navToggle,
          visible ? styles.navToggleOpen : styles.navToggleClosed,
          !(visible || pressed) && styles.navToggleIdle,
        ]}
      >
        {({ pressed }) => <ToggleChevron open={visible} active={visible || pressed} />}
      </Pressable>
    </RNAnimated.View>
  );
}

export default function TalkScreen() {
  const { width } = useWindowDimensions();
  const rootRef = useRef<View>(null);
  const messageSlotRefs = useRef<Array<View | null>>([]);
  const ghostsRef = useRef<GhostTile[]>([]);
  const { state, dispatch } = useAppContext();
  const { speak, lastError, clearError } = useSpeech();
  // Default to open so first-time users can see the top nav is there.
  const [showTopNav, setShowTopNav] = useState(true);
  const [activeMode, setActiveMode] = useState<BoardMode>('home');
  const [previousMode, setPreviousMode] = useState<BoardMode | null>(null);
  const [activeTab, setActiveTab] = useState<TopTab>('taptalk');
  const [ghosts, setGhosts] = useState<GhostTile[]>([]);
  const scrollRef = useRef<ScrollView>(null);
  const scrollPositions = useRef<Partial<Record<BoardMode, number>>>({});
  const hapticIfEnabled = useCallback(() => {
    if (state.accessibility.hapticsEnabled !== false) hapticSelection();
  }, [state.accessibility.hapticsEnabled]);

  const boardWidth = Math.min(width, FIGMA_WIDTH);
  const tileSize = Math.min(
    TILE_SIZE,
    Math.floor((boardWidth - TILE_LEFT_PADDING * 2 - TILE_GAP * (BOARD_COLUMNS - 1)) / BOARD_COLUMNS),
  );
  const tiles = BOARD_TILES[activeMode];

  useEffect(() => {
    const y = scrollPositions.current[activeMode] ?? 0;
    scrollRef.current?.scrollTo({ y, animated: false });
  }, [activeMode]);
  const chipTileLookup = useMemo(() => {
    const lookup = new Map<string, BoardTile>();
    Object.values(BOARD_TILES).flat().forEach(tile => {
      lookup.set((tile.speech ?? tile.label).toLowerCase(), tile);
      lookup.set(tile.label.toLowerCase(), tile);
    });
    return lookup;
  }, []);
  const messageText = useMemo(
    () => state.messageWords.map(word => word.label).join(' '),
    [state.messageWords],
  );
  const hasWords = state.messageWords.length > 0;
  const visibleMessageWords = state.messageWords.slice(0, MESSAGE_SLOT_COUNT);

  const announce = useCallback((message: string) => {
    AccessibilityInfo.announceForAccessibility(message);
  }, []);

  const appendWord = useCallback((tile: BoardTile) => {
    const label = tile.speech ?? tile.label;
    dispatch({
      type: 'APPEND_WORD',
      payload: {
        id: `${tile.id}-${Date.now()}`,
        label,
        wordType: 'core',
        source: 'board',
      },
    });
    speak(label, { rate: state.accessibility.speechRate, pitch: state.accessibility.speechPitch });
    announce(`Added ${label}`);
  }, [announce, dispatch, speak]);

  const addGhost = useCallback((ghost: GhostTile) => {
    ghostsRef.current = [...ghostsRef.current, ghost];
    setGhosts(ghostsRef.current);
  }, []);

  const finishGhost = useCallback((ghostId: string) => {
    const ghost = ghostsRef.current.find(item => item.id === ghostId);
    ghostsRef.current = ghostsRef.current.filter(item => item.id !== ghostId);
    setGhosts(ghostsRef.current);

    if (!ghost) return;
    appendWord(ghost.tile);
    hapticIfEnabled();
  }, [appendWord, hapticIfEnabled]);

  const repeatMessage = useCallback(() => {
    if (!messageText.trim()) {
      announce('No message to speak');
      return;
    }
    speak(messageText, { rate: state.accessibility.speechRate, pitch: state.accessibility.speechPitch });
    announce(`Speaking: ${messageText}`);
  }, [announce, messageText, speak]);

  const clearMessage = useCallback(() => {
    ghostsRef.current = [];
    setGhosts([]);
    dispatch({ type: 'CLEAR_WORDS' });
    announce('Message cleared');
  }, [announce, dispatch]);

  const startGhostToMessage = useCallback((tile: BoardTile, fromRect: WindowRect | null) => {
    if (!fromRect) {
      appendWord(tile);
      return;
    }

    const targetIndex = Math.min(
      state.messageWords.length + ghostsRef.current.length,
      MESSAGE_SLOT_COUNT - 1,
    );
    const targetRef = messageSlotRefs.current[targetIndex];

    if (!targetRef || !rootRef.current) {
      appendWord(tile);
      return;
    }

    targetRef.measureInWindow((targetX, targetY, targetWidth, targetHeight) => {
      rootRef.current?.measureInWindow((rootX, rootY) => {
        addGhost({
          id: `${tile.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          tile,
          from: {
            x: fromRect.x - rootX,
            y: fromRect.y - rootY,
            width: fromRect.width,
            height: fromRect.height,
          },
          to: {
            x: targetX - rootX,
            y: targetY - rootY,
            width: targetWidth,
            height: targetHeight,
          },
          size: Math.round(tileSize * 0.92),
        });
      });
    });
  }, [addGhost, appendWord, state.messageWords.length, tileSize]);

  const navigateTo = useCallback((target: BoardMode) => {
    setPreviousMode(activeMode);
    setActiveMode(target);
    dispatch({ type: 'SET_BOARD', payload: target });
  }, [activeMode, dispatch]);

  const handleTilePress = useCallback((tile: BoardTile, rect: WindowRect | null) => {
    hapticIfEnabled();
    if (tile.id === 'back') {
      const dest = previousMode ?? 'home';
      setActiveMode(dest);
      setPreviousMode(null);
      dispatch({ type: 'SET_BOARD', payload: dest });
      announce('Back');
      return;
    }
    if (tile.id === 'home') {
      setActiveMode('home');
      setPreviousMode(null);
      setActiveTab('taptalk');
      dispatch({ type: 'SET_BOARD', payload: 'home' });
      announce('Home');
      return;
    }
    if (tile.kind === 'folder' && tile.target) {
      navigateTo(tile.target);
      announce(`${tile.label} folder`);
      return;
    }
    if (tile.kind === 'action') {
      if (tile.id.includes('clear')) clearMessage();
      if (tile.id.includes('repeat')) repeatMessage();
      if (tile.id === 'hide-nav') setShowTopNav(false);
      if (tile.id === 'home-settings') {
        setActiveMode('home');
        setPreviousMode(null);
        setActiveTab('taptalk');
        dispatch({ type: 'SET_BOARD', payload: 'home' });
      }
      return;
    }
    startGhostToMessage(tile, rect);
  }, [announce, clearMessage, dispatch, hapticIfEnabled, navigateTo, previousMode, repeatMessage, startGhostToMessage]);

  const handleTopTab = useCallback((tab: TopTab) => {
    hapticIfEnabled();
    setPreviousMode(null);
    setActiveTab(tab);
    if (tab === 'taptalk') setActiveMode('home');
    if (tab === 'tools') setActiveMode('tools');
    if (tab === 'quick') setActiveMode('quick');
    if (tab === 'setting') setActiveMode('settings');
  }, [hapticIfEnabled]);

  const handleSpeak = useCallback(() => {
    repeatMessage();
  }, [repeatMessage]);

  const handleBackspace = useCallback(() => {
    hapticIfEnabled();
    if (hasWords) {
      dispatch({ type: 'REMOVE_LAST_WORD' });
      return;
    }
    setActiveMode('home');
    setPreviousMode(null);
    setActiveTab('taptalk');
  }, [dispatch, hapticIfEnabled, hasWords]);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollPositions.current[activeMode] = e.nativeEvent.contentOffset.y;
    },
    [activeMode],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View ref={rootRef} style={styles.screenRoot}>
        {lastError ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss speech error"
            onPress={clearError}
            style={styles.errorBanner}
          >
            <Text style={styles.errorText}>Speech unavailable: {lastError.message}</Text>
          </Pressable>
        ) : null}

        <View style={styles.messageArea}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hasWords ? `Speak ${messageText}` : 'Tap symbols to build a sentence'}
            onPress={handleSpeak}
            style={styles.messageButton}
          >
            {!hasWords && ghosts.length === 0 ? (
              <Text style={[styles.messageText, styles.messagePlaceholder]} numberOfLines={1}>
                Tap to speak....
              </Text>
            ) : null}
            <View
              style={[
                styles.messageSlotRow,
                !hasWords && ghosts.length === 0 && styles.messageSlotRowHidden,
              ]}
            >
              {Array.from({ length: MESSAGE_SLOT_COUNT }).map((_, index) => {
                const word = visibleMessageWords[index];
                return (
                  <View
                    key={index}
                    ref={ref => {
                      messageSlotRefs.current[index] = ref;
                    }}
                    style={styles.messageSlot}
                  >
                    {word ? (
                      <MessageChip
                        label={word.label}
                        tile={chipTileLookup.get(word.label.toLowerCase())}
                      />
                    ) : null}
                  </View>
                );
              })}
            </View>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hasWords ? 'Backspace' : 'Return to home board'}
            onPress={handleBackspace}
            style={styles.backspace}
          >
            {/* Slightly heavier — bigger glyph reads stronger against
                the white message strip without changing the tap target. */}
            <BackspaceIcon size={56} />
          </Pressable>
        </View>

        <TopNav
          visible={showTopNav}
          activeTab={activeTab}
          onTabPress={handleTopTab}
          onToggle={() => {
            hapticIfEnabled();
            setShowTopNav(value => !value);
          }}
        />

        <ScrollView
          ref={scrollRef}
          style={styles.board}
          contentContainerStyle={[
            styles.boardContent,
            {
              paddingLeft: Math.max(TILE_LEFT_PADDING, (width - boardWidth) / 2 + TILE_LEFT_PADDING),
              paddingRight: Math.max(TILE_LEFT_PADDING, (width - boardWidth) / 2 + TILE_LEFT_PADDING),
            },
          ]}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={50}
        >
          {tiles.map(tile => (
            <BoardTileButton
              key={tile.id}
              tile={tile}
              size={tileSize}
              onPress={rect => handleTilePress(tile, rect)}
            />
          ))}
          {activeMode !== 'home' ? (
            <View
              style={[
                styles.navRow,
                {
                  paddingLeft: 0,
                  paddingRight: 0,
                  width: boardWidth - TILE_LEFT_PADDING * 2,
                },
              ]}
            >
              <BoardTileButton
                tile={BACK_TILE}
                size={tileSize}
                onPress={rect => handleTilePress(BACK_TILE, rect)}
              />
              <BoardTileButton
                tile={HOME_TILE}
                size={tileSize}
                onPress={rect => handleTilePress(HOME_TILE, rect)}
              />
            </View>
          ) : null}
        </ScrollView>

        <View pointerEvents="none" style={styles.ghostOverlay}>
          {ghosts.map(ghost => (
            <GhostTileClone key={ghost.id} ghost={ghost} onDone={finishGhost} />
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  screenRoot: {
    flex: 1,
  },
  errorBanner: {
    marginHorizontal: spacing.md,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.danger,
    borderRadius: 8,
  },
  errorText: {
    color: '#FFFFFF',
    fontWeight: '800',
    textAlign: 'center',
  },
  messageArea: {
    height: MESSAGE_HEIGHT,
    paddingLeft: 21,
    paddingRight: 17,
    paddingTop: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: 18,
    backgroundColor: colors.surface,
    borderBottomWidth: 1.4,
    borderBottomColor: colors.border,
  },
  messageButton: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
    position: 'relative',
  },
  messageText: {
    color: '#202020',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
  },
  messagePlaceholder: {
    color: '#A5A5A5',
    fontWeight: '400',
  },
  messageSlotRow: {
    position: 'absolute',
    left: 0,
    top: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: MESSAGE_SLOT_GAP,
  },
  messageSlotRowHidden: {
    opacity: 0,
  },
  messageSlot: {
    width: MESSAGE_CHIP_SIZE,
    height: MESSAGE_CHIP_SIZE,
  },
  messageChip: {
    width: MESSAGE_CHIP_SIZE,
    height: MESSAGE_CHIP_SIZE,
    position: 'relative',
  },
  messageChipBackground: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: MESSAGE_CHIP_SIZE,
    height: MESSAGE_CHIP_SIZE,
  },
  messageChipLabel: {
    position: 'absolute',
    left: 3,
    right: 3,
    top: 5,
    color: '#202020',
    fontSize: 8,
    lineHeight: 10,
    fontWeight: '800',
    textAlign: 'center',
  },
  backspace: {
    width: 58,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  topNavSlot: {
    position: 'relative',
    backgroundColor: colors.background,
    zIndex: 2,
  },
  topNavPanel: {
    marginHorizontal: 9.5,
    height: TOP_NAV_HEIGHT,
    borderLeftWidth: 1.6,
    borderRightWidth: 1.6,
    borderBottomWidth: 1.6,
    borderTopWidth: 0,
    borderColor: '#9A9A9A',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 10,
    paddingBottom: 9,
    paddingHorizontal: 10,
  },
  topTab: {
    width: 72,
    height: 57,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Slight opacity dip on touch — Pressable feedback while the scale/colour
  // animation handles the active state.
  topTabPressed: {
    opacity: 0.85,
  },
  topTabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  // Coloured icon overlay sits exactly on top of the idle icon so the
  // active tint can fade in without re-rendering layout.
  topTabIconOverlay: {
    position: 'absolute',
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTabLabel: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  navToggle: {
    position: 'absolute',
    left: '50%',
    marginLeft: -31,
    width: 62,
    height: 18,
    borderWidth: 2,
    borderColor: colors.primaryDark,
    backgroundColor: colors.softBlue,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
  },
  navToggleOpen: {
    top: -1,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  navToggleClosed: {
    top: -1,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  // Neutral idle look when closed and not being pressed — keeps the blue
  // strictly tied to pressed/active states without changing the open visuals.
  navToggleIdle: {
    borderColor: '#9A9A9A',
    backgroundColor: '#FFFFFF',
  },
  board: {
    flex: 1,
    backgroundColor: colors.background,
  },
  boardContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: TILE_GAP,
    rowGap: TILE_GAP,
    paddingTop: BOARD_TOP_GAP,
    paddingBottom: 28,
  },
  tilePressable: {
    width: '100%',
    height: '100%',
  },
  tilePressed: {
    opacity: 0.82,
  },
  tileShell: {
    position: 'relative',
  },
  tileBackground: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  folderLabel: {
    position: 'absolute',
    left: 5,
    right: 5,
    top: 8,
    color: '#202020',
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '400',
    textAlign: 'center',
  },
  symbolMount: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 38,
    bottom: 0,
  },
  wordTile: {
    position: 'relative',
  },
  // Flat coloured fill behind the symbol/label. Rounded corners match the
  // optical weight of the folder PNGs so word and folder tiles share a
  // visual rhythm.
  wordTileFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    borderRadius: 14,
  },
  // Typography mirrors `folderLabel` so words and folders read as one family.
  wordLabel: {
    position: 'absolute',
    left: 5,
    right: 5,
    top: 8,
    color: '#202020',
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '400',
    textAlign: 'center',
  },
  ghostOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
  ghostTile: {
    position: 'absolute',
  },
  navRow: {
    flexDirection: 'row',
    gap: TILE_GAP,
    marginTop: TILE_GAP,
  },
  navTileShell: {
    position: 'relative',
    backgroundColor: '#E8EBED',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTileIconMount: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTileLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B555C',
    textAlign: 'center',
    paddingBottom: 6,
  },
});
