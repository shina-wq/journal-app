# Journal App

A small, type-safe journal that runs entirely in the browser. Write entries, tag each one with a mood, search and filter them, and get a writing prompt matched to how you feel. Everything is saved to `localStorage`.

Built for the **TypeScript Fundamentals** assignment, with a focus on strict typing, interfaces, enums, and generics.

## Features

- Create, edit, and delete journal entries, with autosave as you type
- Tag entries with a mood: Happy, Sad, Motivated, Stressed, or Calm
- Search entries by title and text, and filter them by mood
- Entries grouped by Today, Yesterday, This week, then by month
- Mood-based writing prompts, with a shuffle button for a new one
- Light and dark themes, remembered between visits
- Entries persist across reloads via `localStorage`
- Responsive layout for mobile and desktop

## Getting started

Requires [Node.js](https://nodejs.org/).

```bash
npm install
npm run build
```

`npm run build` compiles `src/` into `dist/`. Use `npm run watch` to recompile on save.

The app loads ES modules, so serve the folder instead of opening `index.html` directly from disk:

```bash
npx serve .
```

Then open the URL it prints. VS Code's Live Server extension works too.

## Project structure

```
index.html        Entry point, loads dist/journal.js
styles.css        Styles and responsive layout
src/
  journal.ts      Core logic: add, edit, delete, search and filter entries, plus event handlers
  types.ts        Mood enum, JournalEntry interface, Journal and EntryInput types
  storage.ts      Type-safe save/load with localStorage
  ui.ts           Typed DOM rendering and form handling
  prompts.ts      Mood-based writing prompts
```

## How TypeScript is used

- **Strict compiler**: `tsconfig.json` enables `strict`, plus `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`, targeting `es2020`.
- **Interface and enum**: every entry matches the `JournalEntry` interface, and `mood` must be a `Mood` enum value.
- **Generics**: `findByProperty<T>(list, key, value)` finds an item in any array of objects by any of its keys.
- **Safe storage**: data read from `localStorage` is `unknown` until a type guard (`isJournalEntry`) proves it is a valid entry. A plain `as JournalEntry[]` assertion would only tell the compiler to trust the data; the guard checks every field at runtime, so edited or corrupted storage can't crash the app. A `null` from `getItem` (nothing saved yet) and malformed JSON both fall back to an empty journal.
- **Typed mutations**: `addEntry` takes an `EntryInput` (an entry without `id` and `timestamp`) and builds a complete `JournalEntry`, so the compiler rejects an entry with missing or wrong fields.
- **Typed DOM**: elements are looked up with a generic `getElement<T>()` helper, so each one has its exact type (`HTMLInputElement`, `HTMLTextAreaElement`, `HTMLFieldSetElement`, ...).
- **Exhaustive prompts**: prompts are stored in a `Record<Mood, string[]>`, so adding a new mood is a compile error until it has prompts.

## Where the compiler prevented runtime errors

Each of these mistakes would have run in plain JavaScript and failed in the browser. `npx tsc` rejects them before the code ever runs:

| Mistake | Compiler error | What would have happened at runtime |
|---|---|---|
| `entries[0].id` to open the latest entry | `TS2532: Object is possibly 'undefined'.` | With an empty journal, `TypeError: Cannot read properties of undefined`. Fixed with `entries[0]?.id ?? null` (caught thanks to `noUncheckedIndexedAccess`). |
| `const raw: string = localStorage.getItem(...)` | `TS2322: Type 'string \| null' is not assignable to type 'string'.` | On a first visit `getItem` returns `null`, and parsing it as entries would break. `loadEntries` checks for `null` first. |
| `const input: HTMLInputElement = document.querySelector('#search')` | `TS2322: Type 'HTMLInputElement \| null' is not assignable to type 'HTMLInputElement'.` | A renamed or missing element would crash on first use. `getElement<T>()` throws a clear `Missing element: #search` instead. |
| `mood: 'happy'` in a `JournalEntry` | `TS2322: Type '"happy"' is not assignable to type 'Mood'.` | Typos like `'hapy'` would be saved and break the mood filter. Moods must come from the `Mood` enum. |
| Creating an entry without `timestamp` | `TS2741: Property 'timestamp' is missing ... but required in type 'JournalEntry'.` | The entry would sort and group as `NaN` / "Invalid Date". `addEntry` always adds `id` and `timestamp`. |
| `groups.at(-1)` to get the last date group in `renderEntries` | `TS2550: Property 'at' does not exist on type '{ label: string; entries: JournalEntry[]; }[]'. ... Try changing the 'lib' compiler option to 'es2022' or later.` | `Array.prototype.at` is newer than the `es2020` target, so older browsers would throw `is not a function`. Replaced with `groups[groups.length - 1]`. |
