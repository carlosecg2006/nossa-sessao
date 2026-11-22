# Nossa Sessão Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Netflix-style movie catalog in purple and black, where Carlos and a friend (no account) pick films, keep an ordered queue and tick off watched ones, synced live.

**Architecture:** A Vite + React + TypeScript single-page app. TMDB is the live movie database: details are always fetched fresh, and only `tmdbId`, `mediaType` and per-room state are stored. Firestore keeps per-room state under `rooms/{roomId}/entries/{mediaType}-{tmdbId}`, read live with `onSnapshot`. Invisible Firebase anonymous auth plus a secret `roomId` protect the data, and Firebase Hosting serves the site.

**Tech Stack:** Vite 6, React 19, TypeScript, Firebase JS SDK v11 (auth, firestore), Vitest + @testing-library/react + jsdom, TMDB API v3.

**Spec:** `docs/superpowers/specs/2026-11-22-nossa-sessao-design.md`

## Global Constraints

- Colors: purple `#8B3DFF`, background `#0B0710`. Fonts: Bebas Neue (titles), Inter (text).
- Name shown: "Nossa Sessão". No Netflix logo or name anywhere.
- All UI text in Brazilian Portuguese. TMDB requests use `language=pt-BR` and `region=BR`.
- "Onde assistir" shows only TMDB watch providers for `BR`. No links to unofficial streaming sites.
- The friend never sees a login, password or sign-up screen. Auth is `signInAnonymously` only.
- URL: `/?sala=<roomId>`. Owner URL: `/?sala=<roomId>&dono=<ownerKey>`. `roomId` and `ownerKey` are 20-char random base62.
- Secrets come from `.env` (`VITE_TMDB_KEY`, `VITE_FIREBASE_*`), with `.env` git-ignored.
- Works at 360 px width and on desktop.

## Review Focus

1. A film with no pt-BR synopsis: fall back to the en-US overview, and never show an empty box. Test in Task 2.
2. A film with no YouTube trailer: hide the Trailer button rather than open a broken player. Test in Task 2.
3. No BR providers: show "Ainda não está em streaming oficial no Brasil". Test in Task 6.
4. Adding a film already in the catalog (from search or from Lançamentos): the doc id is `{mediaType}-{tmdbId}`, so nothing is duplicated. Test in Task 3.
5. A missing or invalid `sala` in the URL: show "Link incompleto, peça o link certo pro Carlos" instead of a blank page. Test in Task 4.

---

### Task 1: Project scaffold and theme

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `.gitignore`, `.env.example`, `src/main.tsx`, `src/App.tsx`, `src/styles/theme.css`, `src/test/setup.ts`
- Test: `src/App.test.tsx`

- [ ] **Step 1:** Scaffold with `npm create vite@latest . -- --template react-ts`, then add `firebase`, and `vitest @testing-library/react @testing-library/jest-dom jsdom` as dev dependencies. Configure the Vitest `jsdom` environment and the setup file in `vite.config.ts`.
- [ ] **Step 2:** Write the test `renders brand name`: render `<App/>` and expect the text "Nossa Sessão".
- [ ] **Step 3:** Run `npx vitest run src/App.test.tsx`. Expected: FAIL.
- [ ] **Step 4:** Write `theme.css` with CSS variables `--roxo:#8B3DFF; --preto:#0B0710; --texto:#F4EEFF; --cinza:#A99BC2`, the Google Fonts import for Bebas Neue and Inter, and a minimal `App` header with the brand name in Bebas Neue and purple.
- [ ] **Step 5:** Run the test. Expected: PASS. Run `npm run build`. Expected: exit 0.
- [ ] **Step 6:** Commit `chore: scaffold Nossa Sessão with theme`.

### Task 2: TMDB client and mappers

**Files:**
- Create: `src/lib/types.ts`, `src/lib/tmdb.ts`
- Test: `src/lib/tmdb.test.ts`, with fixtures in `src/lib/__fixtures__/`

**Interfaces:**
- Produces (`types.ts`):
  - `type MediaType = 'movie' | 'tv'`
  - `interface Summary { id:number; mediaType:MediaType; title:string; year:string; posterUrl:string|null; backdropUrl:string|null; genreIds:number[] }`
  - `interface Details extends Summary { overview:string; runtimeMin:number|null; certification:string|null; genres:string[]; director:string|null; cast:string[]; trailerYoutubeKey:string|null; images:string[]; providers:{name:string; logoUrl:string}[] }`
- Produces (`tmdb.ts`):
  - `searchTitles(q:string): Promise<Summary[]>`, using `/search/multi` and dropping people
  - `getDetails(mediaType, id): Promise<Details>`, using `append_to_response=videos,images,credits,watch/providers,release_dates,content_ratings`
  - `getLancamentos(): Promise<Summary[]>`, merging `/movie/now_playing` and `/movie/upcoming` with `region=BR`
  - pure functions `mapDetails(raw, mediaType, rawEnOverview?:string): Details`, `pickTrailer(videos): string|null`, `imageUrl(path, size)`

