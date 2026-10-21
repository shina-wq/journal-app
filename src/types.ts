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

export const themes = ['light', 'dark'] as const;
export type Theme = (typeof themes)[number];

const moods: unknown[] = Object.values(Mood);

export function isMood(value: unknown): value is Mood {
  return moods.includes(value);
}

export function isTheme(value: unknown): value is Theme {
  return (themes as readonly unknown[]).includes(value);
}
