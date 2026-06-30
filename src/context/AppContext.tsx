import React, { createContext, useReducer, useEffect, useCallback, useRef, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Action } from './types';
import { setHapticsEnabled } from '../utils/haptics';

const STORAGE_KEY = '@TapTalk_state';
const MAX_SAVE_RETRIES = 2;

export const initialState: AppState = {
  onboardingComplete: false,
  subscriptionComplete: false,
  signedIn: false,
  rememberLogin: true,
  profilePhotoUri: null,
  secureMethod: null,
  biometricsEnabled: false,
  accessibility: {
    textSize: 'default',
    buttonSize: 'standard',
    theme: 'system',
    highContrast: false,
    colorScheme: 'fitzgerald',
    speechRate: 0.9,
    speechPitch: 1.0,
    hapticsEnabled: true,
  },
  user: {
    legalName: '',
    displayName: '',
    email: '',
    name: '',
    nickname: '',
    age: null,
    role: null,
    useCases: [],
  },
  parent: {
    lockEnabled: true,
    pin: '',
    email: '',
    timeoutHours: null,
  },
  messageWords: [],
  currentBoard: 'main',
  keyboardText: '',
  boardLayouts: {},
  hiddenTileIds: [],
  tasks: [],
  lists: [],
  firstThen: { first: null, then: null },
  goals: [],
  talkStats: { totalWords: 0, sessionsToday: 0, streakDays: 0 },
  activityStats: { gamesPlayed: 0, minutesToday: 0 },
  habits: [],
};

function mergeStoredState(storedState: Partial<AppState>): AppState {
  return {
    ...initialState,
    ...storedState,
    user: {
      ...initialState.user,
      ...storedState.user,
    },
    parent: {
      ...initialState.parent,
      ...storedState.parent,
    },
    accessibility: {
      ...initialState.accessibility,
      ...storedState.accessibility,
    },
    boardLayouts: {
      ...initialState.boardLayouts,
      ...(storedState.boardLayouts ?? {}),
    },
    hiddenTileIds: storedState.hiddenTileIds ?? initialState.hiddenTileIds,
    firstThen: {
      ...initialState.firstThen,
      ...storedState.firstThen,
    },
    talkStats: {
      ...initialState.talkStats,
      ...storedState.talkStats,
    },
    activityStats: {
      ...initialState.activityStats,
      ...storedState.activityStats,
    },
  };
}

export interface HydrationError {
  phase: 'load' | 'save';
  message: string;
}

export const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
  hydrated: boolean;
  hydrationError: HydrationError | null;
  clearHydrationError: () => void;
}>({
  state: initialState,
  dispatch: () => null,
  hydrated: false,
  hydrationError: null,
  clearHydrationError: () => undefined,
});

