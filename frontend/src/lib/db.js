import localforage from "localforage";
import { buildSeedState, CURRENT_SCHEMA } from "@/lib/seed";

const store = localforage.createInstance({
  name: "inverno-fit",
  storeName: "state",
  description: "Inverno Fit — dati piani, log allenamenti, impostazioni",
});

const KEY = "app-state";

function migrate(state) {
  const s = { ...state };
  if (!s.schemaVersion) s.schemaVersion = 1;
  if (!s.settings) s.settings = { theme: "dark", defaultRest: 90, unit: "kg", vibration: true };
  if (s.settings.vibration === undefined) s.settings.vibration = true;
  if (!Array.isArray(s.plans)) s.plans = [];
  if (!Array.isArray(s.logs)) s.logs = [];
  if (s.session === undefined) s.session = null;
  // future migrations keyed on schemaVersion go here
  s.schemaVersion = CURRENT_SCHEMA;
  return s;
}

export async function loadState() {
  try {
    const existing = await store.getItem(KEY);
    if (!existing) {
      const seed = buildSeedState();
      await store.setItem(KEY, seed);
      return seed;
    }
    return migrate(existing);
  } catch (e) {
    return buildSeedState();
  }
}

export async function saveState(state) {
  const clean = { ...state };
  return store.setItem(KEY, clean);
}

export async function estimateUsage() {
  if (navigator.storage && navigator.storage.estimate) {
    try {
      const { usage, quota } = await navigator.storage.estimate();
      return { usage, quota };
    } catch (e) {
      return null;
    }
  }
  return null;
}

export function serializeBackup(state) {
  const payload = {
    app: "inverno-fit",
    schemaVersion: state.schemaVersion || CURRENT_SCHEMA,
    exportedAt: new Date().toISOString(),
    plans: state.plans,
    activePlanId: state.activePlanId,
    activeWeekId: state.activeWeekId,
    logs: state.logs,
    settings: state.settings,
  };
  return JSON.stringify(payload, null, 2);
}
