import { uid } from "@/lib/id";

export const buildSeedState = () => {
  const mk = (name, sets, reps, rest, note = "", image = "", guideLink = "") => ({
    id: uid(),
    name,
    sets,
    reps,
    rest,
    note,
    image,
    guideLink,
  });

  const push = {
    id: uid(),
    name: "A · Spinta",
    exercises: [
      mk(
        "Panca piana bilanciere",
        4,
        "8-10",
        120,
        "Scapole retratte, gomiti a ~45°, tocco sotto il petto.",
        "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
        "https://www.youtube.com/results?search_query=panca+piana+bilanciere+tecnica"
      ),
      mk("Military press manubri", 3, "10-12", 90, "Core contratto, non inarcare la schiena."),
      mk("Croci ai cavi", 3, "12-15", 60, "Leggera flessione del gomito costante."),
      mk("French press", 3, "10-12", 60, "Gomiti fermi, solo avambraccio si muove."),
    ],
  };

  const pull = {
    id: uid(),
    name: "B · Tirata",
    exercises: [
      mk(
        "Trazioni alla sbarra",
        4,
        "max",
        120,
        "Petto verso la sbarra, controllo in negativa.",
        "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
        "https://www.youtube.com/results?search_query=trazioni+tecnica"
      ),
      mk("Rematore bilanciere", 4, "8-10", 120, "Busto ~30°, tira verso l'ombelico."),
      mk("Lat machine presa stretta", 3, "10-12", 90, ""),
      mk("Curl bilanciere", 3, "10-12", 60, "Niente slancio, gomiti fermi."),
    ],
  };

  const legs = {
    id: uid(),
    name: "C · Gambe",
    exercises: [
      mk(
        "Squat bilanciere",
        4,
        "6-8",
        150,
        "Scendi sotto il parallelo mantenendo la schiena neutra.",
        "https://images.pexels.com/photos/3888405/pexels-photo-3888405.jpeg?auto=compress&cs=tinysrgb&w=800",
        "https://www.youtube.com/results?search_query=squat+tecnica"
      ),
      mk("Pressa 45°", 3, "10-12", 120, ""),
      mk("Stacco rumeno", 3, "10-12", 120, "Anche indietro, schiena dritta."),
      mk("Calf raise", 4, "15-20", 45, "Massima escursione, pausa in alto."),
    ],
  };

  const plan = {
    id: uid(),
    name: "Inverno Split (PPL)",
    weeks: [
      {
        id: uid(),
        name: "Settimana 1",
        days: [push, pull, legs],
      },
    ],
  };

  return {
    schemaVersion: CURRENT_SCHEMA,
    plans: [plan],
    activePlanId: plan.id,
    activeWeekId: plan.weeks[0].id,
    logs: [],
    session: null,
    settings: {
      theme: "dark",
      defaultRest: 90,
      unit: "kg",
      vibration: true,
    },
  };
};

export const CURRENT_SCHEMA = 1;
