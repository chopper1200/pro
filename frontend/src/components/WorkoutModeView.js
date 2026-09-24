import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/store/StoreContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Play, Check, Plus, Minus, ChevronLeft, ChevronRight, Timer, X,
  ExternalLink, Info, Trash2, Flag,
} from "lucide-react";

function vibrate(pattern, enabled) {
  if (enabled && navigator.vibrate) navigator.vibrate(pattern);
}

function fmt(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function WorkoutModeView() {
  const {
    session, settings, updateSet, addSet, removeSet, setSessionIndex,
    finishSession, cancelSession,
  } = useStore();
  const navigate = useNavigate();

  const [rest, setRest] = useState({ total: 0, remaining: null });
  const intervalRef = useRef(null);

  useEffect(() => {
    if (rest.remaining === null) return;
    intervalRef.current = setInterval(() => {
      setRest((r) => {
        if (r.remaining <= 1) {
          clearInterval(intervalRef.current);
          vibrate([120, 60, 120, 60, 200], settings.vibration);
          toast.success("Recupero finito — vai con la prossima serie!");
          return { ...r, remaining: null };
        }
        return { ...r, remaining: r.remaining - 1 };
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [rest.remaining !== null]); // eslint-disable-line

  if (!session) {
    return (
      <div className="animate-fade-up flex flex-col items-center text-center gap-4 pt-16">
        <Play className="w-12 h-12 text-primary" />
        <h1 className="font-heading text-3xl font-black uppercase">Nessun allenamento attivo</h1>
        <p className="text-muted-foreground text-sm max-w-xs">
          Scegli un giorno dalla schermata Oggi per iniziare a registrare le serie.
        </p>
        <Button data-testid="go-home-button" onClick={() => navigate("/")} className="h-12 rounded-xl">
          Vai a Oggi
        </Button>
      </div>
    );
  }

  const idx = Math.min(session.currentIndex, session.entries.length - 1);
  const ex = session.entries[idx];
  const totalSets = session.entries.reduce((a, e) => a + e.sets.length, 0);
  const doneSets = session.entries.reduce((a, e) => a + e.sets.filter((s) => s.done).length, 0);
  const progress = totalSets ? Math.round((doneSets / totalSets) * 100) : 0;

  const startRest = (sec) => setRest({ total: sec, remaining: sec });

  const toggleDone = (i) => {
    const nextDone = !ex.sets[i].done;
    updateSet(ex.exerciseId, i, { done: nextDone });
    if (nextDone) {
      vibrate([100, 50, 100], settings.vibration);
      startRest(ex.rest || settings.defaultRest);
    }
  };

  const step = (i, field, delta) => {
    const cur = Number(ex.sets[i][field]) || 0;
    const val = Math.max(0, +(cur + delta).toFixed(2));
    updateSet(ex.exerciseId, i, { [field]: String(val) });
  };

  const onFinish = () => {
    const n = finishSession();
    toast.success(n > 0 ? `Sessione salvata (${n} esercizi registrati)` : "Sessione chiusa");
    navigate("/");
  };

  const onCancel = () => {
    if (window.confirm("Annullare la sessione? I dati non salvati andranno persi.")) {
      cancelSession();
      navigate("/");
    }
  };

  return (
    <div className="animate-fade-up space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{session.dayName}</p>
          <p className="text-sm text-muted-foreground">
            Esercizio {idx + 1} di {session.entries.length}
          </p>
        </div>
        <Button
          variant="ghost" size="icon"
          onClick={onCancel} data-testid="cancel-session-button"
          className="text-muted-foreground hover:text-destructive w-11 h-11"
          aria-label="Annulla sessione"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} data-testid="workout-progress" />
      </div>

      {ex && (
        <Card className="overflow-hidden" data-testid="exercise-focus-card">
          {ex.image ? (
            <img src={ex.image} alt={ex.name} className="w-full h-40 object-cover" />
          ) : null}
          <div className="p-4 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="font-heading text-2xl font-black uppercase leading-tight">{ex.name}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Target: <span className="font-semibold text-foreground">{ex.target}</span> rip · recupero {ex.rest}s
                </p>
              </div>
              {ex.guideLink && (
                <a
                  href={ex.guideLink} target="_blank" rel="noopener noreferrer"
                  data-testid="exercise-guide-link"
                  className="shrink-0 flex items-center gap-1 text-xs font-semibold text-primary h-11 px-2"
                >
                  Come si fa <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            {ex.note && (
              <div className="flex gap-2 text-sm bg-secondary/60 rounded-lg p-3">
                <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{ex.note}</span>
              </div>
            )}

            <div className="space-y-2">
              {ex.sets.map((set, i) => (
                <div
                  key={i}
                  data-testid={`set-row-${i}`}
                  className={`flex items-center gap-2 rounded-xl p-2 border transition-colors ${
                    set.done ? "border-primary/60 bg-primary/5" : "border-border"
                  }`}
                >
                  <span className="w-6 text-center font-stat font-bold text-muted-foreground">{i + 1}</span>

                  <Stepper
                    label={settings.unit} value={set.weight}
                    onDec={() => step(i, "weight", -2.5)} onInc={() => step(i, "weight", 2.5)}
                    onChange={(v) => updateSet(ex.exerciseId, i, { weight: v })}
                    testid={`weight-input-field-${i}`}
                  />
                  <Stepper
                    label="rip" value={set.reps}
                    onDec={() => step(i, "reps", -1)} onInc={() => step(i, "reps", 1)}
                    onChange={(v) => updateSet(ex.exerciseId, i, { reps: v })}
                    testid={`reps-input-field-${i}`}
                  />

                  <button
                    onClick={() => toggleDone(i)}
                    data-testid={`set-complete-checkbox-${i}`}
                    aria-label={`Completa serie ${i + 1}`}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      set.done ? "bg-primary text-primary-foreground animate-pulse-ring" : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    <Check className="w-6 h-6" />
                  </button>
                  {ex.sets.length > 1 && (
                    <button
                      onClick={() => removeSet(ex.exerciseId, i)}
                      className="w-8 h-12 flex items-center justify-center text-muted-foreground hover:text-destructive"
                      aria-label="Rimuovi serie"
                      data-testid={`remove-set-${i}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <Button
              variant="outline" onClick={() => addSet(ex.exerciseId)}
              data-testid="add-set-button" className="w-full h-11 rounded-xl border-dashed"
            >
              <Plus className="w-4 h-4 mr-1" /> Aggiungi serie
            </Button>
          </div>
        </Card>
      )}

      <div className="flex items-center gap-2">
        <Button
          variant="secondary" className="flex-1 h-12 rounded-xl"
          disabled={idx === 0} onClick={() => setSessionIndex(idx - 1)}
          data-testid="prev-exercise-button"
        >
          <ChevronLeft className="w-5 h-5" /> Prec.
        </Button>
        {idx < session.entries.length - 1 ? (
          <Button
            className="flex-1 h-12 rounded-xl" onClick={() => setSessionIndex(idx + 1)}
            data-testid="next-exercise-button"
          >
            Succ. <ChevronRight className="w-5 h-5" />
          </Button>
        ) : (
          <Button
            className="flex-1 h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white"
            onClick={onFinish} data-testid="finish-session-button"
          >
            <Flag className="w-5 h-5 mr-1" /> Termina
          </Button>
        )}
      </div>

      <Button
        variant="ghost" className="w-full text-muted-foreground"
        onClick={onFinish} data-testid="finish-session-secondary"
      >
        Termina e salva la sessione
      </Button>

      {rest.remaining !== null && (
        <div className="fixed bottom-24 left-0 right-0 z-40 max-w-md sm:max-w-xl mx-auto px-4" data-testid="rest-timer-bar">
          <Card className="frost-border p-3 flex items-center gap-3 bg-background/95 backdrop-blur-xl">
            <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <Timer className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Recupero</p>
              <p className="font-stat text-3xl font-black leading-none text-primary" data-testid="rest-timer-display">
                {fmt(rest.remaining)}
              </p>
            </div>
            <Button
              variant="secondary" className="h-11 rounded-lg"
              onClick={() => setRest((r) => ({ ...r, remaining: r.remaining + 30 }))}
              data-testid="rest-timer-add-30s"
            >
              +30s
            </Button>
            <Button
              className="h-11 rounded-lg"
              onClick={() => setRest((r) => ({ ...r, remaining: null }))}
              data-testid="rest-timer-skip"
            >
              Salta
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}

function Stepper({ label, value, onDec, onInc, onChange, testid }) {
  return (
    <div className="flex-1 flex items-center gap-1 bg-secondary/50 rounded-lg p-1">
      <button
        onClick={onDec} aria-label={`meno ${label}`}
        className="w-9 h-9 rounded-md bg-background flex items-center justify-center text-foreground/70 active:scale-95"
      >
        <Minus className="w-4 h-4" />
      </button>
      <div className="flex-1 flex flex-col items-center min-w-0">
        <Input
          value={value} inputMode="decimal" data-testid={testid}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 text-center font-stat text-lg font-bold border-0 bg-transparent p-0 focus-visible:ring-0"
        />
        <span className="text-[9px] uppercase tracking-wide text-muted-foreground -mt-0.5">{label}</span>
      </div>
      <button
        onClick={onInc} aria-label={`più ${label}`}
        className="w-9 h-9 rounded-md bg-background flex items-center justify-center text-foreground/70 active:scale-95"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
