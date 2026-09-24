import { useEffect, useRef, useState } from "react";
import { useStore } from "@/store/StoreContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { estimateUsage } from "@/lib/db";
import { toast } from "sonner";
import {
  Download, Upload, Sun, Moon, Vibrate, Timer, Weight, Database, ShieldAlert,
} from "lucide-react";

export default function SettingsView() {
  const { settings, setSetting, exportBackup, importBackup } = useStore();
  const fileRef = useRef(null);
  const [usage, setUsage] = useState(null);

  useEffect(() => {
    estimateUsage().then(setUsage);
  }, []);

  const doExport = () => {
    const data = exportBackup();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inverno-fit-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("Backup esportato");
  };

  const doImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const payload = JSON.parse(reader.result);
        if (!payload.plans && !payload.logs) throw new Error("formato non valido");
        if (window.confirm("Importare il backup? Sostituirà i dati attuali.")) {
          importBackup(payload);
          toast.success("Backup importato");
        }
      } catch (err) {
        toast.error("File non valido: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const mb = (b) => (b ? (b / 1024 / 1024).toFixed(1) : "0");

  return (
    <div className="animate-fade-up space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Configurazione</p>
        <h1 className="font-heading text-4xl font-black uppercase leading-none mt-1">Opzioni</h1>
      </div>

      <Card className="p-4 space-y-4">
        <Row icon={settings.theme === "dark" ? Moon : Sun} title="Tema" desc="Aspetto dell'app">
          <div className="flex rounded-lg bg-secondary p-1">
            {["dark", "light"].map((t) => (
              <button
                key={t}
                data-testid={`theme-option-${t}`}
                onClick={() => setSetting("theme", t)}
                className={`px-3 h-9 rounded-md text-sm font-semibold capitalize transition-colors ${
                  settings.theme === t ? "bg-background text-primary shadow" : "text-muted-foreground"
                }`}
              >
                {t === "dark" ? "Inverno" : "Chiaro"}
              </button>
            ))}
          </div>
        </Row>

        <Row icon={Vibrate} title="Vibrazione" desc="Feedback a fine recupero e serie">
          <Switch
            checked={settings.vibration}
            onCheckedChange={(v) => setSetting("vibration", v)}
            data-testid="vibration-switch"
          />
        </Row>

        <Row icon={Weight} title="Unità peso" desc="Mostrata nei registri">
          <div className="flex rounded-lg bg-secondary p-1">
            {["kg", "lbs"].map((u) => (
              <button
                key={u}
                data-testid={`unit-option-${u}`}
                onClick={() => setSetting("unit", u)}
                className={`px-3 h-9 rounded-md text-sm font-semibold uppercase transition-colors ${
                  settings.unit === u ? "bg-background text-primary shadow" : "text-muted-foreground"
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </Row>

        <div className="pt-1">
          <div className="flex items-center gap-3 mb-3">
            <Timer className="w-5 h-5 text-primary" />
            <div className="flex-1">
              <p className="font-semibold">Recupero di default</p>
              <p className="text-xs text-muted-foreground">Usato quando l'esercizio non ne ha uno</p>
            </div>
            <span className="font-stat text-xl font-bold text-primary" data-testid="default-rest-value">
              {settings.defaultRest}s
            </span>
          </div>
          <Slider
            value={[settings.defaultRest]}
            min={10} max={300} step={5}
            onValueChange={([v]) => setSetting("defaultRest", v)}
            data-testid="default-rest-slider"
          />
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-primary" />
          <p className="font-heading text-lg font-bold uppercase">Backup dati</p>
        </div>
        <p className="text-sm text-muted-foreground">
          I dati vivono solo su questo dispositivo (IndexedDB). Esporta regolarmente: è la tua unica
          rete di sicurezza.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={doExport} data-testid="export-json-button" className="h-12 rounded-xl">
            <Download className="w-4 h-4 mr-1" /> Esporta
          </Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()} data-testid="import-json-button" className="h-12 rounded-xl">
            <Upload className="w-4 h-4 mr-1" /> Importa
          </Button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={doImport} data-testid="import-json-input" />
        </div>
        {usage && (
          <p className="text-xs text-muted-foreground pt-1">
            Spazio usato: <span className="font-stat">{mb(usage.usage)} MB</span>
            {usage.quota ? ` / ${mb(usage.quota)} MB disponibili` : ""}
          </p>
        )}
      </Card>

      <Card className="p-4 flex items-start gap-3 border-amber-500/30 bg-amber-500/5">
        <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          Cancellare la cache del browser o disinstallare la PWA elimina i dati. Fai un export prima
          di cambiare telefono o pulire il browser.
        </p>
      </Card>
    </div>
  );
}

function Row({ icon: Icon, title, desc, children }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="w-5 h-5 text-primary" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      {children}
    </div>
  );
}
