import type { AppState } from '../../context/types';
import type { Plan } from '../calendar/store';
import type { FirstThenItem, SequenceSettings } from '../first-then/store';
import { supabase } from '../../lib/supabase';

const CLOUD_SYNC_DEBOUNCE_MS = 1400;

type CloudSyncJob =
  | { kind: 'calendar-plans'; plans: Plan[] }
  | { kind: 'first-then'; items: FirstThenItem[]; settings: SequenceSettings };

let pendingCalendarPlans: Plan[] | null = null;
let pendingFirstThen: { items: FirstThenItem[]; settings: SequenceSettings } | null = null;
let cloudSyncTimer: ReturnType<typeof setTimeout> | null = null;

async function currentUserId(): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user?.id ?? null;
}

export async function syncProfileSnapshot(user: AppState['user']): Promise<void> {
  if (!supabase) return;
  const userId = await currentUserId();
  if (!userId) return;

  await supabase
    .from('app_profiles')
    .upsert({
      user_id: userId,
      display_name: user.displayName,
      legal_name: user.legalName,
      nickname: user.nickname,
      phone: user.phone,
      role: user.role,
      payload: user,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
}

export async function syncCalendarPlansSnapshot(plans: Plan[]): Promise<void> {
  if (!supabase || plans.length === 0) return;
  const userId = await currentUserId();
  if (!userId) return;

  await supabase
    .from('calendar_plans')
    .upsert(
      plans.map((plan) => ({
        user_id: userId,
        plan_id: plan.id,
        date_key: plan.date,
        payload: plan,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: 'user_id,plan_id' },
    );
}

export async function syncFirstThenSnapshot(
  items: FirstThenItem[],
  settings: SequenceSettings,
): Promise<void> {
  if (!supabase) return;
  const userId = await currentUserId();
  if (!userId) return;

  await supabase
    .from('first_then_sequences')
    .upsert({
      user_id: userId,
      sequence_id: 'default',
      items,
      settings,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,sequence_id' });
}

async function flushCloudSyncQueue(): Promise<void> {
  const calendarPlans = pendingCalendarPlans;
  const firstThen = pendingFirstThen;
  pendingCalendarPlans = null;
  pendingFirstThen = null;
  cloudSyncTimer = null;

  await Promise.all([
    calendarPlans ? syncCalendarPlansSnapshot(calendarPlans).catch(() => undefined) : Promise.resolve(),
    firstThen
      ? syncFirstThenSnapshot(firstThen.items, firstThen.settings).catch(() => undefined)
      : Promise.resolve(),
  ]);
}

export function enqueueCloudSync(job: CloudSyncJob): void {
  if (!supabase) return;

  if (job.kind === 'calendar-plans') {
    pendingCalendarPlans = job.plans;
  } else {
    pendingFirstThen = { items: job.items, settings: job.settings };
  }

  if (cloudSyncTimer) {
    clearTimeout(cloudSyncTimer);
  }

  cloudSyncTimer = setTimeout(() => {
    flushCloudSyncQueue().catch(() => undefined);
  }, CLOUD_SYNC_DEBOUNCE_MS);
}
