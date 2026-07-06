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
    /**
     * Strength of haptic feedback when enabled. 'gentle' softens every cue,
     * 'strong' makes impacts firmer for users who need clearer confirmation.
     */
    hapticStrength: 'gentle' | 'standard' | 'strong';
    /**
     * In-app Reduce Motion override. When true, TapTalk reduces animation even
     * if the iOS system Reduce Motion setting is off. The effective value is
     * (system Reduce Motion OR this flag) via useReduceMotion.
     */
    reduceMotionOverride: boolean;
    /** Tap-based editing alternatives — no drag or pinch required (Rule 20/25). */
    motorAccessMode: boolean;
    /** Reduce non-essential animation/particles/sound beyond system Reduce Motion. */
    reduceSensoryLoad: boolean;
    /**
     * When true, the spell-and-speak path in `buildMessageUtterances` is
     * active for single words not found in the board vocabulary.
     * Defaults to false — known vocab words always speak directly regardless
     * of this flag (emergency communication safety requirement).
     */
    spellingModeEnabled: boolean;
    /**
     * Controls per-tile-tap speech behaviour on the AAC board.
     * 'word-by-word' — each tile tap enqueues the word; spoken FIFO so
     *   rapid taps are heard in order without cancellation.
     * 'sentence' — tile taps are silent; full message speaks on Send.
     * Default: 'word-by-word'.
     */
    wordSpeechMode: 'word-by-word' | 'sentence';
    /**
     * Switch Access / Scanning subsystem — Phase 4 motor access.
     * When enabled, a row-then-column highlight loop drives selection so
     * users with cerebral palsy / ALS / SCI who cannot touch-target the
     * screen can operate the app via one or two external switches.
     * State is deliberately decoupled from touch input so both work
     * simultaneously without collision.
     */
    scanningEnabled: boolean;
    /**
     * Interval between scan advances, milliseconds. Range 100–2000ms.
     * Slow scanners need 1200ms+; fast users often prefer 300–500ms.
     * Default 800ms — a conservative middle-ground per RESNA guidance.
     */
    scanRate: number;
    /**
     * 'auto' — highlight advances on its own; switch selects the highlighted row/tile.
     * 'step' — one switch advances, another switch selects (dual-switch users).
     * 'inverse' — highlight advances only while the switch is HELD (rarely used, but common in older AAC hardware).
     */
    scanMode: 'auto' | 'step' | 'inverse';
    /**
     * Which physical input maps to the scanner. Keyboard covers Bluetooth
     * switch interfaces that emulate keys (Blue2, AbleNet Hook+, Tecla).
     * Volume covers iOS hardware volume rockers as an accessible fallback
     * for users without dedicated switch hardware.
     */
    switchInputSource: 'keyboard' | 'volume' | 'both';
    /**
     * Number of consecutive full-board scan cycles with no selection before
     * scanning auto-pauses. Prevents the highlight from cycling forever
     * when the user has stepped away. Default 3.
     */
    scanAutoPauseCycles: number;
    /**
     * When true, plays a soft audio tick on each scan advance so blind /
     * low-vision users can time their switch press without watching the
     * highlight. Off by default.
     */
    scanAudioCue: boolean;
  };

  /**
   * Per-board ordered list of pinned (favourited) tile IDs.
   * Keys are BoardMode strings; values are tile ID arrays in pin order.
   * Persisted to hot storage and hydrated on launch.
   * Stale IDs (tiles deleted after favouriting) are scrubbed on first load.
   */
  favouritesByMode: Partial<Record<string, string[]>>;
  user: {
    legalName: string;
    displayName: string;
    /** Handle-style username: 8+ chars, letters/numbers only. Optional. */
    username: string;
    /** Optional contact phone. Stored on-device only. */
    phone: string;
    email: string;
    name: string;
    nickname: string;
    age: number | null;
    /**
     * Who this account belongs to / who manages it.
     * `guardian` = legal guardian / parent / authorised decision-maker.
     * `therapist` = allied-health professional — legally and practically a
     * DIFFERENT role from guardian (was previously mislabelled: the
     * "Therapist" option saved as `guardian`).
     */
    role: 'myself' | 'parent' | 'support' | 'guardian' | 'therapist' | null;
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
  /**
   * Per-board tile order. Keys are BoardMode strings ('home', 'foods', ...);
   * values are arrays of tile IDs in display order. Tile IDs not listed fall
   * to the end of the board so new tiles added in code releases don't break
   * existing user layouts. Tile IDs no longer present in code are ignored.
   * Empty arrays / missing keys mean "use the code default order".
   */
  boardLayouts: Record<string, string[]>;
  /**
   * Per-board variable-size placements. Each entry records the tile ID, its
   * coarse grid slot, and its size in FINE (44px) units (fw/fh). This is
   * the authoritative layout representation that preserves resize state across
   * relaunches. `boardLayouts` is kept for backward-compat/migration.
   */
  boardPlacements: Record<string, { id: string; slot: number; fw: number; fh: number }[]>;
  /** User-created board tiles that need to survive app relaunch. */
  customBoardTiles: CustomBoardTile[];
  /** IDs of tiles the user has hidden via the edit-mode delete badge. */
  hiddenTileIds: string[];

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

  // Talk — Sentence History (last 20 spoken/cleared sentences for quick replay)
  sentenceHistory: { id: string; words: AACWord[]; spokenAt: string }[];

  // Talk — Usage analytics
  tileTapCounts: Record<string, number>;
  tileLastTappedAt: Record<string, string>;
  showUsageHeatmap: boolean;

  // Talk — N-gram next-word prediction model
  ngramModel: Record<string, Record<string, number>>;

  // Speech — user pronunciation overrides ("say it like this")
  pronunciations: PronunciationRule[];

  // Profile — My Communication Passport (shown to support workers / staff)
  passport: CommunicationPassport;
}

