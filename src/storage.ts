import { isMood, isTheme, type Journal, type JournalEntry, type Theme } from './types.js';

const ENTRIES_KEY = 'journal.entries';
const THEME_KEY = 'journal.theme';

export function isJournalEntry(value: unknown): value is JournalEntry {
  if (typeof value !== 'object' || value === null) return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.id === 'string' &&
    typeof entry.title === 'string' &&
    typeof entry.content === 'string' &&
    typeof entry.timestamp === 'number' &&
    isMood(entry.mood)
  );
}

export function loadEntries(): Journal {
  const raw = localStorage.getItem(ENTRIES_KEY);
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
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
    return true;
  } catch {
    return false;
  }
}

export function loadTheme(): Theme {
  const value = localStorage.getItem(THEME_KEY);
  return isTheme(value) ? value : 'system';
}

export function saveTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // The theme still applies for this visit; it just won't be remembered.
  }
}
