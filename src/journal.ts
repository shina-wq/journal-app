import { loadEntries, loadTheme, saveEntries, saveTheme } from './storage.js';
import { isMood, type EntryInput, type Journal, type JournalEntry, type Mood, type Theme } from './types.js';
import { pickPrompt } from './prompts.js';
import {
  applyTheme,
  elements,
  fillForm,
  getSelectedMood,
  markSaved,
  readForm,
  renderEntries,
  renderMoodOptions,
  resetForm,
  setPrompt,
  setView,
  showStatus,
} from './ui.js';

type MoodFilter = Mood | 'all';

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

// Delays fn until calls stop for `ms`; flush() runs a pending call right away.
function debounce(fn: () => void, ms: number): (() => void) & { flush: () => void } {
  let timer: number | undefined;
  let pending = false;

  function flush(): void {
    clearTimeout(timer);
    if (!pending) return;
    pending = false;
    fn();
  }

  function debounced(): void {
    pending = true;
    clearTimeout(timer);
    timer = window.setTimeout(flush, ms);
  }

  return Object.assign(debounced, { flush });
}

function getEntry(id: string): JournalEntry | undefined {
  return findByProperty(entries, 'id', id);
}

function addEntry(input: EntryInput): JournalEntry {
  const entry: JournalEntry = { ...input, id: crypto.randomUUID(), timestamp: Date.now() };
  persist([entry, ...entries]);
  return entry;
}

function updateEntry(id: string, changes: Partial<EntryInput>): JournalEntry | undefined {
  const entry = getEntry(id);
  if (!entry) return undefined;

  const updated: JournalEntry = { ...entry, ...changes };
  persist(entries.map((item) => (item.id === id ? updated : item)));
  return updated;
}

function deleteEntry(id: string): boolean {
  const remaining = entries.filter((entry) => entry.id !== id);
  if (remaining.length === entries.length) return false;

  persist(remaining);
  return true;
}

function filterByMood(mood: MoodFilter): Journal {
  return mood === 'all' ? entries : entries.filter((entry) => entry.mood === mood);
}

function searchEntries(list: Journal, query: string): Journal {
  const term = query.trim().toLowerCase();
  if (!term) return list;
  return list.filter((entry) => `${entry.title}\n${entry.content}`.toLowerCase().includes(term));
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

// Shows a fresh prompt for the selected mood (or a general one) as the content placeholder.
function refreshPrompt(): void {
  setPrompt(pickPrompt(getSelectedMood(), elements.content.placeholder));
}

function openEntry(id: string | null): void {
  autosave.flush();
  const entry = id === null ? undefined : getEntry(id);
  selectedId = entry?.id ?? null;
  if (entry) fillForm(entry);
  else resetForm();
  refreshPrompt();
  refreshList();
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong. Try again.';
}

// Saves the open entry once it has a title and mood; a new entry is created on its first save.
function saveCurrent(): void {
  const input = readForm();
  if (!input) {
    showStatus('Add a title and mood to save');
    return;
  }

  try {
    const entry = selectedId ? updateEntry(selectedId, input) : addEntry(input);
    selectedId = entry?.id ?? null;
    refreshList();
    markSaved(Date.now());
  } catch (error) {
    showStatus(errorMessage(error), true);
  }
}

const autosave = debounce(saveCurrent, 800);

function handleSave(event: SubmitEvent): void {
  event.preventDefault();
  autosave();
  autosave.flush();
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
elements.form.addEventListener('input', (): void => autosave());
window.addEventListener('pagehide', (): void => autosave.flush());
elements.moods.addEventListener('change', refreshPrompt);

// The title is a textarea so long titles wrap, but it stays one line: Enter moves on to the entry.
elements.title.addEventListener('keydown', (event: KeyboardEvent): void => {
  if (event.key !== 'Enter') return;
  event.preventDefault();
  elements.content.focus();
});

elements.shuffleButton.addEventListener('click', (): void => {
  refreshPrompt();
  elements.content.focus();
});

elements.deleteButton.addEventListener('click', handleDelete);
elements.backButton.addEventListener('click', (): void => {
  autosave.flush();
  setView('list');
});

elements.newButton.addEventListener('click', (): void => {
  openEntry(null);
  setView('page');
  elements.title.focus();
});

elements.list.addEventListener('click', (event: MouseEvent): void => {
  if (!(event.target instanceof Element)) return;
  const id = event.target.closest<HTMLElement>('[data-id]')?.dataset.id;
  if (!id) return;
  // Show the page first so filling it can scroll the chosen mood into view
  setView('page');
  openEntry(id);
});

elements.filter.addEventListener('change', (): void => {
  const value = elements.filter.querySelector<HTMLInputElement>('input:checked')?.value;
  moodFilter = isMood(value) ? value : 'all';
  refreshList();
});

elements.search.addEventListener('input', (): void => {
  searchQuery = elements.search.value;
  refreshList();
});

elements.themeButton.addEventListener('click', (): void => {
  theme = theme === 'dark' ? 'light' : 'dark';
  saveTheme(theme);
  applyTheme(theme);
});

applyTheme(theme);
renderMoodOptions();
openEntry(entries[0]?.id ?? null);