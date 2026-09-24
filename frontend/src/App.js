import "@/App.css";
import { HashRouter, Routes, Route } from "react-router-dom";
import { StoreProvider, useStore } from "@/store/StoreContext";
import { Toaster } from "@/components/ui/sonner";
import Layout from "@/components/Layout";
import HomeView from "@/components/HomeView";
import PlanEditorView from "@/components/PlanEditorView";
import WorkoutModeView from "@/components/WorkoutModeView";
import ExerciseHistoryView from "@/components/ExerciseHistoryView";
import SettingsView from "@/components/SettingsView";
import { Snowflake } from "lucide-react";

function Splash() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background text-primary">
      <Snowflake className="w-10 h-10 animate-spin" style={{ animationDuration: "3s" }} />
      <p className="font-heading text-2xl font-black tracking-widest uppercase">Inverno Fit</p>
    </div>
  );
}

function Shell() {
  const { ready } = useStore();
  if (!ready) return <Splash />;
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomeView />} />
        <Route path="/editor" element={<PlanEditorView />} />
        <Route path="/workout" element={<WorkoutModeView />} />
        <Route path="/history" element={<ExerciseHistoryView />} />
        <Route path="/settings" element={<SettingsView />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <div className="App">
      <StoreProvider>
        <HashRouter>
          <Shell />
          <Toaster position="top-center" richColors />
        </HashRouter>
      </StoreProvider>
    </div>
  );
}
