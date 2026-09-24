import { useState, useEffect } from "react";
import { Reorder, useDragControls } from "framer-motion";
import { useStore } from "@/store/StoreContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Accordion, AccordionItem, AccordionTrigger, AccordionContent,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import {
  Plus, Copy, Trash2, Star, Pencil, GripVertical, Dumbbell, CalendarPlus, Check,
} from "lucide-react";

const EMPTY_EX = { name: "", sets: 3, reps: "10-12", rest: 90, note: "", image: "", guideLink: "" };

export default function PlanEditorView() {
  const store = useStore();
  const { plans, activePlan, setActivePlan } = store;
  const [openPlanId, setOpenPlanId] = useState(activePlan?.id || plans[0]?.id || null);
  const [newPlanName, setNewPlanName] = useState("");
  const [editing, setEditing] = useState(null); // {planId, weekId, dayId, exId?, form}

  const openExDialog = (planId, weekId, dayId, ex) =>
    setEditing({
      planId, weekId, dayId,
      exId: ex?.id || null,
      form: ex ? { ...ex } : { ...EMPTY_EX },
    });

  const saveEx = () => {
    const { planId, weekId, dayId, exId, form } = editing;
    if (!form.name.trim()) {
      toast.error("Il nome dell'esercizio è obbligatorio");
      return;
    }
    const payload = {
      name: form.name.trim(),
      sets: Math.max(1, parseInt(form.sets, 10) || 1),
      reps: String(form.reps || "").trim(),
      rest: Math.max(0, parseInt(form.rest, 10) || 0),
      note: form.note || "",
      image: form.image || "",
      guideLink: form.guideLink || "",
    };
    if (exId) store.updateExercise(planId, weekId, dayId, exId, payload);
    else store.addExercise(planId, weekId, dayId, payload);
    setEditing(null);
    toast.success("Esercizio salvato");
  };

  const createPlan = () => {
    const id = store.createPlan(newPlanName.trim() || "Nuovo piano");
    setNewPlanName("");
    setOpenPlanId(id);
    toast.success("Piano creato");
  };

  return (
    <div className="animate-fade-up space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Editor</p>
        <h1 className="font-heading text-4xl font-black uppercase leading-none mt-1">Piani</h1>
      </div>

      <Card className="p-3 flex gap-2">
        <Input
          value={newPlanName} onChange={(e) => setNewPlanName(e.target.value)}
          placeholder="Nome nuovo piano" data-testid="new-plan-name-input"
          className="h-12 rounded-xl"
          onKeyDown={(e) => e.key === "Enter" && createPlan()}
        />
        <Button onClick={createPlan} data-testid="create-plan-button" className="h-12 rounded-xl shrink-0">
          <Plus className="w-5 h-5 mr-1" /> Crea
        </Button>
      </Card>

      <div className="space-y-3">
        {plans.map((plan) => {
          const isActive = activePlan?.id === plan.id;
          const isOpen = openPlanId === plan.id;
          return (
            <Card key={plan.id} className={isActive ? "frost-border" : ""} data-testid={`plan-card-${plan.id}`}>
              <div className="p-4 flex items-center justify-between gap-2">
                <button
                  className="flex-1 text-left min-w-0"
                  onClick={() => setOpenPlanId(isOpen ? null : plan.id)}
                >
                  <div className="flex items-center gap-2">
                    <h2 className="font-heading text-xl font-bold uppercase truncate">{plan.name}</h2>
                    {isActive && <Badge className="rounded-md">Attivo</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {plan.weeks.length} settimane · {plan.weeks.reduce((a, w) => a + w.days.length, 0)} giorni
                  </p>
                </button>
                <div className="flex items-center gap-1 shrink-0">
                  {!isActive && (
                    <IconBtn label="Rendi attivo" testid={`activate-plan-${plan.id}`} onClick={() => { setActivePlan(plan.id); toast.success("Piano attivo aggiornato"); }}>
                      <Star className="w-4 h-4" />
                    </IconBtn>
                  )}
                  <IconBtn label="Rinomina" testid={`rename-plan-${plan.id}`} onClick={() => {
                    const n = window.prompt("Nome piano", plan.name);
                    if (n && n.trim()) store.renamePlan(plan.id, n.trim());
                  }}>
                    <Pencil className="w-4 h-4" />
                  </IconBtn>
                  <IconBtn label="Duplica" testid={`duplicate-plan-${plan.id}`} onClick={() => { store.duplicatePlan(plan.id); toast.success("Piano duplicato"); }}>
                    <Copy className="w-4 h-4" />
                  </IconBtn>
                  <IconBtn label="Elimina" danger testid={`delete-plan-${plan.id}`} onClick={() => {
                    if (window.confirm(`Eliminare "${plan.name}"?`)) { store.deletePlan(plan.id); toast.success("Piano eliminato"); }
                  }}>
                    <Trash2 className="w-4 h-4" />
                  </IconBtn>
                </div>
              </div>

              {isOpen && (
                <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                  <Accordion type="multiple" className="space-y-2">
                    {plan.weeks.map((week) => (
                      <AccordionItem key={week.id} value={week.id} className="border rounded-xl px-3">
                        <div className="flex items-center justify-between">
                          <AccordionTrigger className="flex-1 hover:no-underline py-3">
                            <span className="font-semibold">{week.name}</span>
                            <Badge variant="secondary" className="ml-2 rounded-md">{week.days.length}g</Badge>
                          </AccordionTrigger>
                          <div className="flex gap-1">
                            <IconBtn label="Rinomina settimana" onClick={() => {
                              const n = window.prompt("Nome settimana", week.name);
                              if (n && n.trim()) store.renameWeek(plan.id, week.id, n.trim());
                            }}><Pencil className="w-3.5 h-3.5" /></IconBtn>
                            <IconBtn label="Duplica settimana" onClick={() => store.duplicateWeek(plan.id, week.id)}><Copy className="w-3.5 h-3.5" /></IconBtn>
                            <IconBtn label="Elimina settimana" danger onClick={() => window.confirm("Eliminare la settimana?") && store.deleteWeek(plan.id, week.id)}><Trash2 className="w-3.5 h-3.5" /></IconBtn>
                          </div>
                        </div>
                        <AccordionContent className="space-y-3 pb-3">
                          {week.days.map((day) => (
                            <DayEditor
                              key={day.id}
                              store={store}
                              plan={plan}
                              week={week}
                              day={day}
                              openExDialog={openExDialog}
                            />
                          ))}

                          <Button variant="secondary" className="w-full h-10 rounded-lg" onClick={() => store.addDay(plan.id, week.id)} data-testid={`add-day-${week.id}`}>
                            <Plus className="w-4 h-4 mr-1" /> Aggiungi giorno
                          </Button>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>

                  <Button variant="outline" className="w-full h-11 rounded-xl border-dashed" onClick={() => store.addWeek(plan.id)} data-testid={`add-week-${plan.id}`}>
                    <CalendarPlus className="w-4 h-4 mr-1" /> Aggiungi settimana
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-md rounded-2xl" data-testid="exercise-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl font-black uppercase">
              {editing?.exId ? "Modifica esercizio" : "Nuovo esercizio"}
            </DialogTitle>
            <DialogDescription>
              Compila i campi dell{"\u2019"}esercizio. Solo il nome è obbligatorio.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              <Field label="Nome *">
                <Input value={editing.form.name} data-testid="ex-name-input" onChange={(e) => setEditing((s) => ({ ...s, form: { ...s.form, name: e.target.value } }))} className="h-11 rounded-lg" placeholder="Es. Panca piana" />
              </Field>
              <div className="grid grid-cols-3 gap-2">
                <Field label="Serie">
                  <Input type="number" value={editing.form.sets} data-testid="ex-sets-input" onChange={(e) => setEditing((s) => ({ ...s, form: { ...s.form, sets: e.target.value } }))} className="h-11 rounded-lg" />
                </Field>
                <Field label="Rip/Tempo">
                  <Input value={editing.form.reps} data-testid="ex-reps-input" onChange={(e) => setEditing((s) => ({ ...s, form: { ...s.form, reps: e.target.value } }))} className="h-11 rounded-lg" placeholder="8-10" />
                </Field>
                <Field label="Recupero (s)">
                  <Input type="number" value={editing.form.rest} data-testid="ex-rest-input" onChange={(e) => setEditing((s) => ({ ...s, form: { ...s.form, rest: e.target.value } }))} className="h-11 rounded-lg" />
                </Field>
              </div>
              <Field label="Note tecnica">
                <Textarea value={editing.form.note} data-testid="ex-note-input" onChange={(e) => setEditing((s) => ({ ...s, form: { ...s.form, note: e.target.value } }))} className="rounded-lg min-h-[70px]" placeholder="Cue tecnici, respirazione…" />
              </Field>
              <Field label="URL immagine">
                <Input value={editing.form.image} data-testid="ex-image-input" onChange={(e) => setEditing((s) => ({ ...s, form: { ...s.form, image: e.target.value } }))} className="h-11 rounded-lg" placeholder="https://…" />
              </Field>
              <Field label="Link 'come si fa'">
                <Input value={editing.form.guideLink} data-testid="ex-guide-input" onChange={(e) => setEditing((s) => ({ ...s, form: { ...s.form, guideLink: e.target.value } }))} className="h-11 rounded-lg" placeholder="https://youtube.com/…" />
              </Field>
            </div>
          )}
          <DialogFooter>
            <Button onClick={saveEx} data-testid="save-exercise-button" className="w-full h-12 rounded-xl">
              <Check className="w-5 h-5 mr-1" /> Salva esercizio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DayEditor({ store, plan, week, day, openExDialog }) {
  const [items, setItems] = useState(day.exercises);
  const snapshot = JSON.stringify(day.exercises.map((e) => e.id + e.name + e.sets + e.reps + e.rest));

  useEffect(() => {
    setItems(day.exercises);
  }, [snapshot]); // eslint-disable-line react-hooks/exhaustive-deps

  const onReorder = (next) => {
    setItems(next);
    store.reorderExercises(plan.id, week.id, day.id, next.map((e) => e.id));
  };

  return (
    <div className="rounded-lg bg-secondary/40 p-3 space-y-2" data-testid={`day-block-${day.id}`}>
      <div className="flex items-center justify-between">
        <p className="font-heading text-lg font-bold uppercase">{day.name}</p>
        <div className="flex gap-1">
          <IconBtn label="Rinomina giorno" onClick={() => {
            const n = window.prompt("Nome giorno", day.name);
            if (n && n.trim()) store.renameDay(plan.id, week.id, day.id, n.trim());
          }}><Pencil className="w-3.5 h-3.5" /></IconBtn>
          <IconBtn label="Elimina giorno" danger onClick={() => window.confirm("Eliminare il giorno?") && store.deleteDay(plan.id, week.id, day.id)}><Trash2 className="w-3.5 h-3.5" /></IconBtn>
        </div>
      </div>

      <Reorder.Group as="div" axis="y" values={items} onReorder={onReorder} className="space-y-2">
        {items.map((ex) => (
          <ExerciseRow
            key={ex.id}
            ex={ex}
            onEdit={() => openExDialog(plan.id, week.id, day.id, ex)}
            onDelete={() => store.deleteExercise(plan.id, week.id, day.id, ex.id)}
          />
        ))}
      </Reorder.Group>

      <Button variant="outline" className="w-full h-10 rounded-lg border-dashed" onClick={() => openExDialog(plan.id, week.id, day.id, null)} data-testid={`add-exercise-${day.id}`}>
        <Dumbbell className="w-4 h-4 mr-1" /> Aggiungi esercizio
      </Button>
    </div>
  );
}

function ExerciseRow({ ex, onEdit, onDelete }) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      as="div"
      value={ex}
      dragListener={false}
      dragControls={controls}
      className="flex items-center gap-2 bg-background rounded-lg p-2 touch-none"
      data-testid={`exercise-row-${ex.id}`}
    >
      <button
        onPointerDown={(e) => controls.start(e)}
        className="w-8 h-9 flex items-center justify-center text-muted-foreground cursor-grab active:cursor-grabbing touch-none"
        aria-label="Trascina per riordinare"
        data-testid={`drag-handle-${ex.id}`}
      >
        <GripVertical className="w-5 h-5" />
      </button>
      <button className="flex-1 min-w-0 text-left" onClick={onEdit}>
        <p className="font-semibold truncate">{ex.name}</p>
        <p className="text-xs text-muted-foreground">{ex.sets}×{ex.reps} · rec {ex.rest}s</p>
      </button>
      <IconBtn label="Modifica esercizio" testid={`edit-exercise-${ex.id}`} onClick={onEdit}><Pencil className="w-4 h-4" /></IconBtn>
      <IconBtn label="Elimina esercizio" danger testid={`delete-exercise-${ex.id}`} onClick={onDelete}><Trash2 className="w-4 h-4" /></IconBtn>
    </Reorder.Item>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function IconBtn({ children, onClick, label, danger, testid }) {
  return (
    <button
      onClick={onClick} aria-label={label} title={label} data-testid={testid}
      className={`w-9 h-9 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors ${
        danger ? "text-muted-foreground hover:text-destructive" : "text-muted-foreground hover:text-primary"
      }`}
    >
      {children}
    </button>
  );
}
