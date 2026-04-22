import { useState } from "react";
import Resumen from "./tabs/Resumen.jsx";
import Stack from "./tabs/Stack.jsx";
import Arquitectura from "./tabs/Arquitectura.jsx";
import Pipeline from "./tabs/Pipeline.jsx";
import Demo from "./tabs/Demo.jsx";
import Costos from "./tabs/Costos.jsx";
import Roadmap from "./tabs/Roadmap.jsx";

const TABS = [
  { id: "resumen", label: "Resumen", component: Resumen },
  { id: "stack", label: "Stack Actual", component: Stack },
  { id: "arquitectura", label: "Arquitectura", component: Arquitectura },
  { id: "pipeline", label: "Pipeline IA", component: Pipeline },
  { id: "demo", label: "Demo", component: Demo },
  { id: "costos", label: "Costos", component: Costos },
  { id: "roadmap", label: "Roadmap", component: Roadmap },
];

export default function App() {
  const [active, setActive] = useState("resumen");
  const ActiveComp = TABS.find((t) => t.id === active).component;

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="./americar-logo.png" alt="Americar" className="h-8 bg-white rounded-md px-2 py-1" />
            <div className="border-l border-slate-800 pl-3">
              <h1 className="font-semibold text-base leading-none">Photo AI</h1>
              <p className="text-xs text-slate-400 mt-1">Propuesta técnica v3.0</p>
            </div>
          </div>
          <a
            href="https://platform.openai.com/docs/guides/images"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-slate-400 hover:text-brand-300"
          >
            OpenAI gpt-image-1 ↗
          </a>
        </div>

        <nav className="max-w-6xl mx-auto px-4 overflow-x-auto">
          <div className="flex gap-1 -mb-px">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className={
                  "px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap " +
                  (active === t.id
                    ? "border-brand-500 text-brand-300"
                    : "border-transparent text-slate-400 hover:text-slate-200")
                }
              >
                {t.label}
              </button>
            ))}
          </div>
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <ActiveComp />
      </main>

      <footer className="border-t border-slate-800 mt-16 py-6 text-center text-xs text-slate-500">
        Americar Photo AI · propuesta técnica · {new Date().getFullYear()}
      </footer>
    </div>
  );
}
