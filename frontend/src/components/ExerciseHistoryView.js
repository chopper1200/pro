import { useMemo, useState } from "react";
import { useStore } from "@/store/StoreContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { Search, ChevronLeft, TrendingUp, Trash2, History } from "lucide-react";

function epley(w, r) {
  return Math.round(w * (1 + r / 30));
}

export default function ExerciseHistoryView() {
  const { logs, settings, deleteLog } = useStore();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);

  const names = useMemo(() => {
    const map = new Map();
    logs.forEach((l) => {
      const cur = map.get(l.exerciseName) || { count: 0, last: l.date };
      cur.count += 1;
      if (new Date(l.date) > new Date(cur.last)) cur.last = l.date;
      map.set(l.exerciseName, cur);
    });
    return [...map.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .filter((x) => x.name.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => new Date(b.last) - new Date(a.last));
  }, [logs, query]);

  const detail = useMemo(() => {
    if (!selected) return null;
    const sessions = logs
      .filter((l) => l.exerciseName === selected)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    const chart = sessions.map((s) => {
      const maxW = Math.max(...s.sets.map((x) => x.weight), 0);
      const best1rm = Math.max(...s.sets.map((x) => epley(x.weight, x.reps)), 0);
      return {
        date: new Date(s.date).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" }),
        peso: maxW,
        stima1rm: best1rm,
      };
    });
    return { sessions: sessions.slice().reverse(), chart };
  }, [selected, logs]);

  if (selected && detail) {
    return (
      <div className="animate-fade-up space-y-4">
        <button onClick={() => setSelected(null)} className="flex items-center gap-1 text-sm text-primary font-semibold h-10" data-testid="history-back-button">
          <ChevronLeft className="w-4 h-4" /> Tutti gli esercizi
        </button>
        <h1 className="font-heading text-3xl font-black uppercase leading-none">{selected}</h1>

        {detail.chart.length >= 2 ? (
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-3">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wide font-bold">Progressione</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={detail.chart} margin={{ left: -20, right: 8, top: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, color: "hsl(var(--foreground))" }}
                />
                <Line type="monotone" dataKey="peso" name={`Peso max (${settings.unit})`} stroke="hsl(var(--chart-1))" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="stima1rm" name="Stima 1RM" stroke="hsl(var(--chart-2))" strokeWidth={2} strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        ) : (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            Registra almeno 2 sessioni per vedere il grafico di progressione.
          </Card>
        )}

        <div className="space-y-2">
          {detail.sessions.map((s) => (
            <Card key={s.id} className="p-3" data-testid={`history-log-${s.id}`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold">
                  {new Date(s.date).toLocaleDateString("it-IT", { weekday: "short", day: "2-digit", month: "short" })}
                </p>
                <button onClick={() => deleteLog(s.id)} className="text-muted-foreground hover:text-destructive w-8 h-8 flex items-center justify-center" aria-label="Elimina log" data-testid={`delete-log-${s.id}`}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {s.sets.map((set, i) => (
                  <Badge key={i} variant="secondary" className="rounded-md font-stat">
                    {set.weight}{settings.unit}×{set.reps}
                  </Badge>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-up space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Progressi</p>
        <h1 className="font-heading text-4xl font-black uppercase leading-none mt-1">Storico</h1>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca esercizio" data-testid="history-search-input"
          className="h-12 rounded-xl pl-9"
        />
      </div>

      {logs.length === 0 ? (
        <Card className="p-8 text-center space-y-2">
          <History className="w-10 h-10 mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Nessuna sessione registrata. Completa un allenamento per vedere qui i tuoi progressi.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {names.map((n) => (
            <Card
              key={n.name}
              className="p-4 flex items-center justify-between cursor-pointer hover:frost-border transition-shadow"
              onClick={() => setSelected(n.name)}
              data-testid={`history-exercise-${n.name.replace(/\s+/g, "-").toLowerCase()}`}
            >
              <div className="min-w-0">
                <p className="font-semibold truncate">{n.name}</p>
                <p className="text-xs text-muted-foreground">
                  {n.count} sessioni · ultima {new Date(n.last).toLocaleDateString("it-IT")}
                </p>
              </div>
              <TrendingUp className="w-5 h-5 text-primary shrink-0" />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
