import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useStore } from "@/store/StoreContext";
import { Home, ListChecks, Play, LineChart, Settings, Snowflake, Sun, Moon } from "lucide-react";

const TABS = [
  { to: "/", label: "Oggi", icon: Home, testid: "nav-home-tab" },
  { to: "/editor", label: "Piani", icon: ListChecks, testid: "nav-editor-tab" },
  { to: "/workout", label: "Allena", icon: Play, testid: "nav-workout-tab" },
  { to: "/history", label: "Storico", icon: LineChart, testid: "nav-history-tab" },
  { to: "/settings", label: "Opzioni", icon: Settings, testid: "nav-settings-tab" },
];

export default function Layout() {
  const { settings, toggleTheme, session } = useStore();
  const location = useLocation();

  return (
    <div className="max-w-md sm:max-w-xl mx-auto min-h-screen flex flex-col relative">
      <header
        className="fixed top-0 left-0 right-0 z-40 max-w-md sm:max-w-xl mx-auto h-14 px-4 flex items-center justify-between bg-background/85 backdrop-blur-md border-b border-border/60"
        data-testid="top-bar"
      >
        <div className="flex items-center gap-2">
          <Snowflake className="w-5 h-5 text-primary" />
          <span className="font-heading text-xl font-black tracking-widest uppercase">
            Inverno Fit
          </span>
        </div>
        <button
          onClick={toggleTheme}
          data-testid="theme-toggle-button"
          aria-label="Cambia tema"
          className="w-11 h-11 flex items-center justify-center rounded-full text-foreground/80 hover:text-primary hover:bg-secondary transition-colors"
        >
          {settings?.theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </header>

      <main className="flex-1 pt-16 pb-28 px-4 sm:px-6" key={location.pathname}>
        <Outlet />
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 max-w-md sm:max-w-xl mx-auto px-2 py-2 flex justify-around items-stretch bg-background/90 backdrop-blur-xl border-t border-border/70"
        data-testid="bottom-nav"
      >
        {TABS.map(({ to, label, icon: Icon, testid }) => {
          const active = session && to === "/workout";
          return (
            <NavLink
              key={to}
              to={to}
              data-testid={testid}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center gap-0.5 min-w-[52px] min-h-[52px] px-2 rounded-xl text-[11px] font-semibold transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="uppercase tracking-wide">{label}</span>
              {active && (
                <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-primary animate-pulse" />
              )}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
