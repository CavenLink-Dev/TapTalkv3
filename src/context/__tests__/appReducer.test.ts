import { appReducer, initialState } from '../AppContext';
import type { AppState, Action, AACWord, Task, TapTalkList, ListItem, Goal, GoalStep } from '../types';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

function fresh(): AppState {
  return JSON.parse(JSON.stringify(initialState)) as AppState;
}

// ---- Factories ----

function makeWord(overrides: Partial<AACWord> = {}): AACWord {
  return { id: 'w1', label: 'hello', wordType: 'core', ...overrides };
}

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 't1',
    name: 'Test task',
    description: '',
    tags: [],
    dueDate: null,
    startDate: null,
    reminders: [],
    completed: false,
    completedAt: null,
    ...overrides,
  };
}

function makeList(overrides: Partial<TapTalkList> = {}): TapTalkList {
  return { id: 'l1', name: 'Groceries', items: [], ...overrides };
}

function makeListItem(overrides: Partial<ListItem> = {}): ListItem {
  return { id: 'li1', text: 'Milk', completed: false, reminder: null, ...overrides };
}

function makeGoalStep(overrides: Partial<GoalStep> = {}): GoalStep {
  return { id: 's1', name: 'Step 1', howToAchieve: '', achieveBy: null, completed: false, ...overrides };
}

function makeGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: 'g1',
    name: 'Goal',
    description: '',
    why: '',
    deadline: null,
    reminder: null,
    encouragementMessage: '',
    steps: [makeGoalStep()],
    ...overrides,
  };
}

// ---- Tests ----

