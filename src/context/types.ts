export interface AppState {
  onboardingComplete: boolean;
  subscriptionComplete: boolean;
  signedIn: boolean;
  /**
   * "Keep me signed in" preference set on the login screen.
   * When true, the app skips the login screen on subsequent launches.
   * When false, the user is asked to sign in every cold start (even though
   * their account record stays on disk).
   */
  rememberLogin: boolean;
  /** Photo (file:// URI) the user picked in registration Step 9. Optional. */
  profilePhotoUri: string | null;
  /**
   * Which secure-access method the user chose. Drives the login UX — passkey
   * means future logins use biometrics; password means show the password
   * field as today.
   */
  secureMethod: 'passkey' | 'password' | null;
  biometricsEnabled: boolean;
  accessibility: {
    textSize: 'default' | 'large' | 'xlarge' | 'maximum';
    buttonSize: 'standard' | 'large';
    theme: 'light' | 'dark' | 'system';
    highContrast: boolean;
    colorScheme: 'fitzgerald' | 'cvd_safe';
    /** Expo Speech rate. Range 0.5 to 1.5. Default 0.9. */
    speechRate: number;
    /** Expo Speech pitch. Range 0.5 to 2.0. Default 1.0. */
    speechPitch: number;
    /** Whether haptic feedback fires on taps. Default true. */
    hapticsEnabled: boolean;
  };
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

  // Today — Habits
  habits: Habit[];
}

export interface AACWord {
  id: string;
  label: string;
  wordType: 'pronoun' | 'verb' | 'preposition' | 'qualifier' | 'core' | 'folder';
  emoji?: string; // placeholder until Mulberry symbols loaded
  conceptId?: string;
  symbolId?: string;
  source?: 'board' | 'suggestion' | 'typed';
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

export interface Habit {
  id: string;
  name: string;
  completedDates: string[]; // ISO date strings 'YYYY-MM-DD'
}

export type Action =
  | { type: 'HYDRATE'; payload: Partial<AppState> }
  | { type: 'SET_USER'; payload: Partial<AppState['user']> }
  | { type: 'SET_PARENT'; payload: Partial<AppState['parent']> }
  | { type: 'COMPLETE_ONBOARDING' }
  | { type: 'COMPLETE_SUBSCRIPTION' }
  | { type: 'SIGN_IN'; payload: { email: string; displayName?: string; rememberLogin?: boolean } }
  | { type: 'SIGN_OUT' }
  | { type: 'SET_REMEMBER_LOGIN'; payload: boolean }
  | { type: 'SET_SECURE_METHOD'; payload: { method: 'passkey' | 'password'; biometricsEnabled: boolean } }
  | { type: 'SET_PROFILE_PHOTO'; payload: string | null }
  | { type: 'SET_ACCESSIBILITY'; payload: Partial<AppState['accessibility']> }
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
  | { type: 'INCREMENT_ACTIVITY_STATS'; payload: { minutes: number } }
  | { type: 'ADD_HABIT'; payload: Habit }
  | { type: 'TOGGLE_HABIT_TODAY'; payload: { id: string; date: string } }
  | { type: 'DELETE_HABIT'; payload: string };
