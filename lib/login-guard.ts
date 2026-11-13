import { supabase } from './supabase';

const MAX_FAILS = 5;
const LOCK_MS = 15 * 60_000;

export const isLocked = (until: string | null | undefined): boolean =>
  !!until && new Date(until).getTime() > Date.now();

export async function recordFailure(adminId: string, fails: number): Promise<void> {
  const next = fails + 1;
  const lock = next >= MAX_FAILS;
  const { error } = await supabase
    .from('admins')
    .update({
      failed_attempts: lock ? 0 : next,
      locked_until: lock ? new Date(Date.now() + LOCK_MS).toISOString() : null,
    })
    .eq('id', adminId);
  if (error) throw error;
}

export async function recordSuccess(adminId: string): Promise<void> {
  const { error } = await supabase.from('admins').update({ failed_attempts: 0, locked_until: null }).eq('id', adminId);
  if (error) throw error;
}