- [ ] **Step 1:** Write tests with JSON fixtures:
  - `mapDetails uses pt-BR overview`
  - `mapDetails falls back to en overview when pt-BR empty` (Review Focus 1)
  - `pickTrailer prefers official YouTube Trailer type`
  - `pickTrailer returns null when no YouTube video` (Review Focus 2)
  - `mapDetails reads BR flatrate providers only`
  - `mapDetails takes director from crew job Director and first 5 cast`
  - `tv uses name and first_air_date`
- [ ] **Step 2:** Run `npx vitest run src/lib/tmdb.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement. Base URL `https://api.themoviedb.org/3`, with `api_key=import.meta.env.VITE_TMDB_KEY`. Images come from `https://image.tmdb.org/t/p/{w342|w780|w1280}`. `getDetails` makes a second en-US call only when the pt-BR overview is empty.
- [ ] **Step 4:** Run the tests. Expected: PASS.
- [ ] **Step 5:** Commit `feat: TMDB client with pt-BR mapping`.

### Task 3: Room state model (pure)

**Files:**
- Create: `src/lib/catalog.ts`
- Test: `src/lib/catalog.test.ts`

**Interfaces:**
- Produces:
  - `type Status = 'catalogo'|'fila'|'assistido'`
  - `interface Entry { key:string; tmdbId:number; mediaType:MediaType; status:Status; queuePos:number|null; reaction:'quero'|'naocurti'|null; pickedAt:number|null; watchedAt:number|null; addedAt:number }`
  - `entryKey(mediaType, id): string`, which returns e.g. `"movie-123"`
  - `addToCatalog(entries:Entry[], s:Summary, now:number): Entry[]` (idempotent)
  - `addToQueue(entries, key): Entry[]` (appends at the end of the queue)
  - `moveInQueue(entries, key, dir:-1|1): Entry[]`
  - `markWatched(entries, key, now): Entry[]` (leaves the queue and renumbers it)
  - `react(entries, key, r:'quero'|'naocurti', now): Entry[]`
  - `queue(entries): Entry[]`, `picks(entries): Entry[]`, `toReview(entries): Entry[]`, `watched(entries): Entry[]`
  - `newPicksSince(entries, lastSeen:number): Entry[]`

- [ ] **Step 1:** Write tests:
  - `addToCatalog twice keeps one entry` (Review Focus 4)
  - `addToQueue appends with next queuePos`
  - `moveInQueue swaps neighbours and is a no-op at the ends`
  - `markWatched removes from queue, renumbers 0..n-1, sets watchedAt`
  - `react quero sets pickedAt`; `react naocurti appears in toReview`
  - `newPicksSince returns only picks after lastSeen`
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement as pure functions that return new arrays.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5:** Commit `feat: pure room state model`.

### Task 4: Room link and Firebase sync

**Files:**
- Create: `src/lib/room.ts`, `src/lib/firebase.ts`, `src/lib/useRoom.ts`, `firestore.rules`, `firebase.json`
- Test: `src/lib/room.test.ts`

**Interfaces:**
- Consumes: `Entry` and `entryKey` from Task 3.
- Produces:
  - `parseRoom(search:string): {roomId:string; isOwner:boolean} | null` (null when `sala` is missing or not 20 base62 chars)
  - `newCode(): string`
  - `useRoom(roomId): { entries:Entry[]; loading:boolean; error:string|null; save(e:Entry):Promise<void>; remove(key:string):Promise<void> }`
- Note: `isOwner` is true when `dono` exists and matches the doc `rooms/{roomId}` field `ownerKey`. That check runs inside `useRoom`; `parseRoom` only returns the raw `dono` value.

- [ ] **Step 1:** Write tests:
  - `parseRoom accepts valid sala`
  - `parseRoom returns null for missing or short sala` (Review Focus 5)
  - `parseRoom flags dono present`
  - `newCode is 20 base62 chars`
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement `room.ts`. Then `firebase.ts` (init from `VITE_FIREBASE_*`, plus `signInAnonymously` on load) and `useRoom` (`onSnapshot` on `rooms/{roomId}/entries`, `setDoc` by `entry.key`, a 10 s loading timeout that sets `error`). In `App`, show "Link incompleto, peça o link certo pro Carlos" when `parseRoom` returns null.
- [ ] **Step 4:** Write `firestore.rules`: read and write on `rooms/{roomId}` and `rooms/{roomId}/entries/{key}` only when `request.auth != null`. There is no list on `rooms` (the room id stays secret).
- [ ] **Step 5:** Run the tests. Expected: PASS.
- [ ] **Step 6:** Manual check against the real Firebase project: open two browsers on the same `?sala=`, add an entry in one and see it appear in the other in under 2 s.
- [ ] **Step 7:** Commit `feat: secret room link and live Firestore sync`.

### Task 5: Browse screen (hero, rows, search)

**Files:**
- Create: `src/components/Header.tsx`, `SearchBar.tsx`, `Hero.tsx`, `Row.tsx`, `PosterCard.tsx`, and `src/lib/rows.ts`
- Test: `src/lib/rows.test.ts`, `src/components/SearchBar.test.tsx`

