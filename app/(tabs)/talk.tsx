import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated as RNAnimated,
  Easing as RNEasing,
  Image,
  LayoutRectangle,
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
import { BackspaceIcon } from '../../src/components/icons/FigmaIcons';
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
const BOARD_TOP_GAP = 16;
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

const TOP_TAB_ASSETS = {
  taptalk: {
    icon: require('../../assets/top_bar/taptalk-icon.png'),
    label: require('../../assets/top_bar/taptalk-label.png'),
    iconSize: { width: 49, height: 35 },
    labelSize: { width: 52, height: 9 },
  },
  tools: {
    icon: require('../../assets/top_bar/tools-icon.png'),
    label: require('../../assets/top_bar/tools-label.png'),
    iconSize: { width: 33, height: 33 },
    labelSize: { width: 39, height: 9 },
  },
  quick: {
    icon: require('../../assets/top_bar/quick-icon.png'),
    label: require('../../assets/top_bar/quick-label.png'),
    iconSize: { width: 34, height: 34 },
    labelSize: { width: 37, height: 10 },
  },
  setting: {
    icon: require('../../assets/top_bar/setting-icon.png'),
    label: require('../../assets/top_bar/setting-label.png'),
    iconSize: { width: 31, height: 30 },
    labelSize: { width: 50, height: 9 },
  },
} as const;

const HOME_TILES: BoardTile[] = [
  { id: 'people', label: 'People', kind: 'folder', target: 'quick', color: '#1DCDFF', background: 'folderExample' },
  { id: 'foods', label: 'Foods', kind: 'folder', target: 'foods', color: '#1DCDFF', background: 'folderExample' },
  { id: 'places', label: 'Places', kind: 'folder', target: 'animals', color: '#1DCDFF', background: 'folderExample' },
  { id: 'actions', label: 'Actions', kind: 'folder', target: 'tools', color: '#1DCDFF', background: 'folderExample' },
];

const BOARD_TILES: Record<BoardMode, BoardTile[]> = {
  home: HOME_TILES,
  foods: [
    { id: 'cheese', label: 'Cheese', kind: 'word', color: '#1DCDFF', speech: 'cheese' },
    { id: 'apple', label: 'Apple', kind: 'word', color: '#1DCDFF', speech: 'apple' },
    { id: 'bread', label: 'Bread', kind: 'word', color: '#706820', speech: 'bread' },
    { id: 'back-foods', label: 'Home', kind: 'folder', target: 'home', color: '#3C673E' },
  ],
  animals: [
    { id: 'cat', label: 'Cat', kind: 'word', color: '#1DCDFF', speech: 'cat' },
    { id: 'dog', label: 'Dog', kind: 'word', color: '#1DCDFF', speech: 'dog' },
    { id: 'fish', label: 'Fish', kind: 'word', color: '#416670', speech: 'fish' },
    { id: 'back-animals', label: 'Home', kind: 'folder', target: 'home', color: '#4B5C68' },
  ],
  tools: [
    { id: 'loud-tool', label: 'Loud', kind: 'word', color: '#C7E4EF', speech: 'loud' },
    { id: 'quiet', label: 'Quiet', kind: 'word', color: '#C7E4EF', speech: 'quiet' },
    { id: 'repeat', label: 'Repeat', kind: 'action', color: '#703232' },
    { id: 'clear-tool', label: 'Clear', kind: 'action', color: '#7A3D3D' },
  ],
  quick: [
    { id: 'yes', label: 'Yes', kind: 'word', color: '#3C673E', speech: 'yes' },
    { id: 'no', label: 'No', kind: 'word', color: '#703232', speech: 'no' },
    { id: 'help', label: 'Help', kind: 'word', color: '#3E486B', speech: 'help' },
    { id: 'stop', label: 'Stop', kind: 'word', color: '#6A2E65', speech: 'stop' },
  ],
  settings: [
    { id: 'hide-nav', label: 'Hide nav', kind: 'action', color: '#4B5C68' },
    { id: 'clear-settings', label: 'Clear', kind: 'action', color: '#7A3D3D' },
    { id: 'home-settings', label: 'Home', kind: 'folder', target: 'home', color: '#1DCDFF' },
    { id: 'repeat-settings', label: 'Repeat', kind: 'action', color: '#703232' },
  ],
};

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

function wordBackgroundForTile(tile: BoardTile) {
  if (tile.background) return TILE_ASSETS[tile.background];
  if (tile.color === '#DCC1F1') return TILE_ASSETS.straw;
  if (tile.color === '#3C673E') return TILE_ASSETS.green;
  if (tile.color === '#703232' || tile.color === '#7A3D3D' || tile.color === '#6A2E65') {
    return TILE_ASSETS.red;
  }
  return TILE_ASSETS.loud;
}

