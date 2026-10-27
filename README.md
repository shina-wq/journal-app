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
  types.ts        Mood enum, JournalEntry interface, Journal and EntryInput types
  journal.ts      Business logic (add, edit, delete, search, filter, autosave) and event handlers
  storage.ts      Type-safe save/load with localStorage
  ui.ts           Typed DOM rendering and form handling
  prompts.ts      Mood-based writing prompts
```

## How TypeScript is used

- **Strict compiler**: `tsconfig.json` enables `strict`, plus `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`, targeting `es2020`.
- **Interface and enum**: every entry matches the `JournalEntry` interface, and `mood` must be a `Mood` enum value.
- **Generics**: `findByProperty<T>(list, key, value)` finds an item in any array of objects by any of its keys.
- **Safe storage**: data read from `localStorage` is `unknown` until a type guard (`isJournalEntry`) proves it is a valid entry. Missing or malformed data falls back to an empty journal.
- **Typed mutations**: `addEntry` takes an `EntryInput` (an entry without `id` and `timestamp`) and builds a complete `JournalEntry`, so the compiler rejects an entry with missing or wrong fields.
- **Typed DOM**: elements are looked up with a generic `getElement<T>()` helper, so each one has its exact type (`HTMLInputElement`, `HTMLTextAreaElement`, `HTMLFieldSetElement`, ...).
- **Exhaustive prompts**: prompts are stored in a `Record<Mood, string[]>`, so adding a new mood is a compile error until it has prompts.
