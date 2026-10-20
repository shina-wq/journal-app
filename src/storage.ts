import { Mood, type Journal, type JournalEntry } from './types.js';

const STORAGE_KEY = 'journal.entries';
const moods: unknown[] = Object.values(Mood);

export function isJournalEntry(value: unknown): value is JournalEntry {
  if (typeof value !== 'object' || value === null) return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.id === 'string' &&
    typeof entry.title === 'string' &&
    typeof entry.content === 'string' &&
    typeof entry.timestamp === 'number' &&
    moods.includes(entry.mood)
  );
}

export function loadEntries(): Journal {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) return [];

  try {
    const data: unknown = JSON.parse(raw);
    return Array.isArray(data) ? data.filter(isJournalEntry) : [];
  } catch {
    return [];
  }
}

export function saveEntries(entries: Journal): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    return true;
  } catch {
    return false;
  }
}
