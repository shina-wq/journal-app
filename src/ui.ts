import type { EntryInput } from './journal.js';
import { isMood, Mood, type JournalEntry, type Theme } from './types.js';

export type View = 'list' | 'page';

function getElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing element: ${selector}`);
  return element;
}

export const elements = {
  app: getElement<HTMLDivElement>('.app'),
  newButton: getElement<HTMLButtonElement>('#new-entry'),
  themeButton: getElement<HTMLButtonElement>('#theme-toggle'),
  filter: getElement<HTMLFieldSetElement>('#mood-filter'),
  search: getElement<HTMLInputElement>('#search'),
  list: getElement<HTMLUListElement>('#entry-list'),
  form: getElement<HTMLFormElement>('#entry-form'),
  backButton: getElement<HTMLButtonElement>('#back'),
  date: getElement<HTMLTimeElement>('#entry-date'),
  deleteButton: getElement<HTMLButtonElement>('#delete-entry'),
  moods: getElement<HTMLFieldSetElement>('#moods'),
  title: getElement<HTMLTextAreaElement>('#title'),
  content: getElement<HTMLTextAreaElement>('#content'),
  shuffleButton: getElement<HTMLButtonElement>('#shuffle-prompt'),
  status: getElement<HTMLParagraphElement>('#status'),
};

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(timestamp: number): number {
  return new Date(timestamp).setHours(0, 0, 0, 0);
}

function formatLongDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatShortDay(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' });
}

function groupLabel(timestamp: number): string {
  const daysAgo = Math.round((startOfDay(Date.now()) - startOfDay(timestamp)) / DAY_MS);
  if (daysAgo <= 0) return 'Today';
  if (daysAgo === 1) return 'Yesterday';
  if (daysAgo < 7) return 'This week';
  return new Date(timestamp).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

function previewText(content: string): string {
  return content.split('\n').find((line) => line.trim() !== '')?.trim() ?? '';
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function moodLabel(mood: Mood): string {
  return mood.charAt(0).toUpperCase() + mood.slice(1);
}

function setDate(timestamp: number): void {
  elements.date.textContent = formatLongDate(timestamp);
  elements.date.dateTime = new Date(timestamp).toISOString();
}

export function renderMoodOptions(): void {
  const moods = Object.values(Mood);

  elements.filter.insertAdjacentHTML(
    'beforeend',
    moods
      .map(
        (mood) => `
          <label class="filter-chip" data-mood="${mood}" title="${moodLabel(mood)}">
            <input type="radio" name="filter" value="${mood}" />
            <span class="sr-only">${moodLabel(mood)}</span>
          </label>`,
      )
      .join(''),
  );
  elements.moods.insertAdjacentHTML(
    'beforeend',
    moods
      .map(
        (mood) => `
          <label class="mood-pill" data-mood="${mood}">
            <input type="radio" name="mood" value="${mood}" required />
            ${moodLabel(mood)}
          </label>`,
      )
      .join(''),
  );
}

export function renderEntries(entries: JournalEntry[], selectedId: string | null, isFiltered: boolean): void {
  if (entries.length === 0) {
    const message = isFiltered ? 'No matching entries.' : 'No entries here yet. Start one with the + button.';
    elements.list.innerHTML = `<li class="empty">${message}</li>`;
    return;
  }

  // Entries arrive newest first, so each group is a run of neighbours with the same label.
  const groups: { label: string; entries: JournalEntry[] }[] = [];
  for (const entry of entries) {
    const label = groupLabel(entry.timestamp);
    const last = groups[groups.length - 1];
    if (last?.label === label) last.entries.push(entry);
    else groups.push({ label, entries: [entry] });
  }

  elements.list.innerHTML = groups
    .map(
      (group) => `
        <li class="entry-group">
          <h2 class="group-label">${group.label}</h2>
          <ul class="group-list">${group.entries.map((entry) => renderEntry(entry, selectedId)).join('')}</ul>
        </li>`,
    )
    .join('');
}

function renderEntry(entry: JournalEntry, selectedId: string | null): string {
  const preview = previewText(entry.content);
  return `
    <li>
      <button type="button" class="entry-item" data-id="${escapeHtml(entry.id)}" ${entry.id === selectedId ? 'aria-current="true"' : ''}>
        <span class="entry-title">${escapeHtml(entry.title)}</span>
        <span class="entry-day">${formatShortDay(entry.timestamp)}</span>
        <span class="entry-preview">${escapeHtml(preview)}</span>
        <span class="mood-dot" data-mood="${entry.mood}" aria-hidden="true"></span>
        <span class="sr-only">, ${moodLabel(entry.mood)}</span>
      </button>
    </li>`;
}

export function fillForm(entry: JournalEntry): void {
  elements.title.value = entry.title;
  elements.content.value = entry.content;
  const moodInput = elements.moods.querySelector<HTMLInputElement>(`input[value="${entry.mood}"]`);
  if (moodInput) {
    moodInput.checked = true;
    // On phones the moods scroll sideways, so centre the chosen one. Only the row scrolls;
    // scrollIntoView would also shift the page.
    const pill = moodInput.getBoundingClientRect();
    const row = elements.moods.getBoundingClientRect();
    elements.moods.scrollLeft += pill.left + pill.width / 2 - (row.left + row.width / 2);
  }
  setDate(entry.timestamp);
  elements.deleteButton.hidden = false;
  showStatus('');
}

export function resetForm(): void {
  elements.form.reset();
  setDate(Date.now());
  elements.deleteButton.hidden = true;
  showStatus('');
}

export function readForm(): EntryInput | null {
  // Pasted line breaks would survive in a textarea; titles stay single-line.
  const title = elements.title.value.replace(/\s+/g, ' ').trim();
  const mood = new FormData(elements.form).get('mood');
  if (!title || !isMood(mood)) return null;
  return { title, content: elements.content.value, mood };
}

export function markSaved(savedAt: number): void {
  elements.deleteButton.hidden = false;
  showStatus(`Saved · ${formatTime(savedAt)}`);
}

export function applyTheme(theme: Theme, next: Theme): void {
  document.documentElement.dataset.theme = theme;
  elements.themeButton.setAttribute('aria-label', `Switch to ${next} theme`);
}

export function getSelectedMood(): Mood | null {
  const mood = new FormData(elements.form).get('mood');
  return isMood(mood) ? mood : null;
}

export function setPrompt(prompt: string): void {
  elements.content.placeholder = prompt;
}

export function setView(view: View): void {
  elements.app.dataset.view = view;
}

export function showStatus(message: string, isError = false): void {
  elements.status.textContent = message;
  elements.status.classList.toggle('is-error', isError);
}
