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
  uploadToken: string | null;
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

export interface GuestbookNote {
  name: string;
  note: string;
  createdAt: string;
}

export interface NewGuestbookNote {
  inviteCode: string;
  name: string;
  note: string;
}

export interface QuizScore {
  name: string;
  score: number;
  createdAt: string;
}

export interface NewQuizScore {
  inviteCode: string;
  name: string;
  score: number;
}

export interface DataStore {
  getInvite(code: string): Promise<Invite | null>;
  getSettings(): Promise<Settings>;
  getRsvps(inviteCode: string): Promise<RsvpRow[]>;
  replaceRsvps(inviteCode: string, rows: NewRsvp[]): Promise<void>;
  getGuestbookNotes(): Promise<GuestbookNote[]>;
  addGuestbookNote(entry: NewGuestbookNote): Promise<void>;
  getQuizScores(): Promise<QuizScore[]>;
  addQuizScore(entry: NewQuizScore): Promise<void>;
}
