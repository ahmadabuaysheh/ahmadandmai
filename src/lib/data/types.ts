export type Tier = 'full' | 'save_the_date' | 'public';

export interface Invite {
  code: string;
  guestNames: string[];
  tier: Exclude<Tier, 'public'>;
  maxPartySize: number;
  languagePref: 'en' | 'ar' | null;
}

export interface Venue {
  name: string;
  address: string;
  mapUrl: string;
}

export interface Settings {
  weddingDateIso: string | null;
  venue: Venue | null;
  galleryMode: 'couple' | 'guests';
}

export interface NewRsvp {
  inviteCode: string;
  guestName: string;
  attending: boolean;
  meal: string | null;
  songRequest: string | null;
  message: string | null;
}

export type RsvpRow = NewRsvp & { createdAt: string };

export interface DataStore {
  getInvite(code: string): Promise<Invite | null>;
  getSettings(): Promise<Settings>;
  getRsvps(inviteCode: string): Promise<RsvpRow[]>;
  replaceRsvps(inviteCode: string, rows: NewRsvp[]): Promise<void>;
}