function BoardWordTile({ tile, size }: { tile: BoardTile; size: number }) {
  return (
    <View style={[styles.wordTile, { width: size, height: size }]}>
      <Image
        source={wordBackgroundForTile(tile)}
        resizeMode="stretch"
        style={[styles.tileBackground, { width: size, height: size }]}
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

  const tileHeight = tile.kind === 'folder' ? Math.round(size * FOLDER_HEIGHT_RATIO) : size;

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
        accessibilityLabel={tile.kind === 'folder' ? `Open ${tile.label}` : `Say ${tile.label}`}
        onPress={handlePress}
        onPressIn={() => animateTo(0.94)}
        onPressOut={() => animateTo(1)}
        style={({ pressed }) => [styles.tilePressable, pressed && styles.tilePressed]}
      >
        {tile.kind === 'folder' ? (
          <BoardFolderTile tile={tile} size={size} />
        ) : (
          <BoardWordTile tile={tile} size={size} />
        )}
      </Pressable>
    </RNAnimated.View>
  );
}

function TopNavIcon({ tab }: { tab: TopTab }) {
  const assets = TOP_TAB_ASSETS[tab];

  return (
    <View style={styles.topTabContent}>
      <Image
        source={assets.icon}
        resizeMode="contain"
        style={[styles.topTabIconImage, assets.iconSize]}
      />
      <Image
        source={assets.label}
        resizeMode="contain"
        style={[styles.topTabLabelImage, assets.labelSize]}
      />
    </View>
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
          <Pressable
            key={tab}
            accessibilityRole="button"
            accessibilityLabel={`${tab} top tab`}
            onPress={() => onTabPress(tab)}
            style={[styles.topTab, activeTab === tab && styles.topTabActive]}
          >
            <TopNavIcon tab={tab} />
          </Pressable>
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
  const [activeTab, setActiveTab] = useState<TopTab>('taptalk');
  const [ghosts, setGhosts] = useState<GhostTile[]>([]);

  const boardWidth = Math.min(width, FIGMA_WIDTH);
  const tileSize = Math.min(
    TILE_SIZE,
    Math.floor((boardWidth - TILE_LEFT_PADDING * 2 - TILE_GAP * (BOARD_COLUMNS - 1)) / BOARD_COLUMNS),
  );
  const tiles = BOARD_TILES[activeMode];
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
    hapticSelection();
  }, [appendWord]);

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

  const handleTilePress = useCallback((tile: BoardTile, rect: WindowRect | null) => {
    hapticSelection();
    if (tile.kind === 'folder' && tile.target) {
      setActiveMode(tile.target);
      dispatch({ type: 'SET_BOARD', payload: tile.target });
      announce(`${tile.label} folder`);
      return;
    }
    if (tile.kind === 'action') {
      if (tile.id.includes('clear')) clearMessage();
      if (tile.id.includes('repeat')) repeatMessage();
      if (tile.id === 'hide-nav') setShowTopNav(false);
      return;
    }
    startGhostToMessage(tile, rect);
  }, [announce, clearMessage, dispatch, repeatMessage, startGhostToMessage]);

  const handleTopTab = useCallback((tab: TopTab) => {
    hapticSelection();
    setActiveTab(tab);
    if (tab === 'taptalk') setActiveMode('home');
    if (tab === 'tools') setActiveMode('tools');
    if (tab === 'quick') setActiveMode('quick');
    if (tab === 'setting') setActiveMode('settings');
  }, []);

  const handleSpeak = useCallback(() => {
    repeatMessage();
  }, [repeatMessage]);

  const handleBackspace = useCallback(() => {
    hapticSelection();
    if (hasWords) {
      dispatch({ type: 'REMOVE_LAST_WORD' });
      return;
    }
    setActiveMode('home');
    setActiveTab('taptalk');
  }, [dispatch, hasWords]);

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
            <BackspaceIcon size={50} />
          </Pressable>
        </View>

        <TopNav
          visible={showTopNav}
          activeTab={activeTab}
          onTabPress={handleTopTab}
          onToggle={() => {
            hapticSelection();
            setShowTopNav(value => !value);
          }}
        />

        <ScrollView
          style={styles.board}
          contentContainerStyle={[
            styles.boardContent,
            {
              paddingLeft: Math.max(TILE_LEFT_PADDING, (width - boardWidth) / 2 + TILE_LEFT_PADDING),
              paddingRight: Math.max(TILE_LEFT_PADDING, (width - boardWidth) / 2 + TILE_LEFT_PADDING),
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {tiles.map(tile => (
            <BoardTileButton
              key={tile.id}
              tile={tile}
              size={tileSize}
              onPress={rect => handleTilePress(tile, rect)}
            />
          ))}
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
    opacity: 1,
  },
  topTabActive: {
    opacity: 1,
  },
  topTabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTabIconImage: {
    marginBottom: 2,
  },
  topTabLabelImage: {
    marginTop: 0,
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
    top: 12,
    color: '#202020',
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  symbolMount: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 29,
    bottom: 0,
  },
  wordTile: {
    position: 'relative',
  },
  wordLabel: {
    position: 'absolute',
    left: 5,
    right: 5,
    top: 10,
    color: '#202020',
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  ghostOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
  ghostTile: {
    position: 'absolute',
  },
});
