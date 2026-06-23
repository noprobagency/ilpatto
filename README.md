# Il Patto

Un protocollo di 14 giorni. Scrivi un impegno con te stesso in forma **se-allora**,
ogni giorno rileggi i 3 meccanismi che ti fanno agire anche senza voglia, e premi
**Ship**. Il progresso cresce lungo un sentiero di 14 nodi. Salti un giorno e il
percorso si chiude.

> Metrica di successo: non "è bella", ma se ti fa premere Ship anche nel giorno in
> cui non ne hai voglia.

## Stack

- **React 18 + Vite + TypeScript**
- **CSS Modules** + design token CSS custom properties (dark-first, accento ambra)
- **Framer Motion** per le micro-interazioni premium
- **localStorage** tipizzato e versionato (`ilpatto.v1`) — nessun backend, nessun account
- **vite-plugin-pwa** (manifest + service worker offline) — _da Fase 7_
- Logica temporale custom basata su date locali ("giornate-patto", sblocco alle 08:00)

## Setup

```bash
npm install
npm run dev
```

L'app gira interamente in locale: funziona offline e non invia dati da nessuna parte.

## Script

| Comando             | Cosa fa                                              |
| ------------------- | ---------------------------------------------------- |
| `npm run dev`       | Server di sviluppo Vite                              |
| `npm run build`     | Type-check + build di produzione in `dist/`          |
| `npm run preview`   | Anteprima locale della build di produzione           |
| `npm run typecheck` | Controllo TypeScript senza emettere file             |
| `npm run lint`      | ESLint                                               |
| `npm test`          | Test unitari (Vitest) — copre il motore temporale    |

## Architettura

```
src/
  components/   componenti UI riusabili
  features/     Onboarding · Daily · Progress (Sentiero) · Mechanisms · EndStates
  hooks/        usePatto (state machine) · useDayClock
  lib/          time.ts (motore date) · storage.ts · types.ts
  styles/       tokens.css · global.css
  assets/       icone, illustrazioni
```

### Il motore temporale (il cuore)

Tutto lo stato deriva dal confronto fra **date locali**, mai da timer:

- Una **giornata-patto** cambia ogni giorno alle **08:00 locali**. Prima delle 08:00
  "appartieni" ancora al giorno precedente.
- Si salvano `startPattoDate`, `lastShippedPattoDate`, `shippedCount`, `status`.
- A ogni apertura si ricalcola tutto: già spedito oggi / Ship disponibile / interrotto
  (gap > 1 giorno) / completato (14 giorni).

È robusto a chiusure dell'app, riavvii e riaperture a distanza di giorni. La logica è
pura e testata falsificando le date (`src/lib/time.test.ts`).

### Skip Day (solo in sviluppo)

In `npm run dev` è presente un pulsante **Skip Day** che avanza di esattamente una
giornata-patto simulata (`devDayOffset`), indistinguibile dal passare reale del tempo.
È escluso dalla build di produzione (`import.meta.env.DEV`).

## Deploy (Vercel)

_Documentato nella Fase 9._ In breve: build statica in `dist/`, framework preset
**Vite**, nessuna variabile d'ambiente necessaria per la v1.

## Stato di build (per fasi)

- [x] **Fase 0** — setup, struttura, design token, dark theme
- [x] **Fase 1** — motore temporale + state machine + test
- [ ] Fase 2 — Onboarding se-allora + sigillo
- [ ] Fase 3 — Daily + Il Sentiero (14 nodi)
- [ ] Fase 4 — 3 card meccanismi
- [ ] Fase 5 — Bottone Ship + feedback
- [ ] Fase 6 — Completed & Broken
- [ ] Fase 7 — PWA
- [ ] Fase 8 — Rifinitura (responsive, a11y)
- [ ] Fase 9 — Deploy
