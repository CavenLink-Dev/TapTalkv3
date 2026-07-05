import type { Action, AppState } from './types';

/** Legacy monolithic blob — migrated on first load. */
export const LEGACY_STORAGE_KEY = '@TapTalk_state';

/** High-churn AAC / accessibility slice — saved on a short debounce. */
export const HOT_STORAGE_KEY = '@TapTalk_state_hot';

/** Profile, lists, habits, etc. — saved on a longer debounce. */
export const COLD_STORAGE_KEY = '@TapTalk_state_cold';

export type PersistenceTarget = 'hot' | 'cold' | 'both' | 'none';

export type HotPersistedState = Pick<
  AppState,
  | 'messageWords'
  | 'currentBoard'
  | 'keyboardText'
  | 'accessibility'
  | 'firstThen'
  | 'talkStats'
  | 'boardLayouts'
  | 'boardPlacements'
  | 'customBoardTiles'
  | 'hiddenTileIds'
  | 'sentenceHistory'
  | 'tileTapCounts'
  | 'tileLastTappedAt'
  | 'ngramModel'
>;

export type ColdPersistedState = Pick<
  AppState,
  | 'onboardingComplete'
  | 'subscriptionComplete'
  | 'signedIn'
  | 'rememberLogin'
  | 'profilePhotoUri'
  | 'secureMethod'
  | 'biometricsEnabled'
  | 'user'
  | 'parent'
  | 'tasks'
  | 'lists'
  | 'goals'
  | 'activityStats'
  | 'habits'
  | 'showUsageHeatmap'
  | 'pronunciations'
  | 'passport'
>;

export function splitAppState(state: AppState): {
  hot: HotPersistedState;
  cold: ColdPersistedState;
} {
  return {
    hot: {
      messageWords: state.messageWords,
      currentBoard: state.currentBoard,
      keyboardText: state.keyboardText,
      accessibility: state.accessibility,
      firstThen: state.firstThen,
      talkStats: state.talkStats,
      boardLayouts: state.boardLayouts,
      boardPlacements: state.boardPlacements,
      customBoardTiles: state.customBoardTiles,
      hiddenTileIds: state.hiddenTileIds,
      sentenceHistory: state.sentenceHistory,
      tileTapCounts: state.tileTapCounts,
      tileLastTappedAt: state.tileLastTappedAt,
      ngramModel: state.ngramModel,
    },
    cold: {
      onboardingComplete: state.onboardingComplete,
      subscriptionComplete: state.subscriptionComplete,
      signedIn: state.signedIn,
      rememberLogin: state.rememberLogin,
      profilePhotoUri: state.profilePhotoUri,
      secureMethod: state.secureMethod,
      biometricsEnabled: state.biometricsEnabled,
      user: state.user,
      parent: state.parent,
      tasks: state.tasks,
      lists: state.lists,
      goals: state.goals,
      activityStats: state.activityStats,
      habits: state.habits,
      showUsageHeatmap: state.showUsageHeatmap,
      pronunciations: state.pronunciations,
      passport: state.passport,
    },
  };
}

export function mergePersistedSlices(
  hot: Partial<HotPersistedState>,
  cold: Partial<ColdPersistedState>,
): Partial<AppState> {
  return { ...cold, ...hot };
}

export function persistenceTargetForAction(type: Action['type']): PersistenceTarget {
  switch (type) {
    case 'HYDRATE':
      return 'none';
    case 'APPEND_WORD':
    case 'CLEAR_WORDS':
    case 'REMOVE_LAST_WORD':
    case 'REMOVE_WORD_AT_INDEX':
    case 'SET_BOARD':
    case 'SET_BOARD_ORDER':
    case 'SET_BOARD_PLACEMENTS':
    case 'UPSERT_CUSTOM_BOARD_TILE':
    case 'HIDE_TILE':
    case 'RESTORE_TILE':
    case 'SET_KEYBOARD_TEXT':
    case 'SET_ACCESSIBILITY':
    case 'SET_FIRST_THEN':
    case 'CLEAR_FIRST_THEN':
    case 'INCREMENT_TALK_STATS':
    case 'PUSH_SENTENCE_HISTORY':
    case 'INCREMENT_TILE_TAP':
    case 'UPDATE_NGRAM_MODEL':
      return 'hot';
    case 'SET_USER':
    case 'SET_PARENT':
    case 'COMPLETE_ONBOARDING':
    case 'COMPLETE_SUBSCRIPTION':
    case 'SIGN_IN':
    case 'SIGN_OUT':
    case 'SET_REMEMBER_LOGIN':
    case 'SET_SECURE_METHOD':
    case 'SET_PROFILE_PHOTO':
    case 'ADD_TASK':
    case 'TOGGLE_TASK':
    case 'DELETE_TASK':
    case 'ADD_LIST':
    case 'ADD_LIST_ITEM':
    case 'TOGGLE_LIST_ITEM':
    case 'ADD_GOAL':
    case 'UPDATE_GOAL':
    case 'TOGGLE_STEP':
    case 'ADD_STEP':
    case 'INCREMENT_ACTIVITY_STATS':
    case 'ADD_HABIT':
    case 'TOGGLE_HABIT_TODAY':
    case 'DELETE_HABIT':
    case 'SET_SHOW_USAGE_HEATMAP':
    case 'ADD_PRONUNCIATION':
    case 'DELETE_PRONUNCIATION':
    case 'SET_PASSPORT':
      return 'cold';
    default:
      return 'both';
  }
}

export function isHotAction(type: string): boolean {
  const target = persistenceTargetForAction(type as Action['type']);
  return target === 'hot' || target === 'both';
}