/** A trusted person listed on the Communication Passport. */
export interface PassportContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
}

/**
 * My Communication Passport — a plain-language profile a support worker,
 * teacher, or hospital staff member can read to help the user faster.
 * Every field is free text written by the user or a caregiver.
 */
export interface CommunicationPassport {
  /** How I communicate (e.g. "I use this app to speak. Give me time."). */
  howICommunicate: string;
  /** Things that help me (e.g. "Short sentences. One question at a time."). */
  whatHelps: string;
  /** Things that overwhelm me (e.g. "Loud rooms, bright lights, rushing."). */
  whatOverwhelms: string;
  /** Access needs (e.g. "I need my iPad within reach at all times."). */
  accessNeeds: string;
  /** Anything else important (medical, routines, comfort items). */
  importantInfo: string;
  trustedContacts: PassportContact[];
}

/** A "say X as Y" override applied before text-to-speech. */
export interface PronunciationRule {
  id: string;
  /** The written word or phrase (matched whole-word, case-insensitive). */
  from: string;
  /** How it should be spoken. */
  to: string;
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

export interface CustomBoardTile {
  id: string;
  board: string;
  label: string;
  speech?: string;
  color: string;
  wordType?: string;
  mulberrySymbolId?: string;
  customImageUri?: string;
  backgroundOpacity?: number;
  outlineColor?: string;
  outlineOpacity?: number;
  /**
   * 'folder' for tiles that navigate to a child board; 'word' (default) for
   * communication tiles. Folders require `target` to be set.
   */
  kind?: 'word' | 'folder';
  /**
   * The board key this folder tile navigates to. Only valid when kind = 'folder'.
   * Must match a key in `boardPlacements` (for custom boards) or BoardMode (for
   * static boards).
   */
  target?: string;
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
  | { type: 'REMOVE_WORD_AT_INDEX'; payload: number }
  | { type: 'SET_BOARD'; payload: string }
  | { type: 'SET_BOARD_ORDER'; payload: { board: string; order: string[] } }
  | { type: 'SET_BOARD_PLACEMENTS'; payload: { board: string; placements: { id: string; slot: number; fw: number; fh: number }[] } }
  | { type: 'UPSERT_CUSTOM_BOARD_TILE'; payload: CustomBoardTile }
  | { type: 'HIDE_TILE'; payload: string }
  | { type: 'RESTORE_TILE'; payload: string }
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
  | { type: 'DELETE_HABIT'; payload: string }
  | { type: 'PUSH_SENTENCE_HISTORY'; payload: { words: AACWord[] } }
  | { type: 'INCREMENT_TILE_TAP'; payload: { tileId: string } }
  | { type: 'SET_SHOW_USAGE_HEATMAP'; payload: boolean }
  | { type: 'UPDATE_NGRAM_MODEL'; payload: { words: string[] } }
  | { type: 'ADD_PRONUNCIATION'; payload: PronunciationRule }
  | { type: 'DELETE_PRONUNCIATION'; payload: string }
  | { type: 'SET_PASSPORT'; payload: Partial<CommunicationPassport> }
  | { type: 'SET_FAVOURITES_BY_MODE'; payload: { board: string; ids: string[] } }
  | { type: 'SET_ALL_FAVOURITES'; payload: Partial<Record<string, string[]>> };
