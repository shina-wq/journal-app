import type { EntryInput } from './journal.js';
import { isMood, Mood, type JournalEntry } from './types.js';

export type View = 'list' | 'page';

function getElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing element: ${selector}`);
  return element;
}

export const elements = {
  app: getElement<HTMLDivElement>('.app'),
  newButton: getElement<HTMLButtonElement>('#new-entry'),
  filter: getElement<HTMLSelectElement>('#mood-filter'),
  list: getElement<HTMLUListElement>('#entry-list'),
  form: getElement<HTMLFormElement>('#entry-form'),
  backButton: getElement<HTMLButtonElement>('#back'),
  date: getElement<HTMLTimeElement>('#entry-date'),
  deleteButton: getElement<HTMLButtonElement>('#delete-entry'),
  moods: getElement<HTMLFieldSetElement>('#moods'),
  title: getElement<HTMLInputElement>('#title'),
  content: getElement<HTMLTextAreaElement>('#content'),
  status: getElement<HTMLParagraphElement>('#status'),
};

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function moodLabel(mood: Mood): string {
  return mood.charAt(0).toUpperCase() + mood.slice(1);
}

function setDate(timestamp: number): void {
  elements.date.textContent = formatDate(timestamp);
  elements.date.dateTime = new Date(timestamp).toISOString();
}

export function renderMoodOptions(): void {
  const moods = Object.values(Mood);

  elements.filter.insertAdjacentHTML(
    'beforeend',
    moods.map((mood) => `<option value="${mood}">${moodLabel(mood)} entries</option>`).join(''),
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

export function renderEntries(entries: JournalEntry[], selectedId: string | null): void {
  if (entries.length === 0) {
    elements.list.innerHTML = '<li class="empty">No entries here yet. Start one with the + button.</li>';
    return;
  }

  elements.list.innerHTML = entries
    .map(
      (entry) => `
        <li>
          <button type="button" class="entry-item" data-id="${escapeHtml(entry.id)}" ${entry.id === selectedId ? 'aria-current="true"' : ''}>
            <span class="entry-date">${formatDate(entry.timestamp)}</span>
            <span class="entry-title">${escapeHtml(entry.title)}</span>
            <span class="mood-dot" data-mood="${entry.mood}" aria-hidden="true"></span>
            <span class="sr-only">, ${moodLabel(entry.mood)}</span>
          </button>
        </li>`,
    )
    .join('');
}

export function fillForm(entry: JournalEntry): void {
  elements.title.value = entry.title;
  elements.content.value = entry.content;
  const moodInput = elements.moods.querySelector<HTMLInputElement>(`input[value="${entry.mood}"]`);
  if (moodInput) moodInput.checked = true;
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
  const title = elements.title.value.trim();
  const mood = new FormData(elements.form).get('mood');
  if (!title || !isMood(mood)) return null;
  return { title, content: elements.content.value, mood };
}

export function markSaved(savedAt: number): void {
  elements.deleteButton.hidden = false;
  showStatus(`Saved · ${formatTime(savedAt)}`);
}

export function setView(view: View): void {
  elements.app.dataset.view = view;
}

export function showStatus(message: string, isError = false): void {
  elements.status.textContent = message;
  elements.status.classList.toggle('is-error', isError);
}
