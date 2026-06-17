export interface AppState {
  onboardingComplete: boolean;
  subscriptionComplete: boolean;
  signedIn: boolean;
  user: {
    legalName: string;
    displayName: string;
    email: string;
    name: string;
    nickname: string;
    age: number | null;
    role: 'myself' | 'parent' | 'support' | 'guardian' | null;
    useCases: string[];
  };
  parent: {
    lockEnabled: boolean;
    pin: string;
    email: string;
    timeoutHours: number | null;
  };

  // Talk
  messageWords: AACWord[];
  currentBoard: string;
  keyboardText: string;

  // Today — Tasks
  tasks: Task[];

  // Today — Lists (List tool)
  lists: TapTalkList[];

  // Today — First-Then (persists last selection)
  firstThen: { first: string | null; then: string | null };

  // Progress / Goals
  goals: Goal[];
  talkStats: { totalWords: number; sessionsToday: number; streakDays: number };
  activityStats: { gamesPlayed: number; minutesToday: number };
}

export interface AACWord {
  id: string;
  label: string;
  wordType: 'pronoun' | 'verb' | 'preposition' | 'qualifier' | 'core' | 'folder';
  emoji?: string; // placeholder until Mulberry symbols loaded
}

export interface TaskTag {
  id: string;
  color: string;
}

export interface Reminder {
  id: string;
  dateTime: string;
  notificationId?: string;
}

export interface Task {
  id: string;
  name: string;
  description: string;
  tags: TaskTag[];
  dueDate: string | null;
  startDate: string | null;
  reminders: Reminder[];
  completed: boolean;
  completedAt: string | null;
}

export interface TapTalkList {
  id: string;
  name: string;
  items: ListItem[];
}

export interface ListItem {
  id: string;
  text: string;
  completed: boolean;
  reminder: string | null;
  notificationId?: string;
}

export interface Goal {
  id: string;
  name: string;
  description: string;
  why: string;
  deadline: string | null;
  reminder: string | null;
  notificationId?: string;
  encouragementMessage: string;
  steps: GoalStep[];
}

export interface GoalStep {
  id: string;
  name: string;
  howToAchieve: string;
  achieveBy: string | null;
  completed: boolean;
}

export type Action =
  | { type: 'HYDRATE'; payload: Partial<AppState> }
  | { type: 'SET_USER'; payload: Partial<AppState['user']> }
  | { type: 'SET_PARENT'; payload: Partial<AppState['parent']> }
  | { type: 'COMPLETE_ONBOARDING' }
  | { type: 'COMPLETE_SUBSCRIPTION' }
  | { type: 'SIGN_IN'; payload: { email: string; displayName?: string } }
  | { type: 'SIGN_OUT' }
  | { type: 'APPEND_WORD'; payload: AACWord }
  | { type: 'CLEAR_WORDS' }
  | { type: 'REMOVE_LAST_WORD' }
  | { type: 'SET_BOARD'; payload: string }
  | { type: 'SET_KEYBOARD_TEXT'; payload: string }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'TOGGLE_TASK'; payload: string }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'ADD_LIST'; payload: TapTalkList }
  | { type: 'ADD_LIST_ITEM'; payload: { listId: string; item: ListItem } }
  | { type: 'TOGGLE_LIST_ITEM'; payload: { listId: string; itemId: string } }
  | { type: 'SET_FIRST_THEN'; payload: { first: string | null; then: string | null } }
  | { type: 'CLEAR_FIRST_THEN' }
  | { type: 'ADD_GOAL'; payload: Goal }
  | { type: 'UPDATE_GOAL'; payload: Goal }
  | { type: 'TOGGLE_STEP'; payload: { goalId: string; stepId: string } }
  | { type: 'ADD_STEP'; payload: { goalId: string; step: GoalStep } }
  | { type: 'INCREMENT_TALK_STATS'; payload: { wordsAdded: number } }
  | { type: 'INCREMENT_ACTIVITY_STATS'; payload: { minutes: number } };
