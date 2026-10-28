export enum Mood {
  HAPPY = 'happy',
  SAD = 'sad',
  MOTIVATED = 'motivated',
  STRESSED = 'stressed',
  CALM = 'calm',
}

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  mood: Mood;
  timestamp: number;
}

export type Journal = JournalEntry[];

// What the form provides; id and timestamp are added when the entry is created
export type EntryInput = Omit<JournalEntry, 'id' | 'timestamp'>;

export type Theme = 'light' | 'dark';

const moods: unknown[] = Object.values(Mood);

export function isMood(value: unknown): value is Mood {
  return moods.includes(value);
}

export function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark';
}
