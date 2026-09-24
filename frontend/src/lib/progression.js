// Progressive overload suggestions + session summary / PR detection.

export function epley(weight, reps) {
  return Math.round((Number(weight) || 0) * (1 + (Number(reps) || 0) / 30));
}

export function parseRepTarget(reps) {
  const s = String(reps || "").trim().toLowerCase();
  const range = s.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (range) return { min: Number(range[1]), max: Number(range[2]) };
  const single = s.match(/^(\d+)/);
  if (single) return { min: Number(single[1]), max: Number(single[1]) };
  return { min: null, max: null }; // e.g. "max" / "AMRAP"
}

export const weightStep = (unit) => (unit === "lbs" ? 5 : 2.5);

const round = (n) => Math.round(n * 100) / 100;

// Given the last completed log for an exercise, propose the next target.
// Rule: if a set already hit the top of the rep range, add weight and reset
// reps to the bottom of the range. Otherwise keep the weight and add 1 rep.
export function suggestFromLastLog(lastLog, exercise, unit) {
  if (!lastLog || !lastLog.sets?.length) return null;
  const { min, max } = parseRepTarget(exercise.reps);
  const step = weightStep(unit);
  let raisedWeight = false;

  const sets = lastLog.sets.map((st) => {
    const w = Number(st.weight) || 0;
    const r = Number(st.reps) || 0;
    if (max && r >= max && w > 0) {
      raisedWeight = true;
      return { weight: round(w + step), reps: min || max };
    }
    const nextReps = max ? Math.min(r + 1, max) : r + 1;
    return { weight: w, reps: nextReps };
  });

  const label = raisedWeight ? `+${step}${unit} sul peso` : "+1 ripetizione";
  return { sets, label, raisedWeight };
}

export function buildSessionSummary(prevLogs, session, unit) {
  const exercises = [];
  let totalVolume = 0;
  let totalSets = 0;

  session.entries.forEach((en) => {
    const done = en.sets
      .filter((st) => st.done && (st.weight !== "" || st.reps !== ""))
      .map((st) => ({ weight: Number(st.weight) || 0, reps: Number(st.reps) || 0 }));
    if (done.length === 0) return;

    const volume = done.reduce((a, s) => a + s.weight * s.reps, 0);
    const maxW = Math.max(0, ...done.map((s) => s.weight));
    const best1rm = Math.max(0, ...done.map((s) => epley(s.weight, s.reps)));

    const prev = prevLogs.filter((l) => l.exerciseName === en.name);
    const prevMaxW = Math.max(0, ...prev.flatMap((l) => l.sets.map((s) => s.weight)));
    const prevBest1rm = Math.max(0, ...prev.flatMap((l) => l.sets.map((s) => epley(s.weight, s.reps))));

    totalVolume += volume;
    totalSets += done.length;

    exercises.push({
      name: en.name,
      volume: Math.round(volume),
      sets: done.length,
      maxW,
      best1rm,
      prWeight: maxW > 0 && (prev.length === 0 ? true : maxW > prevMaxW),
      pr1rm: best1rm > 0 && prev.length > 0 && best1rm > prevBest1rm,
    });
  });

  const prCount = exercises.filter((e) => e.prWeight || e.pr1rm).length;
  return { exercises, totalVolume: Math.round(totalVolume), totalSets, count: exercises.length, prCount, unit };
}
