import { loadEntries, saveEntries } from './storage.js';
import { isMood, type Journal, type JournalEntry, type Mood } from './types.js';
import { elements, fillForm, readForm, renderEntries, renderMoodOptions, resetForm, setView, showStatus } from './ui.js';

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

// Event handlers

let selectedId: string | null = null;
let moodFilter: MoodFilter = 'all';

function refreshList(): void {
  renderEntries(filterByMood(moodFilter), selectedId);
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
elements.backButton.addEventListener('click', () => setView('list'));

elements.newButton.addEventListener('click', () => {
  openEntry(null);
  setView('page');
  elements.title.focus();
});

elements.list.addEventListener('click', (event) => {
  if (!(event.target instanceof Element)) return;
  const id = event.target.closest<HTMLElement>('[data-id]')?.dataset.id;
  if (!id) return;
  openEntry(id);
  setView('page');
});

elements.filter.addEventListener('change', () => {
  const value = elements.filter.value;
  moodFilter = isMood(value) ? value : 'all';
  refreshList();
});

renderMoodOptions();
openEntry(entries[0]?.id ?? null);