**Interfaces:**
- Consumes: Tasks 2–4.
- Produces:
  - `buildRows(entries, detailsByKey, lancamentos:Summary[], isOwner): {id:string; title:string; items:(Entry|Summary)[]}[]`
  - Row order: "Nossa fila", "Escolhidos por ela", genre rows (one per TMDB genre with at least 1 catalog film; "Fantasia" shows as "Bruxas e magia"), "Lançamentos", "Já vimos ✓", and "Pra revisar" (owner only). Empty rows are omitted.

- [ ] **Step 1:** Write tests:
  - `buildRows omits empty rows`
  - `Pra revisar only for owner`
  - `Lançamentos excludes items already in catalog`
  - `SearchBar debounces 300 ms and lists results; click calls onAdd`
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement the Netflix-style layout:
  - Fixed header that becomes opaque on scroll.
  - Hero with the backdrop and a gradient into `--preto`.
  - Rows that scroll sideways, using CSS scroll-snap and arrow buttons on desktop.
  - Posters at `w342` that scale to 1.08 on hover.
  - A purple marker on a card when it is in the queue.
  - The hero shows the first queue item, or otherwise a random catalog film.
- [ ] **Step 4:** Run. Expected: PASS. Verify by eye with `npm run dev` at 360 px and 1440 px.
- [ ] **Step 5:** Commit `feat: Netflix-style browse screen in purple`.

### Task 6: Details modal and actions

**Files:**
- Create: `src/components/DetailsModal.tsx`
- Test: `src/components/DetailsModal.test.tsx`

**Interfaces:**
- Consumes: `Details` from Task 2, and `react`, `addToQueue`, `markWatched` from Task 3.
- Produces: `<DetailsModal details entry isOwner onChange(entries) onClose/>`

- [ ] **Step 1:** Write tests:
  - `shows providers or the no-BR message` (Review Focus 3)
  - `hides Trailer button when trailerYoutubeKey null`
  - `Quero ver calls react quero`
  - `Já assistimos only when in fila`
  - `Remover only for owner`
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement:
  - Trailer as an iframe `https://www.youtube-nocookie.com/embed/{key}`.
  - A photo strip from `images` (`w780`).
  - The metadata grid.
  - Buttons ♥ Quero ver, 👎 Não curti, + Fila / ✓ Já assistimos, and Remover (owner only). When the item is not in the catalog yet (it came from Lançamentos), show "+ Adicionar ao catálogo", which calls `addToCatalog`.
  - Close on Esc and on a backdrop click.
  - Focus trap.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5:** Commit `feat: details modal with trailer and actions`.

### Task 7: Owner pick alerts and queue reorder

**Files:**
- Create: `src/components/PickToast.tsx`, and modify `src/components/Row.tsx`
- Test: `src/components/PickToast.test.tsx`

- [ ] **Step 1:** Write tests:
  - `owner sees "Ela escolheu: {title}" for newPicksSince(lastSeen)`
  - `dismiss stores lastSeen in localStorage`
  - `non-owner sees nothing`
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement the toast. In "Nossa fila", add ◀ ▶ buttons on each card that call `moveInQueue`, and HTML5 drag on desktop.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5:** Commit `feat: pick alerts and queue reorder`.

### Task 8: Seed, deploy, and links

**Files:**
- Create: `scripts/seed.ts`, `scripts/seed-list.json`, and `README.md` (step-by-step setup in pt-BR, for a layperson)

- [ ] **Step 1:** In `seed-list.json`, list title, year and mediaType for each title:
  - Abracadabra (1993)
  - A Feiticeira (2005)
  - As Bruxas de Eastwick (1987)
  - O Poder Mágico (1989)
  - Convenção das Bruxas (1990)
  - Jovens Bruxas (1996)
  - Sabrina (1996, movie)
  - Charmed (1998, tv)
  - A Pequena Bruxa (2018)
  - A Morte Lhe Cai Bem (1992)
  - Vampiras (2012)
  - Dirty Dancing (1987)
  - Antes do Amanhecer (1995)
  - Antes do Pôr do Sol (2004)
  - Antes da Meia-Noite (2013)
  - Questão de Tempo (2013)
  - Uma Ideia de Você (2024)
  - A Lista da Minha Vida (2025)
  - Magia e Sedução (1998) and Magia e Sedução 2, marked `assistido`
- [ ] **Step 2:** `seed.ts` (run with `npx tsx`) creates `rooms/{newCode}` with `ownerKey`, resolves each title through `searchTitles` with a year match, writes the entries, and prints the friend link and the owner link.
- [ ] **Step 3:** Run it against the real project. Expected: two links printed, and every title resolved. Any title that does not resolve is listed for a manual fix.
- [ ] **Step 4:** Run `npm run build && npx firebase deploy --only hosting,firestore:rules`. Expected: a Hosting URL. Open the friend link on a phone and confirm there is no login screen.
- [ ] **Step 5:** Commit `feat: seed catalog and deploy`.
