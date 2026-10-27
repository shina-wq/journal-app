import { loadEntries, loadTheme, saveEntries, saveTheme } from './storage.js';
import { isMood, type Journal, type JournalEntry, type Mood, type Theme } from './types.js';
import {
  applyTheme,
  elements,
  fillForm,
  readForm,
  renderEntries,
  renderMoodOptions,
  resetForm,
  setView,
  showStatus,
} from './ui.js';

export type EntryInput = Omit<JournalEntry, 'id' | 'timestamp'>;
export type MoodFilter = Mood | 'all';

let entries: Journal = loadEntries();

function persist(next: Journal): void {
  if (!saveEntries(next)) {
    throw new Error("Couldn't save your journal. Your browser storage may be full.");
  }
  entries = next;
}

export function findByProperty<T>(list: T[], key: keyof T, value: T[keyof T]): T | undefined {
  return list.find((item) => item[key] === value);
}

export function getEntry(id: string): JournalEntry | undefined {
  return findByProperty(entries, 'id', id);
}

export function addEntry(input: EntryInput): JournalEntry {
  const entry: JournalEntry = { ...input, id: crypto.randomUUID(), timestamp: Date.now() };
  persist([entry, ...entries]);
  return entry;
}

export function updateEntry(id: string, changes: Partial<EntryInput>): JournalEntry | undefined {
  const entry = getEntry(id);
  if (!entry) return undefined;

  const updated: JournalEntry = { ...entry, ...changes, id: entry.id, timestamp: entry.timestamp };
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

export function otherTheme(theme: Theme): Theme {
  return theme === 'dark' ? 'light' : 'dark';
}

// Event handlers

let selectedId: string | null = null;
let moodFilter: MoodFilter = 'all';
let searchQuery = '';
let theme: Theme = loadTheme();

function refreshList(): void {
  const isFiltered = moodFilter !== 'all' || searchQuery.trim() !== '';
  renderEntries(searchEntries(filterByMood(moodFilter), searchQuery), selectedId, isFiltered);
}

function openEntry(id: string | null): void {
  const entry = id === null ? undefined : getEntry(id);
  selectedId = entry?.id ?? null;
  if (entry) fillForm(entry);
  else resetForm();
  refreshList();
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong. Try again.';
}

function handleSave(event: SubmitEvent): void {
  event.preventDefault();
  const input = readForm();
  if (!input) return;

  try {
    const entry = selectedId ? updateEntry(selectedId, input) : addEntry(input);
    openEntry(entry?.id ?? null);
    showStatus('Entry saved');
  } catch (error) {
    showStatus(errorMessage(error), true);
  }
}

function handleDelete(): void {
  if (!selectedId || !confirm("Delete this entry? This can't be undone.")) return;

  try {
    deleteEntry(selectedId);
    openEntry(entries[0]?.id ?? null);
    setView('list');
  } catch (error) {
    showStatus(errorMessage(error), true);
  }
}

elements.form.addEventListener('submit', handleSave);
elements.deleteButton.addEventListener('click', handleDelete);
elements.backButton.addEventListener('click', (): void => setView('list'));

elements.newButton.addEventListener('click', (): void => {
  openEntry(null);
  setView('page');
  elements.title.focus();
});

elements.list.addEventListener('click', (event: MouseEvent): void => {
  if (!(event.target instanceof Element)) return;
  const id = event.target.closest<HTMLElement>('[data-id]')?.dataset.id;
  if (!id) return;
  openEntry(id);
  setView('page');
});

elements.filter.addEventListener('change', (): void => {
  const value = elements.filter.value;
  moodFilter = isMood(value) ? value : 'all';
  refreshList();
});

elements.search.addEventListener('input', (): void => {
  searchQuery = elements.search.value;
  refreshList();
});

elements.themeButton.addEventListener('click', (): void => {
  theme = otherTheme(theme);
  saveTheme(theme);
  applyTheme(theme, otherTheme(theme));
});

applyTheme(theme, otherTheme(theme));
renderMoodOptions();
openEntry(entries[0]?.id ?? null);
