import type { DataStore } from './types';
import { createLocalStore } from './local';
import { createSupabaseStore } from './supabase';

let store: DataStore | null = null;

export function getDataStore(): DataStore {
  if (!store) {
    store = process.env.NEXT_PUBLIC_SUPABASE_URL
      ? createSupabaseStore()
      : createLocalStore();
  }
  return store;
}

export type {
  DataStore,
  Invite,
  NewRsvp,
  RsvpRow,
  Settings,
  Tier,
  Venue,
} from './types';
