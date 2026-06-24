import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useState } from 'react';
import {
  AccessibilityInfo,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackspaceIcon } from '../../src/components/icons/FigmaIcons';
import { AACCell, BOARDS, HOME_BOARD_ID } from '../../src/data/aacBoards';
import { useAppContext } from '../../src/hooks/useAppContext';
import { useSpeech } from '../../src/hooks/useSpeech';
import { colors, spacing } from '../../src/theme/tokens';
import { hapticSelection } from '../../src/utils/haptics';

const BOARD_COLUMNS = 4;
const BOARD_GAP = 4;
const BOARD_PADDING = 17;

function FolderIcon() {
  return (
    <View style={styles.folderIcon}>
      <View style={[styles.folderPage, styles.folderPageBack]} />
      <View style={[styles.folderPage, styles.folderPageMiddle]} />
      <View style={styles.folderFront}>
        <Text style={styles.folderText}>Folder</Text>
      </View>
    </View>
  );
}

function BoardCell({
  cell,
  size,
  selected,
  onPress,
}: {
  cell: AACCell;
  size: number;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={cell.kind === 'folder' ? `Open ${cell.label}` : `Say ${cell.label}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.cell,
        {
          width: size,
          height: size,
          opacity: pressed ? 0.76 : 1,
          borderColor: selected ? colors.primary : '#111111',
        },
      ]}
    >
      {cell.kind === 'folder' ? (
        <FolderIcon />
      ) : (
        <>
          {cell.emoji ? <Text style={styles.cellEmoji}>{cell.emoji}</Text> : null}
          <Text style={styles.cellLabel} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.68}>
            {cell.label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

export default function TalkScreen() {
  const { width } = useWindowDimensions();
  const { state, dispatch } = useAppContext();
  const { speak, lastError, clearError } = useSpeech();
  const [activeBoardId, setActiveBoardId] = useState(HOME_BOARD_ID);

  const board = BOARDS[activeBoardId] ?? BOARDS[HOME_BOARD_ID]!;
  const messageText = useMemo(
    () => state.messageWords.map(word => word.label).join(' '),
    [state.messageWords],
  );
  const hasWords = state.messageWords.length > 0;
  const shownCells = useMemo(() => {
    const firstCells = board.cells.slice(0, activeBoardId === HOME_BOARD_ID ? 2 : 8);
    return [
      ...firstCells,
      {
        id: `${board.id}-folder`,
        label: 'Folder',
        kind: 'folder',
        wordType: 'folder',
        targetId: activeBoardId === HOME_BOARD_ID ? 'actions' : HOME_BOARD_ID,
      } satisfies AACCell,
    ];
  }, [activeBoardId, board]);

  const cellSize = Math.floor(
    (width - BOARD_PADDING * 2 - BOARD_GAP * (BOARD_COLUMNS - 1)) / BOARD_COLUMNS,
  );

  const announce = useCallback((message: string) => {
    AccessibilityInfo.announceForAccessibility(message);
  }, []);

  const openBoard = useCallback((boardId: string) => {
    hapticSelection();
    setActiveBoardId(boardId);
    dispatch({ type: 'SET_BOARD', payload: boardId });
  }, [dispatch]);

  const addCell = useCallback((cell: AACCell) => {
    hapticSelection();
    if (cell.kind === 'folder') {
      openBoard(cell.targetId ?? HOME_BOARD_ID);
      return;
    }

    dispatch({
      type: 'APPEND_WORD',
      payload: {
        id: `${cell.id}-${Date.now()}`,
        label: cell.label,
        wordType: 'core',
        emoji: cell.emoji,
        source: 'board',
      },
    });
    speak(cell.label, { rate: 0.9 });
    announce(`Added ${cell.label}`);
  }, [announce, dispatch, openBoard, speak]);

  const handleSpeak = useCallback(() => {
    if (!messageText.trim()) {
      announce('No message to speak');
      return;
    }
    hapticSelection();
    speak(messageText, { rate: 0.9 });
    announce(`Speaking: ${messageText}`);
  }, [announce, messageText, speak]);

  const handleBackspace = useCallback(() => {
    if (!hasWords) return;
    hapticSelection();
    dispatch({ type: 'REMOVE_LAST_WORD' });
  }, [dispatch, hasWords]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
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
          <Text
            style={[styles.messageText, !hasWords && styles.messagePlaceholder]}
            numberOfLines={2}
          >
            {hasWords ? messageText : 'Tap to speak....'}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Backspace"
          disabled={!hasWords}
          onPress={handleBackspace}
          style={[styles.backspace, !hasWords && styles.backspaceIdle]}
        >
          <BackspaceIcon size={48} />
        </Pressable>
      </View>

      <View style={styles.actionBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Home board"
          onPress={() => openBoard(HOME_BOARD_ID)}
          style={styles.homeButton}
        >
          <Text style={styles.homeButtonText}>Home</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open next folder"
          onPress={() => openBoard(activeBoardId === HOME_BOARD_ID ? 'actions' : HOME_BOARD_ID)}
          style={styles.addButton}
        >
          <MaterialCommunityIcons name="plus" color="#FFFFFF" size={42} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.board}
        contentContainerStyle={styles.boardContent}
        showsVerticalScrollIndicator={false}
      >
        {shownCells.map(cell => (
          <BoardCell
            key={cell.id}
            cell={cell}
            size={cellSize}
            selected={state.messageWords.some(word => word.label === cell.label)}
            onPress={() => addCell(cell)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    minHeight: 162,
    paddingLeft: 17,
    paddingRight: 25,
    paddingTop: 42,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 2,
    borderBottomColor: '#8D8D8D',
  },
  messageButton: {
    flex: 1,
    minHeight: 72,
    justifyContent: 'center',
  },
  messageText: {
    color: '#202020',
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '700',
  },
  messagePlaceholder: {
    color: '#A7A7A7',
    fontWeight: '400',
  },
  backspace: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  backspaceIdle: {
    opacity: 1,
  },
  actionBar: {
    height: 70,
    paddingHorizontal: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 2,
    borderBottomColor: '#8D8D8D',
  },
  homeButton: {
    height: 45,
    minWidth: 83,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  homeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  addButton: {
    width: 45,
    height: 45,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  board: {
    flex: 1,
    backgroundColor: '#E7E9EC',
  },
  boardContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: BOARD_GAP,
    paddingHorizontal: BOARD_PADDING,
    paddingTop: 20,
    paddingBottom: 24,
  },
  cell: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  cellEmoji: {
    fontSize: 23,
    marginBottom: 3,
  },
  cellLabel: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  folderIcon: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  folderPage: {
    position: 'absolute',
    left: 9,
    right: 5,
    height: 52,
    borderWidth: 2,
    borderColor: '#222222',
    backgroundColor: '#FFFFFF',
  },
  folderPageBack: {
    top: 0,
  },
  folderPageMiddle: {
    top: 5,
    left: 6,
  },
  folderFront: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 58,
    borderWidth: 2,
    borderRadius: 4,
    borderColor: '#222222',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  folderText: {
    color: '#111111',
    fontSize: 18,
    fontWeight: '900',
  },
});
