import type { DataStore } from './types';
import { createLocalStore } from './local';

let store: DataStore | null = null;

export function getDataStore(): DataStore {
  if (!store) {
    store = process.env.NEXT_PUBLIC_SUPABASE_URL
      ? createSupabaseStoreLazy()
      : createLocalStore();
  }
  return store;
}

function createSupabaseStoreLazy(): DataStore {
  // Implemented in Task 6; throwing here keeps Task 3 honest.
  throw new Error('Supabase backend not implemented yet');
}

export type {
  DataStore,
  Invite,
  NewRsvp,
  Settings,
  Tier,
  Venue,
} from './types';
