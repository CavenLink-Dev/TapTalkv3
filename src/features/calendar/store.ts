/**
 * Calendar plans store.
 *
 * Holds Plans keyed by date (YYYY-MM-DD). Each Plan owns an ordered list
 * of Steps with a start time + duration. End time is derived; never stored.
 * Steps are completable (toggleable). Auto-numbering is presentational —
 * step.id is stable, step.position is implicit from index.
 *
 * In-memory only for now. AsyncStorage swap-in lives in the persistence
 * pass (Step 8). Sample data primes the store so the user can see real
 * content on first open.
 */

import { useSyncExternalStore } from 'react';

export interface PlanStep {
  id: string;
  name: string;
  symbol: string;
  symbolColor: string;
  /** Minutes since midnight. 9:30 AM → 570. */
  startMin: number;
  /** Duration in minutes. */
  durationMin: number;
  done: boolean;
  /** Free-text instructions, optional. */
  description?: string;
}

export interface Plan {
  id: string;
  name: string;
  symbol: string;
  symbolColor: string;
  /** YYYY-MM-DD. */
  date: string;
  description?: string;
  steps: PlanStep[];
}

export function formatDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseDateKey(key: string): Date {
  return new Date(`${key}T00:00:00`);
}

export function endMin(step: PlanStep): number {
  return step.startMin + step.durationMin;
}

export function fmtClock(minutesSinceMidnight: number): string {
  const total = ((minutesSinceMidnight % 1440) + 1440) % 1440;
  const h = Math.floor(total / 60);
  const m = total % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hh = ((h + 11) % 12) + 1; // 12-hour
  return `${hh}:${String(m).padStart(2, '0')} ${ampm}`;
}

const todayKey = formatDateKey(new Date());

let plans: Plan[] = [
  {
    id: 'morning-routine',
    name: 'Morning Routine',
    symbol: 'sunny-outline',
    symbolColor: '#FFB020',
    date: todayKey,
    description: 'Calm start to the day.',
    steps: [
      { id: 's1', name: 'Brush Teeth',   symbol: 'water-outline',      symbolColor: '#3DC1F2', startMin: 7 * 60,        durationMin: 5,  done: true,  description: 'Brush all teeth, focus on the back ones.' },
      { id: 's2', name: 'Get Dressed',   symbol: 'shirt-outline',      symbolColor: '#7B61FF', startMin: 7 * 60 + 5,    durationMin: 10, done: true,  description: 'Pick clothes from the drawer.' },
      { id: 's3', name: 'Eat Breakfast', symbol: 'restaurant-outline', symbolColor: '#FF8A3C', startMin: 7 * 60 + 15,   durationMin: 30, done: false, description: 'Sit at the table. Take small bites.' },
      { id: 's4', name: 'Pack Bag',      symbol: 'bag-handle-outline', symbolColor: '#34C759', startMin: 7 * 60 + 45,   durationMin: 10, done: false, description: 'Books, lunch, water bottle.' },
      { id: 's5', name: 'Shoes On',      symbol: 'footsteps-outline',  symbolColor: '#0A84FF', startMin: 7 * 60 + 55,   durationMin: 5,  done: false, description: 'Left foot first.' },
    ],
  },
  {
    id: 'afternoon-exercise',
    name: 'Afternoon Exercise',
    symbol: 'pulse-outline',
    symbolColor: '#34C759',
    date: todayKey,
    description: 'Get your body moving.',
    steps: [
      { id: 'e1', name: 'Stretch',     symbol: 'body-outline',  symbolColor: '#34C759', startMin: 14 * 60,       durationMin: 5,  done: false },
      { id: 'e2', name: 'Walk',        symbol: 'walk-outline',  symbolColor: '#199AEE', startMin: 14 * 60 + 5,   durationMin: 20, done: false },
      { id: 'e3', name: 'Drink Water', symbol: 'water-outline', symbolColor: '#5CC9E8', startMin: 14 * 60 + 25,  durationMin: 5,  done: false },
      { id: 'e4', name: 'Cool Down',   symbol: 'leaf-outline',  symbolColor: '#5CD65C', startMin: 14 * 60 + 30,  durationMin: 5,  done: false },
    ],
  },
];

const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach(l => l());
}

export function addPlan(plan: Plan): void {
  plans = [...plans, plan];
  emit();
}

export function removePlan(id: string): void {
  plans = plans.filter(p => p.id !== id);
  emit();
}

export function updatePlan(id: string, patch: Partial<Plan>): void {
  plans = plans.map(p => (p.id === id ? { ...p, ...patch } : p));
  emit();
}

export function toggleStepDone(planId: string, stepId: string): void {
  plans = plans.map(p =>
    p.id !== planId
      ? p
      : { ...p, steps: p.steps.map(s => (s.id === stepId ? { ...s, done: !s.done } : s)) },
  );
  emit();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): Plan[] {
  return plans;
}

export function usePlans(): Plan[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function usePlansForDate(dateKey: string): Plan[] {
  const all = usePlans();
  return all.filter(p => p.date === dateKey);
}

export function countPlansByDate(): Map<string, number> {
  const m = new Map<string, number>();
  plans.forEach(p => {
    m.set(p.date, (m.get(p.date) ?? 0) + 1);
  });
  return m;
}

export function usePlanCountsByDate(): Map<string, number> {
  // Recompute when plans change.
  usePlans();
  return countPlansByDate();
}
