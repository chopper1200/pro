# Inverno Fit — PRD

## Problem statement (originale)
Web app STATICA (PWA) single-user per il tracking degli allenamenti, ospitabile su GitHub Pages, senza backend e senza costi. Obiettivi: UI/UX rinnovata mobile-first, piani modificabili/creabili, persistenza robusta (IndexedDB), backup JSON, funzionamento offline (PWA).

## User choices
- Parto da vuoto MA con piano demo precaricato al primo avvio.
- Timer recupero: solo vibrazione.
- Stack: React (JS) accettato al posto di TS.
- Unità peso di default: kg.

## Architettura
- 100% frontend statico. NESSUN backend, NESSUN database server, NESSUNA autenticazione.
- React + React Router (HashRouter, ideale per GitHub Pages).
- Storage: IndexedDB via `localforage` (`src/lib/db.js`), stato globale in `src/store/StoreContext.js`.
- Versioning schema dati (`schemaVersion`) con funzione `migrate` per aggiornamenti futuri non distruttivi.
- PWA: `public/manifest.json` + `public/service-worker.js` (stale-while-revalidate, registrato solo in build production), icona in `public/icons/icon-512.png`.
- Design "Inverno": dark di default, accenti blu/ghiaccio, mobile-first, tap target ≥48px.

## User personas
- Atleta singolo che si allena in palestra e vuole registrare serie/pesi offline dal telefono.

## Core requirements (statici)
1. Home: piano attivo + settimana corrente, statistiche, avvio giornata.
2. Editor piani: CRUD completo piani / settimane / giorni / esercizi (nome, serie, rip/tempo, recupero, note, immagine, link guida) + duplica/riordina.
3. Modalità allenamento: logger peso/rip con stepper, spunta serie, timer recupero configurabile, vibrazione a fine recupero, navigazione tra esercizi, termina & salva.
4. Storico: log per esercizio + mini-grafico progressione (peso max + stima 1RM Epley) con Recharts.
5. Impostazioni: tema chiaro/scuro, vibrazione, unità kg/lbs, recupero default, export/import backup JSON, diagnostica storage.

## Implementato (2026-06-24)
- ✅ Setup app statica React + IndexedDB (localforage) con seed piano demo "Inverno Split (PPL)" (Push/Pull/Legs).
- ✅ UI/UX completa tema Inverno dark/light, bottom nav, mobile-first.
- ✅ Editor piani CRUD completo (piani/settimane/giorni/esercizi, duplica, riordina).
- ✅ Modalità allenamento con timer recupero + vibrazione, logger serie, avanzamento.
- ✅ Storico esercizi con grafico di progressione (Recharts).
- ✅ Backup export/import JSON + versioning schema.
- ✅ PWA (manifest + service worker + icona).
- ✅ Testing agent: tutti i flussi core confermati; 4 issue minori corretti (unità volume Home, apostrofi ESLint, testid stepper, accessibilità dialog).

## Backlog / migliorie future (P1/P2)
- P1: Sovraccarico progressivo suggerito in base allo storico.
- P2: Drag & drop per riordino esercizi (attuale: frecce su/giù).
- P2: Riepilogo sessione post-allenamento (volume, PR battuti).
- P2 (fuori scope attuale): multi-dispositivo con backend FastAPI + MongoDB + account.

## Next tasks
- Vedi Next Action Items nel summary di consegna.
