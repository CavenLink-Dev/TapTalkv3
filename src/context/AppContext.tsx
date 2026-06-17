import React, { createContext, useReducer, useEffect, useCallback, useRef, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Action } from './types';

const STORAGE_KEY = '@TapTalk_state';
const MAX_SAVE_RETRIES = 2;

const initialState: AppState = {
  onboardingComplete: false,
  subscriptionComplete: false,
  signedIn: false,
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
  tasks: [],
  lists: [],
  firstThen: { first: null, then: null },
  goals: [],
  talkStats: { totalWords: 0, sessionsToday: 0, streakDays: 0 },
  activityStats: { gamesPlayed: 0, minutesToday: 0 },
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

function appReducer(state: AppState, action: Action): AppState {
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
        user: {
          ...state.user,
          email: action.payload.email,
          displayName: action.payload.displayName ?? state.user.displayName,
          nickname: action.payload.displayName ?? state.user.nickname,
        },
      };
    case 'SIGN_OUT':
      return {
        ...initialState,
        onboardingComplete: false,
      };
    case 'APPEND_WORD':
      return { ...state, messageWords: [...state.messageWords, action.payload] };
    case 'CLEAR_WORDS':
      return { ...state, messageWords: [] };
    case 'REMOVE_LAST_WORD':
      return { ...state, messageWords: state.messageWords.slice(0, -1) };
    case 'SET_BOARD':
      return { ...state, currentBoard: action.payload };
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
        console.error('Failed to load state:', message);
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
        console.error('Failed to save state after retries:', message);
        saveRetries.current = attempt;
        setHydrationError({ phase: 'save', message });
      }
    };

    saveState(0);
  }, [state, hydrated]);

  return (
    <AppContext.Provider value={{ state, dispatch, hydrated, hydrationError, clearHydrationError }}>
      {children}
    </AppContext.Provider>
  );
};
