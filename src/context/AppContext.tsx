import React, { createContext, useReducer, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Action } from './types';

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

export const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
  hydrated: boolean;
}>({
  state: initialState,
  dispatch: () => null,
  hydrated: false,
});

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'HYDRATE':
      return action.payload;
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

  useEffect(() => {
    const loadState = async () => {
      try {
        const storedState = await AsyncStorage.getItem('@TapTalk_state');
        if (storedState) {
          dispatch({ type: 'HYDRATE', payload: JSON.parse(storedState) });
        }
      } catch (e) {
        console.error('Failed to load state', e);
      } finally {
        setHydrated(true);
      }
    };
    loadState();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const saveState = async () => {
      try {
        await AsyncStorage.setItem('@TapTalk_state', JSON.stringify(state));
      } catch (e) {
        console.error('Failed to save state', e);
      }
    };
    saveState();
  }, [state, hydrated]);

  return (
    <AppContext.Provider value={{ state, dispatch, hydrated }}>
      {children}
    </AppContext.Provider>
  );
};
