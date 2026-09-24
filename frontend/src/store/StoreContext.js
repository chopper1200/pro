import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { loadState, saveState, serializeBackup } from "@/lib/db";
import { CURRENT_SCHEMA } from "@/lib/seed";
import { uid } from "@/lib/id";

const StoreContext = createContext(null);
export const useStore = () => useContext(StoreContext);

function reassignIds(plan) {
  plan.id = uid();
  plan.weeks.forEach((w) => {
    w.id = uid();
    w.days.forEach((d) => {
      d.id = uid();
      d.exercises.forEach((e) => {
        e.id = uid();
      });
    });
  });
}

function lastLogForName(logs, name) {
  const matches = logs
    .filter((l) => l.exerciseName === name)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  return matches[0] || null;
}

export function StoreProvider({ children }) {
  const [state, setState] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadState().then((s) => {
      setState(s);
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (!state) return;
    const root = document.documentElement;
    if (state.settings.theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [state?.settings?.theme]);

  const update = useCallback((mutator) => {
    setState((prev) => {
      const next = structuredClone(prev);
      mutator(next);
      saveState(next).catch(() => {});
      return next;
    });
  }, []);

  const actions = useMemo(() => {
    const findPlan = (s, id) => s.plans.find((p) => p.id === id);

    return {
      setSetting: (key, value) => update((s) => { s.settings[key] = value; }),

      toggleTheme: () =>
        update((s) => {
          s.settings.theme = s.settings.theme === "dark" ? "light" : "dark";
        }),

      setActivePlan: (id) =>
        update((s) => {
          s.activePlanId = id;
          const p = s.plans.find((x) => x.id === id);
          if (p && p.weeks[0]) s.activeWeekId = p.weeks[0].id;
        }),

      setActiveWeek: (id) => update((s) => { s.activeWeekId = id; }),

      createPlan: (name) => {
        const id = uid();
        update((s) => {
          s.plans.push({
            id,
            name: name || "Nuovo piano",
            weeks: [{ id: uid(), name: "Settimana 1", days: [] }],
          });
          if (!s.activePlanId) {
            s.activePlanId = id;
            s.activeWeekId = s.plans[s.plans.length - 1].weeks[0].id;
          }
        });
        return id;
      },

      renamePlan: (id, name) =>
        update((s) => { const p = findPlan(s, id); if (p) p.name = name; }),

      duplicatePlan: (id) =>
        update((s) => {
          const p = findPlan(s, id);
          if (!p) return;
          const copy = structuredClone(p);
          copy.name = `${p.name} (copia)`;
          reassignIds(copy);
          s.plans.push(copy);
        }),

      deletePlan: (id) =>
        update((s) => {
          s.plans = s.plans.filter((p) => p.id !== id);
          if (s.activePlanId === id) {
            s.activePlanId = s.plans[0]?.id || null;
            s.activeWeekId = s.plans[0]?.weeks[0]?.id || null;
          }
        }),

      addWeek: (planId) =>
        update((s) => {
          const p = findPlan(s, planId);
          if (p) p.weeks.push({ id: uid(), name: `Settimana ${p.weeks.length + 1}`, days: [] });
        }),

      renameWeek: (planId, weekId, name) =>
        update((s) => {
          const w = findPlan(s, planId)?.weeks.find((x) => x.id === weekId);
          if (w) w.name = name;
        }),

      duplicateWeek: (planId, weekId) =>
        update((s) => {
          const p = findPlan(s, planId);
          const w = p?.weeks.find((x) => x.id === weekId);
          if (!w) return;
          const copy = structuredClone(w);
          copy.id = uid();
          copy.name = `${w.name} (copia)`;
          copy.days.forEach((d) => {
            d.id = uid();
            d.exercises.forEach((e) => (e.id = uid()));
          });
          p.weeks.push(copy);
        }),

      deleteWeek: (planId, weekId) =>
        update((s) => {
          const p = findPlan(s, planId);
          if (p) p.weeks = p.weeks.filter((w) => w.id !== weekId);
          if (s.activeWeekId === weekId) s.activeWeekId = p?.weeks[0]?.id || null;
        }),

      addDay: (planId, weekId) =>
        update((s) => {
          const w = findPlan(s, planId)?.weeks.find((x) => x.id === weekId);
          if (w) w.days.push({ id: uid(), name: `Giorno ${w.days.length + 1}`, exercises: [] });
        }),

      renameDay: (planId, weekId, dayId, name) =>
        update((s) => {
          const d = findPlan(s, planId)?.weeks
            .find((x) => x.id === weekId)?.days.find((x) => x.id === dayId);
          if (d) d.name = name;
        }),

      deleteDay: (planId, weekId, dayId) =>
        update((s) => {
          const w = findPlan(s, planId)?.weeks.find((x) => x.id === weekId);
          if (w) w.days = w.days.filter((d) => d.id !== dayId);
        }),

      addExercise: (planId, weekId, dayId, exercise) =>
        update((s) => {
          const d = findPlan(s, planId)?.weeks
            .find((x) => x.id === weekId)?.days.find((x) => x.id === dayId);
          if (d) d.exercises.push({ id: uid(), sets: 3, reps: "10-12", rest: 90, note: "", image: "", guideLink: "", ...exercise });
        }),

      updateExercise: (planId, weekId, dayId, exId, patch) =>
        update((s) => {
          const d = findPlan(s, planId)?.weeks
            .find((x) => x.id === weekId)?.days.find((x) => x.id === dayId);
          const ex = d?.exercises.find((e) => e.id === exId);
          if (ex) Object.assign(ex, patch);
        }),

      deleteExercise: (planId, weekId, dayId, exId) =>
        update((s) => {
          const d = findPlan(s, planId)?.weeks
            .find((x) => x.id === weekId)?.days.find((x) => x.id === dayId);
          if (d) d.exercises = d.exercises.filter((e) => e.id !== exId);
        }),

      moveExercise: (planId, weekId, dayId, exId, dir) =>
        update((s) => {
          const d = findPlan(s, planId)?.weeks
            .find((x) => x.id === weekId)?.days.find((x) => x.id === dayId);
          if (!d) return;
          const i = d.exercises.findIndex((e) => e.id === exId);
          const j = i + dir;
          if (i < 0 || j < 0 || j >= d.exercises.length) return;
          [d.exercises[i], d.exercises[j]] = [d.exercises[j], d.exercises[i]];
        }),

      startSession: ({ planId, weekId, dayId }) =>
        update((s) => {
          const plan = findPlan(s, planId);
          const week = plan?.weeks.find((w) => w.id === weekId);
          const day = week?.days.find((d) => d.id === dayId);
          if (!day) return;
          const entries = day.exercises.map((ex) => {
            const last = lastLogForName(s.logs, ex.name);
            const count = Math.max(1, parseInt(ex.sets, 10) || 3);
            const sets = Array.from({ length: count }, (_, i) => ({
              weight: last?.sets[i]?.weight ?? "",
              reps: last?.sets[i]?.reps ?? "",
              done: false,
            }));
            return {
              exerciseId: ex.id,
              name: ex.name,
              note: ex.note,
              image: ex.image,
              guideLink: ex.guideLink,
              target: ex.reps,
              rest: parseInt(ex.rest, 10) || s.settings.defaultRest,
              sets,
            };
          });
          s.session = {
            planId,
            weekId,
            dayId,
            planName: plan.name,
            dayName: day.name,
            startedAt: new Date().toISOString(),
            currentIndex: 0,
            entries,
          };
        }),

      setSessionIndex: (i) => update((s) => { if (s.session) s.session.currentIndex = i; }),

      updateSet: (exId, i, patch) =>
        update((s) => {
          const en = s.session?.entries.find((e) => e.exerciseId === exId);
          if (en && en.sets[i]) Object.assign(en.sets[i], patch);
        }),

      addSet: (exId) =>
        update((s) => {
          const en = s.session?.entries.find((e) => e.exerciseId === exId);
          if (en) {
            const last = en.sets[en.sets.length - 1];
            en.sets.push({ weight: last?.weight ?? "", reps: last?.reps ?? "", done: false });
          }
        }),

      removeSet: (exId, i) =>
        update((s) => {
          const en = s.session?.entries.find((e) => e.exerciseId === exId);
          if (en && en.sets.length > 1) en.sets.splice(i, 1);
        }),

      finishSession: () => {
        let logged = 0;
        update((s) => {
          if (!s.session) return;
          const date = new Date().toISOString();
          s.session.entries.forEach((en) => {
            const done = en.sets.filter((st) => st.done && (st.weight !== "" || st.reps !== ""));
            if (done.length === 0) return;
            logged += 1;
            s.logs.push({
              id: uid(),
              date,
              planName: s.session.planName,
              dayName: s.session.dayName,
              exerciseId: en.exerciseId,
              exerciseName: en.name,
              sets: done.map((st) => ({ weight: Number(st.weight) || 0, reps: Number(st.reps) || 0 })),
            });
          });
          s.session = null;
        });
        return logged;
      },

      cancelSession: () => update((s) => { s.session = null; }),

      deleteLog: (logId) => update((s) => { s.logs = s.logs.filter((l) => l.id !== logId); }),

      importBackup: (payload) =>
        update((s) => {
          if (Array.isArray(payload.plans)) s.plans = payload.plans;
          if (Array.isArray(payload.logs)) s.logs = payload.logs;
          if (payload.settings) s.settings = { ...s.settings, ...payload.settings };
          s.activePlanId = payload.activePlanId || s.plans[0]?.id || null;
          s.activeWeekId =
            payload.activeWeekId ||
            s.plans.find((p) => p.id === s.activePlanId)?.weeks[0]?.id ||
            null;
          s.schemaVersion = CURRENT_SCHEMA;
          s.session = null;
        }),
    };
  }, [update]);

  const value = {
    ready,
    state,
    settings: state?.settings,
    plans: state?.plans || [],
    logs: state?.logs || [],
    session: state?.session || null,
    activePlan: state ? state.plans.find((p) => p.id === state.activePlanId) : null,
    activeWeekId: state?.activeWeekId,
    exportBackup: () => (state ? serializeBackup(state) : "{}"),
    ...actions,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
