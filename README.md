# Il Patto

Un protocollo di **14 giorni**. Scrivi un impegno con te stesso in forma
**se-allora**, ogni giorno rileggi i 3 meccanismi che ti fanno agire anche senza
voglia, e premi **Ship**. Il progresso cresce lungo un **Sentiero** di 14 nodi.
Salti un giorno e il percorso si chiude — ma puoi ripartire subito.

> **Principio guida.** Ogni scelta si valuta con una domanda sola: _aumenta la
> probabilità che io prema Ship anche nel giorno in cui non ne ho voglia?_ Se sì,
> falla. Se è solo bella ma non sposta quella probabilità, tagliala.

**Live:** https://ilpatto.vercel.app — installabile come PWA (Aggiungi a Home /
Installa app). Tutto in locale (`localStorage`), nessun backend, nessun account.

---

## Setup

```bash
npm install
npm run dev          # server di sviluppo (http://localhost:5173)
```

| Comando | Cosa fa |
| --- | --- |
| `npm run dev` | Dev server Vite |
| `npm run build` | Type-check + build di produzione in `dist/` (genera anche manifest + service worker) |
| `npm run preview` | Anteprima locale della build di produzione (qui gira il service worker / PWA) |
| `npm run typecheck` | `tsc` senza emettere |
| `npm run lint` | ESLint |
| `npm test` | Test unitari (Vitest) — coprono il motore temporale e la geometria del Sentiero |
| `npm run icons` | Rigenera le icone PWA da `public/favicon.svg` (richiede `sharp`) |

---

## Dove sta cosa (per il me di tra tre mesi)

```
src/
  components/   AnimatedNumber (contagiorni fluido)
  features/
    Onboarding/ flusso se-allora in 4 step + sigillo
    Daily/      schermata principale: patto + Sentiero + card + bottone Ship
    Progress/   Sentiero.tsx — i 14 nodi (curva su desktop, salita verticale su mobile)
    Mechanisms/ le 3 card meccanismo (carosello; la Card 1 inietta il patto)
    EndStates/  Broken.tsx (rottura, anti-abbandono) + Completed.tsx (vittoria)
    Debug/      DebugMenu.tsx — pannello dev/QA (vedi sotto)
  hooks/
    usePatto.ts     macchina a stati (active/completed/broken) + azioni
    useDayClock.ts  "now" che si aggiorna su focus/visibilità
    useMediaQuery.ts breakpoint mobile per il Sentiero verticale
  lib/
    time.ts      ⭐ IL CUORE: giornata-patto, rollover 08:00, evaluate(), seal/ship
    types.ts     modello dati Patto + DerivedState (chiave localStorage: ilpatto.v1)
    storage.ts   wrapper localStorage tipizzato (fail-soft se disattivato)
    path.ts      geometria del Sentiero (curva orizzontale + salita verticale)
    motion.ts    EASE + durate condivise (stesso "feel" ovunque)
    debugGate.ts gating del menu debug in produzione
  styles/
    tokens.css   ⭐ tutti i design token (colori, raggi, motion, spazi)
    global.css   reset, font, focus, prefers-reduced-motion
```

### Il motore temporale — `src/lib/time.ts`

Tutto lo stato deriva dal confronto fra **date locali**, mai da timer → robusto a
chiusure, riavvii, riaperture a distanza di giorni, offline.

- Una **giornata-patto** cambia ogni giorno alle **08:00 locali**: prima delle
  08:00 "appartieni" ancora a ieri (`getPattoDay`).
- Il **sigillo** ancora sempre a un Giorno 1 pieno, a qualunque ora (anche prima
  delle 08:00) via `effectivePattoDay` (clamp).
- A ogni apertura `evaluate()` confronta la giornata-patto corrente con
  `lastShippedPattoDate` → `active` / `shipped-today` / `broken` (gap > 1) /
  `completed` (14 ship). Gli stati terminali sono congelati.
- Testato falsificando le date in `src/lib/time.test.ts`.

### Cambiare l'accento (una riga)

In [`src/styles/tokens.css`](src/styles/tokens.css), variabile **`--accent`** (e
il companion `--accent-rgb`). È amber `#F2B441`. Cambia quella riga e tutta l'app
si ritinge (bottoni, nodi, glow). C'è già il commento col valore lime alternativo.
L'icona PWA usa lo stesso ambra in `public/favicon.svg`: se cambi accento, aggiorna
quel file e lancia `npm run icons`.

### Menu debug (dev + QA da telefono)

Pannello con: stato live (giornata-patto, dayNumber, status, lastShipped, prossimo
rollover), **−1 / +1 giornata**, **Vai al giorno N**, **Forza interrotto**,
**Reset totale**. Tutte le manipolazioni passano da `devDayOffset`, quindi sono
indistinguibili dal tempo reale.

- **In locale** (`npm run dev`): sempre montato.
- **In produzione** è nascosto. Per sbloccarlo:
  - **da browser:** apri `https://ilpatto.vercel.app/?debug=ship-1408` (il flag
    resta salvato, il parametro viene rimosso dall'URL);
  - **da PWA installata** (niente barra indirizzi): **5 tap rapidi nell'angolo in
    alto a sinistra**.
  - "Disattiva debug" nel pannello lo rimuove.
- La chiave è `DEBUG_KEY` in [`src/lib/debugGate.ts`](src/lib/debugGate.ts).

---

## PWA & deploy

- `vite-plugin-pwa` (in `vite.config.ts`): manifest + service worker
  **offline-first** (`registerType: autoUpdate`, precache di app shell + font +
  icone). L'app si apre e funziona senza rete; lo Ship è `localStorage`.
- Niente flash bianco: `theme_color`/`background_color` = panna `#FAF8F4` + sfondo
  inline sull'`html`.
- Icone generate da `public/favicon.svg` (un nodo che si accende su campo ambra):
  192 / 512 / maskable / apple-touch. Rigenera con `npm run icons`.
- **Deploy:** push su `main` → Vercel builda e pubblica in automatico. Nessuna
  variabile d'ambiente. Framework preset: Vite.
- **Installare:** apri il link dal telefono → Aggiungi a Home (iOS) / Installa
  app (Android).

---

## Backlog v2 (NON nella v1)

- **Sprint crescenti 14 → 30 → 60** con sblocco sequenziale; la morte (percorso
  interrotto) retrocede allo sprint da 14. La schermata Completed è già la "porta"
  dove agganciarli.
- Login / cloud / sync multi-dispositivo.
- Leaderboard / profili pubblici.
- Journaling (testo/audio); immagine generata via AI dal journaling.
- Push notification reminder.
- Storico patti; porting nativo.
```