export function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'HYDRATE':
      return mergeStoredState(action.payload);
    case 'SET_USER':
      return { ...state, user: { ...state.user, ...action.payload } };
    case 'SET_PARENT':
      return { ...state, parent: { ...state.parent, ...action.payload } };
    case 'COMPLETE_ONBOARDING':
      return { ...state, onboardingComplete: true };
    case 'COMPLETE_SUBSCRIPTION':
      return { ...state, subscriptionComplete: true };
    case 'SIGN_IN':
      return {
        ...state,
        signedIn: true,
        rememberLogin: action.payload.rememberLogin ?? state.rememberLogin,
        user: {
          ...state.user,
          email: action.payload.email,
          displayName: action.payload.displayName ?? state.user.displayName,
          nickname: action.payload.displayName ?? state.user.nickname,
        },
      };
    case 'SIGN_OUT':
      // Keep onboarding/accessibility prefs so the user isn't punished for
      // signing out — they're not signing up again.
      return {
        ...initialState,
        onboardingComplete: state.onboardingComplete,
        accessibility: state.accessibility,
        secureMethod: state.secureMethod,
        rememberLogin: false,
      };
    case 'SET_REMEMBER_LOGIN':
      return { ...state, rememberLogin: action.payload };
    case 'SET_SECURE_METHOD':
      return {
        ...state,
        secureMethod: action.payload.method,
        biometricsEnabled: action.payload.biometricsEnabled,
      };
    case 'SET_PROFILE_PHOTO':
      return { ...state, profilePhotoUri: action.payload };
    case 'SET_ACCESSIBILITY':
      return { ...state, accessibility: { ...state.accessibility, ...action.payload } };
    case 'APPEND_WORD':
      return { ...state, messageWords: [...state.messageWords, action.payload] };
    case 'CLEAR_WORDS':
      return { ...state, messageWords: [] };
    case 'REMOVE_LAST_WORD':
      return { ...state, messageWords: state.messageWords.slice(0, -1) };
    case 'REMOVE_WORD_AT_INDEX':
      return { ...state, messageWords: state.messageWords.filter((_, i) => i !== action.payload) };
    case 'SET_BOARD':
      return { ...state, currentBoard: action.payload };
    case 'SET_BOARD_ORDER':
      return {
        ...state,
        boardLayouts: {
          ...state.boardLayouts,
          [action.payload.board]: action.payload.order,
        },
      };
    case 'HIDE_TILE':
      return state.hiddenTileIds.includes(action.payload)
        ? state
        : { ...state, hiddenTileIds: [...state.hiddenTileIds, action.payload] };
    case 'RESTORE_TILE':
      return {
        ...state,
        hiddenTileIds: state.hiddenTileIds.filter((id) => id !== action.payload),
      };
    case 'SET_KEYBOARD_TEXT':
      return { ...state, keyboardText: action.payload };
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] };
    case 'TOGGLE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === action.payload
            ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : null }
            : t
        ),
      };
    case 'DELETE_TASK':
      return { ...state, tasks: state.tasks.filter(t => t.id !== action.payload) };
    case 'ADD_LIST':
      return { ...state, lists: [...state.lists, action.payload] };
    case 'ADD_LIST_ITEM':
      return {
        ...state,
        lists: state.lists.map(l =>
          l.id === action.payload.listId
            ? { ...l, items: [...l.items, action.payload.item] }
            : l
        ),
      };
    case 'TOGGLE_LIST_ITEM':
      return {
        ...state,
        lists: state.lists.map(l =>
          l.id === action.payload.listId
            ? {
                ...l,
                items: l.items.map(i =>
                  i.id === action.payload.itemId ? { ...i, completed: !i.completed } : i
                ),
              }
            : l
        ),
      };
    case 'SET_FIRST_THEN':
      return { ...state, firstThen: action.payload };
    case 'CLEAR_FIRST_THEN':
      return { ...state, firstThen: { first: null, then: null } };
    case 'ADD_GOAL':
      return { ...state, goals: [...state.goals, action.payload] };
    case 'UPDATE_GOAL':
      return {
        ...state,
        goals: state.goals.map(g => (g.id === action.payload.id ? action.payload : g)),
      };
    case 'TOGGLE_STEP':
      return {
        ...state,
        goals: state.goals.map(g =>
          g.id === action.payload.goalId
            ? {
                ...g,
                steps: g.steps.map(s =>
                  s.id === action.payload.stepId ? { ...s, completed: !s.completed } : s
                ),
              }
            : g
        ),
      };
    case 'ADD_STEP':
      return {
        ...state,
        goals: state.goals.map(g =>
          g.id === action.payload.goalId
            ? { ...g, steps: [...g.steps, action.payload.step] }
            : g
        ),
      };
    case 'INCREMENT_TALK_STATS':
      return {
        ...state,
        talkStats: {
          ...state.talkStats,
          totalWords: state.talkStats.totalWords + action.payload.wordsAdded,
        },
      };
    case 'INCREMENT_ACTIVITY_STATS':
      return {
        ...state,
        activityStats: {
          ...state.activityStats,
          gamesPlayed: state.activityStats.gamesPlayed + 1,
          minutesToday: state.activityStats.minutesToday + action.payload.minutes,
        },
      };
    case 'ADD_HABIT':
      return { ...state, habits: [...state.habits, action.payload] };
    case 'TOGGLE_HABIT_TODAY':
      return {
        ...state,
        habits: state.habits.map((h) => {
          if (h.id !== action.payload.id) return h;
          const already = h.completedDates.includes(action.payload.date);
          return {
            ...h,
            completedDates: already
              ? h.completedDates.filter((d) => d !== action.payload.date)
              : [...h.completedDates, action.payload.date],
          };
        }),
      };
    case 'DELETE_HABIT':
      return { ...state, habits: state.habits.filter((h) => h.id !== action.payload) };
    default:
      return state;
  }
}

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [hydrated, setHydrated] = useState(false);
  const [hydrationError, setHydrationError] = useState<HydrationError | null>(null);
  const saveRetries = useRef(0);

  const clearHydrationError = useCallback(() => setHydrationError(null), []);

  useEffect(() => {
    const loadState = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<AppState>;
          dispatch({ type: 'HYDRATE', payload: parsed });
        }
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Unknown load error';
        if (__DEV__) console.error('Failed to load state:', message);
        setHydrationError({ phase: 'load', message });
        try {
          await AsyncStorage.removeItem(STORAGE_KEY);
        } catch {
          // Storage may be entirely unavailable; nothing more to do.
        }
      } finally {
        setHydrated(true);
      }
    };
    loadState();
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    const saveState = async (attempt: number) => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        saveRetries.current = 0;
      } catch (e: unknown) {
        if (attempt < MAX_SAVE_RETRIES) {
          saveState(attempt + 1);
          return;
        }
        const message = e instanceof Error ? e.message : 'Unknown save error';
        if (__DEV__) console.error('Failed to save state after retries:', message);
        saveRetries.current = attempt;
        setHydrationError({ phase: 'save', message });
      }
    };

    saveState(0);
  }, [state, hydrated]);

  // Sync the user's "Haptic Feedback" preference into the haptics helper so
  // every hapticSelection/hapticLight/etc call respects it without each
  // caller having to read context.
  useEffect(() => {
    setHapticsEnabled(state.accessibility.hapticsEnabled);
  }, [state.accessibility.hapticsEnabled]);

  return (
    <AppContext.Provider value={{ state, dispatch, hydrated, hydrationError, clearHydrationError }}>
      {children}
    </AppContext.Provider>
  );
};
