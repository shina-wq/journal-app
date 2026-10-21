import { loadEntries, saveEntries } from './storage.js';
import type { Journal, JournalEntry, Mood } from './types.js';

export type EntryInput = Pick<JournalEntry, 'title' | 'content' | 'mood'>;
export type MoodFilter = Mood | 'all';

let entries: Journal = loadEntries();

function persist(): void {
  if (!saveEntries(entries)) {
    throw new Error("Couldn't save your journal. Your browser storage may be full.");
  }
}

export function findByProperty<T>(list: T[], key: keyof T, value: T[keyof T]): T | undefined {
  return list.find((item) => item[key] === value);
}

export function getEntry(id: string): JournalEntry | undefined {
  return findByProperty(entries, 'id', id);
}

export function addEntry(input: EntryInput): JournalEntry {
  const entry: JournalEntry = {
    id: crypto.randomUUID(),
    title: input.title,
    content: input.content,
    mood: input.mood,
    timestamp: Date.now(),
  };
  entries = [entry, ...entries];
  persist();
  return entry;
}

export function updateEntry(id: string, changes: Partial<EntryInput>): JournalEntry | undefined {
  const entry = getEntry(id);
  if (!entry) return undefined;

  Object.assign(entry, changes);
  persist();
  return entry;
}

export function deleteEntry(id: string): boolean {
  const remaining = entries.filter((entry) => entry.id !== id);
  if (remaining.length === entries.length) return false;

  entries = remaining;
  persist();
  return true;
}

export function filterByMood(mood: MoodFilter): Journal {
  return mood === 'all' ? entries : entries.filter((entry) => entry.mood === mood);
}