describe('appReducer', () => {
  let base: AppState;

  beforeEach(() => {
    base = fresh();
  });

  it('HYDRATE merges partial state into defaults', () => {
    const result = appReducer(base, {
      type: 'HYDRATE',
      payload: { signedIn: true, user: { displayName: 'Jo' } as AppState['user'] },
    });
    expect(result.signedIn).toBe(true);
    expect(result.user.displayName).toBe('Jo');
    expect(result.onboardingComplete).toBe(false);
  });

  it('SET_USER merges partial user fields', () => {
    const result = appReducer(base, { type: 'SET_USER', payload: { displayName: 'Sam', age: 8 } });
    expect(result.user.displayName).toBe('Sam');
    expect(result.user.age).toBe(8);
    expect(result.user.email).toBe('');
  });

  it('SET_PARENT merges partial parent fields', () => {
    const result = appReducer(base, { type: 'SET_PARENT', payload: { pin: '1234' } });
    expect(result.parent.pin).toBe('1234');
    expect(result.parent.lockEnabled).toBe(true);
  });

  it('COMPLETE_ONBOARDING sets onboardingComplete to true', () => {
    expect(appReducer(base, { type: 'COMPLETE_ONBOARDING' }).onboardingComplete).toBe(true);
  });

  it('COMPLETE_SUBSCRIPTION sets subscriptionComplete to true', () => {
    expect(appReducer(base, { type: 'COMPLETE_SUBSCRIPTION' }).subscriptionComplete).toBe(true);
  });

  it('SIGN_IN sets email and signedIn flag', () => {
    const result = appReducer(base, { type: 'SIGN_IN', payload: { email: 'a@b.com' } });
    expect(result.signedIn).toBe(true);
    expect(result.user.email).toBe('a@b.com');
  });

  it('SIGN_IN uses displayName when provided', () => {
    const result = appReducer(base, {
      type: 'SIGN_IN',
      payload: { email: 'a@b.com', displayName: 'Jo' },
    });
    expect(result.user.displayName).toBe('Jo');
    expect(result.user.nickname).toBe('Jo');
  });

  it('SIGN_IN keeps existing displayName when not provided', () => {
    const withName = appReducer(base, { type: 'SET_USER', payload: { displayName: 'Existing' } });
    const result = appReducer(withName, { type: 'SIGN_IN', payload: { email: 'a@b.com' } });
    expect(result.user.displayName).toBe('Existing');
  });

  it('SIGN_OUT resets to initial state', () => {
    const signedIn = appReducer(base, { type: 'SIGN_IN', payload: { email: 'a@b.com' } });
    const result = appReducer(signedIn, { type: 'SIGN_OUT' });
    expect(result.signedIn).toBe(false);
    expect(result.user.email).toBe('');
    expect(result.onboardingComplete).toBe(false);
  });

  it('APPEND_WORD adds a word to messageWords', () => {
    const word = makeWord();
    const result = appReducer(base, { type: 'APPEND_WORD', payload: word });
    expect(result.messageWords).toHaveLength(1);
    expect(result.messageWords[0]).toEqual(word);
  });

  it('CLEAR_WORDS empties messageWords', () => {
    let state = appReducer(base, { type: 'APPEND_WORD', payload: makeWord() });
    state = appReducer(state, { type: 'CLEAR_WORDS' });
    expect(state.messageWords).toEqual([]);
  });

  it('REMOVE_LAST_WORD removes the last word', () => {
    let state = appReducer(base, { type: 'APPEND_WORD', payload: makeWord({ id: 'a' }) });
    state = appReducer(state, { type: 'APPEND_WORD', payload: makeWord({ id: 'b' }) });
    state = appReducer(state, { type: 'REMOVE_LAST_WORD' });
    expect(state.messageWords).toHaveLength(1);
    expect(state.messageWords[0]!.id).toBe('a');
  });

  it('REMOVE_LAST_WORD on empty array returns empty array', () => {
    expect(appReducer(base, { type: 'REMOVE_LAST_WORD' }).messageWords).toEqual([]);
  });

  it('SET_BOARD changes currentBoard', () => {
    expect(appReducer(base, { type: 'SET_BOARD', payload: 'emotions' }).currentBoard).toBe('emotions');
  });

  it('SET_KEYBOARD_TEXT updates keyboardText', () => {
    expect(appReducer(base, { type: 'SET_KEYBOARD_TEXT', payload: 'hi there' }).keyboardText).toBe('hi there');
  });

  it('ADD_TASK appends a task', () => {
    const task = makeTask();
    const result = appReducer(base, { type: 'ADD_TASK', payload: task });
    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0]).toEqual(task);
  });

  it('TOGGLE_TASK marks task completed and sets completedAt', () => {
    const state = appReducer(base, { type: 'ADD_TASK', payload: makeTask() });
    const result = appReducer(state, { type: 'TOGGLE_TASK', payload: 't1' });
    expect(result.tasks[0]!.completed).toBe(true);
    expect(result.tasks[0]!.completedAt).toBeTruthy();
  });

  it('TOGGLE_TASK marks completed task as incomplete', () => {
    let state = appReducer(base, { type: 'ADD_TASK', payload: makeTask() });
    state = appReducer(state, { type: 'TOGGLE_TASK', payload: 't1' });
    state = appReducer(state, { type: 'TOGGLE_TASK', payload: 't1' });
    expect(state.tasks[0]!.completed).toBe(false);
    expect(state.tasks[0]!.completedAt).toBeNull();
  });

  it('TOGGLE_TASK does not affect other tasks', () => {
    let state = appReducer(base, { type: 'ADD_TASK', payload: makeTask({ id: 't1' }) });
    state = appReducer(state, { type: 'ADD_TASK', payload: makeTask({ id: 't2' }) });
    state = appReducer(state, { type: 'TOGGLE_TASK', payload: 't1' });
    expect(state.tasks[1]!.completed).toBe(false);
  });

  it('DELETE_TASK removes the task by id', () => {
    const state = appReducer(base, { type: 'ADD_TASK', payload: makeTask() });
    expect(appReducer(state, { type: 'DELETE_TASK', payload: 't1' }).tasks).toHaveLength(0);
  });

  it('ADD_LIST appends a list', () => {
    const result = appReducer(base, { type: 'ADD_LIST', payload: makeList() });
    expect(result.lists).toHaveLength(1);
    expect(result.lists[0]!.name).toBe('Groceries');
  });

  it('ADD_LIST_ITEM adds an item to the correct list', () => {
    let state = appReducer(base, { type: 'ADD_LIST', payload: makeList() });
    state = appReducer(state, { type: 'ADD_LIST_ITEM', payload: { listId: 'l1', item: makeListItem() } });
    expect(state.lists[0]!.items).toHaveLength(1);
    expect(state.lists[0]!.items[0]!.text).toBe('Milk');
  });

  it('ADD_LIST_ITEM does not affect other lists', () => {
    let state = appReducer(base, { type: 'ADD_LIST', payload: makeList({ id: 'l1' }) });
    state = appReducer(state, { type: 'ADD_LIST', payload: makeList({ id: 'l2', name: 'Other' }) });
    state = appReducer(state, { type: 'ADD_LIST_ITEM', payload: { listId: 'l1', item: makeListItem() } });
    expect(state.lists[1]!.items).toHaveLength(0);
  });

  it('TOGGLE_LIST_ITEM toggles item completed state', () => {
    let state = appReducer(base, { type: 'ADD_LIST', payload: makeList() });
    state = appReducer(state, { type: 'ADD_LIST_ITEM', payload: { listId: 'l1', item: makeListItem() } });
    state = appReducer(state, { type: 'TOGGLE_LIST_ITEM', payload: { listId: 'l1', itemId: 'li1' } });
    expect(state.lists[0]!.items[0]!.completed).toBe(true);
  });

  it('SET_FIRST_THEN sets first/then pair', () => {
    const result = appReducer(base, { type: 'SET_FIRST_THEN', payload: { first: 'eat', then: 'play' } });
    expect(result.firstThen).toEqual({ first: 'eat', then: 'play' });
  });

  it('CLEAR_FIRST_THEN resets to nulls', () => {
    let state = appReducer(base, { type: 'SET_FIRST_THEN', payload: { first: 'eat', then: 'play' } });
    state = appReducer(state, { type: 'CLEAR_FIRST_THEN' });
    expect(state.firstThen).toEqual({ first: null, then: null });
  });

  it('ADD_GOAL appends a goal', () => {
    expect(appReducer(base, { type: 'ADD_GOAL', payload: makeGoal() }).goals).toHaveLength(1);
  });

  it('UPDATE_GOAL replaces the matching goal', () => {
    let state = appReducer(base, { type: 'ADD_GOAL', payload: makeGoal() });
    state = appReducer(state, { type: 'UPDATE_GOAL', payload: makeGoal({ name: 'Updated' }) });
    expect(state.goals[0]!.name).toBe('Updated');
  });

  it('TOGGLE_STEP toggles a goal step', () => {
    let state = appReducer(base, { type: 'ADD_GOAL', payload: makeGoal() });
    state = appReducer(state, { type: 'TOGGLE_STEP', payload: { goalId: 'g1', stepId: 's1' } });
    expect(state.goals[0]!.steps[0]!.completed).toBe(true);
  });

  it('TOGGLE_STEP does not affect other goals', () => {
    let state = appReducer(base, { type: 'ADD_GOAL', payload: makeGoal({ id: 'g1' }) });
    state = appReducer(state, { type: 'ADD_GOAL', payload: makeGoal({ id: 'g2' }) });
    state = appReducer(state, { type: 'TOGGLE_STEP', payload: { goalId: 'g1', stepId: 's1' } });
    expect(state.goals[1]!.steps[0]!.completed).toBe(false);
  });

  it('ADD_STEP appends a step to the correct goal', () => {
    let state = appReducer(base, { type: 'ADD_GOAL', payload: makeGoal() });
    const step = makeGoalStep({ id: 's2', name: 'Step 2' });
    state = appReducer(state, { type: 'ADD_STEP', payload: { goalId: 'g1', step } });
    expect(state.goals[0]!.steps).toHaveLength(2);
    expect(state.goals[0]!.steps[1]!.name).toBe('Step 2');
  });

  it('INCREMENT_TALK_STATS adds wordsAdded to totalWords', () => {
    expect(appReducer(base, { type: 'INCREMENT_TALK_STATS', payload: { wordsAdded: 5 } }).talkStats.totalWords).toBe(5);
  });

  it('INCREMENT_TALK_STATS accumulates across dispatches', () => {
    let state = appReducer(base, { type: 'INCREMENT_TALK_STATS', payload: { wordsAdded: 3 } });
    state = appReducer(state, { type: 'INCREMENT_TALK_STATS', payload: { wordsAdded: 2 } });
    expect(state.talkStats.totalWords).toBe(5);
  });

  it('INCREMENT_ACTIVITY_STATS increments gamesPlayed and minutesToday', () => {
    const result = appReducer(base, { type: 'INCREMENT_ACTIVITY_STATS', payload: { minutes: 10 } });
    expect(result.activityStats.gamesPlayed).toBe(1);
    expect(result.activityStats.minutesToday).toBe(10);
  });

  it('unknown action returns state unchanged', () => {
    const result = appReducer(base, { type: 'UNKNOWN' } as unknown as Action);
    expect(result).toBe(base);
  });
});
