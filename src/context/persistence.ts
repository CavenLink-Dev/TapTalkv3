import type { AppState } from './types';

/** Legacy monolithic blob — migrated on first load. */
export const LEGACY_STORAGE_KEY = '@TapTalk_state';

/** High-churn AAC / accessibility slice — saved on a short debounce. */
export const HOT_STORAGE_KEY = '@TapTalk_state_hot';

/** Profile, lists, habits, etc. — saved on a longer debounce. */
export const COLD_STORAGE_KEY = '@TapTalk_state_cold';

export type HotPersistedState = Pick<
  AppState,
  | 'messageWords'
  | 'currentBoard'
  | 'keyboardText'
  | 'accessibility'
  | 'firstThen'
  | 'talkStats'
  | 'boardLayouts'
  | 'hiddenTileIds'
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
      hiddenTileIds: state.hiddenTileIds,
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
    },
  };
}

export function mergePersistedSlices(
  hot: Partial<HotPersistedState>,
  cold: Partial<ColdPersistedState>,
): Partial<AppState> {
  return { ...cold, ...hot };
}

export function isHotAction(type: string): boolean {
  switch (type) {
    case 'APPEND_WORD':
    case 'CLEAR_WORDS':
    case 'REMOVE_LAST_WORD':
    case 'REMOVE_WORD_AT_INDEX':
    case 'SET_BOARD':
    case 'SET_BOARD_ORDER':
    case 'HIDE_TILE':
    case 'RESTORE_TILE':
    case 'SET_KEYBOARD_TEXT':
    case 'SET_ACCESSIBILITY':
    case 'SET_FIRST_THEN':
    case 'CLEAR_FIRST_THEN':
    case 'INCREMENT_TALK_STATS':
      return true;
    default:
      return false;
  }
}
