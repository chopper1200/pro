import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/store/StoreContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Dumbbell, Flame, Layers, ChevronRight, CalendarDays } from "lucide-react";

function startOfWeek() {
  const d = new Date();
  const day = (d.getDay() + 6) % 7; // monday = 0
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d;
}

export default function HomeView() {
  const { activePlan, activeWeekId, setActiveWeek, logs, startSession, session } = useStore();
  const navigate = useNavigate();
  const [pickWeek, setPickWeek] = useState(activeWeekId);

  const week =
    activePlan?.weeks.find((w) => w.id === (pickWeek || activeWeekId)) || activePlan?.weeks[0];

  const wkStart = startOfWeek();
  const sessionsThisWeek = new Set(
    logs.filter((l) => new Date(l.date) >= wkStart).map((l) => l.date.slice(0, 10))
  ).size;
  const totalVolume = logs.reduce(
    (sum, l) => sum + l.sets.reduce((a, s) => a + s.weight * s.reps, 0),
    0
  );

  const begin = (dayId) => {
    startSession({ planId: activePlan.id, weekId: week.id, dayId });
    navigate("/workout");
  };

  if (!activePlan) {
    return (
      <div className="animate-fade-up flex flex-col items-center text-center gap-4 pt-16">
        <Dumbbell className="w-12 h-12 text-primary" />
        <h1 className="font-heading text-3xl font-black uppercase">Nessun piano attivo</h1>
        <p className="text-muted-foreground text-sm max-w-xs">
          Crea il tuo primo piano di allenamento per iniziare.
        </p>
        <Button data-testid="go-create-plan-button" onClick={() => navigate("/editor")} className="h-12 rounded-xl">
          Crea un piano
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-fade-up space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Piano attivo</p>
        <h1 className="font-heading text-4xl font-black uppercase leading-none mt-1" data-testid="active-plan-name">
          {activePlan.name}
        </h1>
      </div>

      {session && (
        <Card
          className="p-4 flex items-center justify-between frost-border cursor-pointer"
          data-testid="resume-session-card"
          onClick={() => navigate("/workout")}
        >
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">In corso</p>
              <p className="font-semibold">{session.dayName}</p>
            </div>
          </div>
          <Button size="sm" className="rounded-lg h-10">Riprendi</Button>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Flame className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wide">Sessioni sett.</span>
          </div>
          <p className="font-stat text-4xl font-black mt-1" data-testid="stat-weekly-sessions">
            {sessionsThisWeek}
          </p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Layers className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wide">Volume tot.</span>
          </div>
          <p className="font-stat text-4xl font-black mt-1" data-testid="stat-total-volume">
            {Math.round(totalVolume).toLocaleString("it-IT")}
            <span className="text-base font-bold text-muted-foreground"> kg</span>
          </p>
        </Card>
      </div>

      {activePlan.weeks.length > 1 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
          {activePlan.weeks.map((w) => (
            <button
              key={w.id}
              data-testid={`week-pill-${w.id}`}
              onClick={() => {
                setPickWeek(w.id);
                setActiveWeek(w.id);
              }}
              className={`shrink-0 h-10 px-4 rounded-full text-sm font-semibold border transition-colors ${
                w.id === week.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground"
              }`}
            >
              {w.name}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <CalendarDays className="w-4 h-4" />
          <span className="text-xs uppercase tracking-[0.2em] font-bold">{week?.name}</span>
        </div>

        {week?.days.length === 0 && (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            Nessun giorno in questa settimana.{" "}
            <button className="text-primary font-semibold" onClick={() => navigate("/editor")}>
              Aggiungi nell'editor
            </button>
          </Card>
        )}

        {week?.days.map((day) => (
          <Card
            key={day.id}
            className="p-4 flex items-center justify-between gap-3 hover:frost-border transition-shadow"
            data-testid={`home-day-card-${day.id}`}
          >
            <div className="min-w-0" onClick={() => begin(day.id)} role="button">
              <p className="font-heading text-xl font-bold uppercase truncate">{day.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="rounded-md">
                  {day.exercises.length} esercizi
                </Badge>
                {day.exercises[0] && (
                  <span className="text-xs text-muted-foreground truncate">
                    {day.exercises.slice(0, 2).map((e) => e.name).join(" · ")}
                  </span>
                )}
              </div>
            </div>
            <Button
              size="icon"
              className="w-12 h-12 rounded-full shrink-0"
              disabled={day.exercises.length === 0}
              onClick={() => begin(day.id)}
              data-testid={`start-day-button-${day.id}`}
              aria-label={`Inizia ${day.name}`}
            >
              <Play className="w-5 h-5 fill-current" />
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
