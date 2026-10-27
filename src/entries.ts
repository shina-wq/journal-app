import { loadEntries, saveEntries } from './storage.js';
import type { EntryInput, Journal, JournalEntry, Mood } from './types.js';

export type MoodFilter = Mood | 'all';

let entries: Journal = loadEntries();

function persist(next: Journal): void {
  if (!saveEntries(next)) {
    throw new Error("Couldn't save your journal. Your browser storage may be full.");
  }
  entries = next;
}

function findByProperty<T>(list: T[], key: keyof T, value: T[keyof T]): T | undefined {
  return list.find((item) => item[key] === value);
}

export function getEntry(id: string): JournalEntry | undefined {
  return findByProperty(entries, 'id', id);
}

// Entries are kept newest first, so the first one is the latest
export function latestEntryId(): string | null {
  return entries[0]?.id ?? null;
}

export function addEntry(input: EntryInput): JournalEntry {
  const entry: JournalEntry = { ...input, id: crypto.randomUUID(), timestamp: Date.now() };
  persist([entry, ...entries]);
  return entry;
}

export function updateEntry(id: string, changes: Partial<EntryInput>): JournalEntry | undefined {
  const entry = getEntry(id);
  if (!entry) return undefined;

  const updated: JournalEntry = { ...entry, ...changes };
  persist(entries.map((item) => (item.id === id ? updated : item)));
  return updated;
}

export function deleteEntry(id: string): boolean {
  const remaining = entries.filter((entry) => entry.id !== id);
  if (remaining.length === entries.length) return false;

  persist(remaining);
  return true;
}

export function filterByMood(mood: MoodFilter): Journal {
  return mood === 'all' ? entries : entries.filter((entry) => entry.mood === mood);
}

export function searchEntries(list: Journal, query: string): Journal {
  const term = query.trim().toLowerCase();
  if (!term) return list;
  return list.filter((entry) => `${entry.title}\n${entry.content}`.toLowerCase().includes(term));
}
