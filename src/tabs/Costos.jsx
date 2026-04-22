import { useState } from "react";

// Costos unitarios oficiales (referencia abril 2026).
// Claude Sonnet 4: input $3 / MTok · output $15 / MTok (Anthropic).
// Una foto 1024² + prompt de análisis ≈ 1.600 input + 500 output tokens → ~$0.0123 / análisis.
const CLAUDE_PER_ANALYSIS = 0.013;
// Nano Banana (Gemini 2.5 Flash Image): $30 / 1M output tokens · 1.290 tokens por imagen generada → $0.039 / edición.
const GEMINI_PER_EDIT = 0.039;
// remove.bg: API pay-as-you-go $0.20 / call; con plan 2000 imgs/mes baja a ~$0.07 (referencia).
const REMOVEBG_PAYG = 0.20;
const REMOVEBG_VOLUME = 0.07;
// Cloudflare Workers: free tier cubre 100k req/día; costo marginal por inspección ≈ 0.
const WORKER_COST = 0.0;

const SCENARIOS = {
  "sin-segmentacion": {
    label: "Sin segmentación (demo actual)",
    desc: "Claude analiza + Nano Banana edita directo. Más barato pero sin garantía pixel-perfect del auto.",
    perInspection: CLAUDE_PER_ANALYSIS + GEMINI_PER_EDIT + WORKER_COST,
    breakdown: [
      { k: "Claude Sonnet 4 · análisis", v: CLAUDE_PER_ANALYSIS },
      { k: "Nano Banana · edición", v: GEMINI_PER_EDIT },
      { k: "Cloudflare Worker", v: WORKER_COST },
    ],
  },
  "produccion-payg": {
    label: "Producción (remove.bg pay-as-you-go)",
    desc: "Pipeline completo: análisis + cutout + edición acotada por máscara. Orientación y wear garantizados.",
    perInspection: CLAUDE_PER_ANALYSIS + REMOVEBG_PAYG + GEMINI_PER_EDIT + WORKER_COST,
    breakdown: [
      { k: "Claude Sonnet 4 · análisis", v: CLAUDE_PER_ANALYSIS },
      { k: "remove.bg · cutout (PAYG)", v: REMOVEBG_PAYG },
      { k: "Nano Banana · edición", v: GEMINI_PER_EDIT },
      { k: "Cloudflare Worker", v: WORKER_COST },
    ],
  },
  "produccion-volumen": {
    label: "Producción con volumen (remove.bg 2k/mes)",
    desc: "Mismo pipeline de producción pero con plan remove.bg por volumen. Recomendado para Americar a escala.",
    perInspection: CLAUDE_PER_ANALYSIS + REMOVEBG_VOLUME + GEMINI_PER_EDIT + WORKER_COST,
    breakdown: [
      { k: "Claude Sonnet 4 · análisis", v: CLAUDE_PER_ANALYSIS },
      { k: "remove.bg · cutout (plan 2k)", v: REMOVEBG_VOLUME },
      { k: "Nano Banana · edición", v: GEMINI_PER_EDIT },
      { k: "Cloudflare Worker", v: WORKER_COST },
    ],
  },
};

export default function Costos() {
  const [volume, setVolume] = useState(500);
  const [scenarioId, setScenarioId] = useState("produccion-volumen");
  const scenario = SCENARIOS[scenarioId];
  const monthly = volume * scenario.perInspection;
  const yearly = monthly * 12;

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-semibold mb-2">Estructura de costos</h2>
        <p className="text-slate-300">
          Modelo 100% variable: una sola foto procesada por inspección (★ Frente Derecho).
          Sin infra fija: Cloudflare Workers y GitHub Pages free tier absorben el hosting.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-3">Costo unitario por etapa</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <StageCard
            provider="Anthropic"
            stage="Análisis"
            model="Claude Sonnet 4 (vision)"
            price={CLAUDE_PER_ANALYSIS}
            detail="~1.600 tokens input + 500 output por imagen. Devuelve JSON factual: lado visible, wear a preservar, ubicación de patente."
            pricing="$3 / MTok input · $15 / MTok output"
          />
          <StageCard
            provider="Google"
            stage="Edición IA"
            model="Nano Banana (Gemini 2.5 Flash Image)"
            price={GEMINI_PER_EDIT}
            detail="1 imagen = ~1.290 tokens de salida. Correcciones localizadas: suciedad, reflejos, iluminación, fondo estudio, overlay patente."
            pricing="$30 / MTok output · ~$0.039 por imagen"
            highlighted
          />
          <StageCard
            provider="Kaleido"
            stage="Segmentación (opcional, producción)"
            model="remove.bg (type=car)"
            price={REMOVEBG_PAYG}
            priceVolume={REMOVEBG_VOLUME}
            detail="Cutout pixel-perfect del auto. Garantiza que Nano Banana nunca regenere el vehículo completo — evita mirror y rejuvenecimiento."
            pricing="PAYG $0.20/img · Plan 2k/mes $0.07/img"
          />
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-3">Costo total por inspección (foto de publicación)</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {Object.entries(SCENARIOS).map(([id, s]) => (
            <ScenarioCard
              key={id}
              active={scenarioId === id}
              onClick={() => setScenarioId(id)}
              label={s.label}
              desc={s.desc}
              total={s.perInspection}
              breakdown={s.breakdown}
            />
          ))}
        </div>
      </section>

      <section className="rounded-xl bg-slate-900 border border-slate-800 p-6">
        <h3 className="text-lg font-semibold mb-4">Calculadora de volumen</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm text-slate-400">Inspecciones por mes</span>
              <input
                type="number"
                min="1"
                value={volume}
                onChange={(e) => setVolume(Math.max(1, Number(e.target.value) || 0))}
                className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2"
              />
              <span className="text-xs text-slate-500 mt-1 block">1 foto procesada por inspección (la de publicación).</span>
            </label>
            <label className="block">
              <span className="text-sm text-slate-400">Escenario</span>
              <select
                value={scenarioId}
                onChange={(e) => setScenarioId(e.target.value)}
                className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2"
              >
                {Object.entries(SCENARIOS).map(([id, s]) => (
                  <option key={id} value={id}>{s.label} — ${s.perInspection.toFixed(3)}/inspección</option>
                ))}
              </select>
            </label>
          </div>
          <div className="space-y-3">
            <Stat label="Costo mensual estimado" value={`$${monthly.toFixed(2)} USD`} />
            <Stat label="Costo anual estimado" value={`$${yearly.toFixed(2)} USD`} />
            <Stat label="Costo por inspección" value={`$${scenario.perInspection.toFixed(3)} USD`} />
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-4">
          * Precios de referencia abril 2026: Anthropic Claude Sonnet 4, Google Gemini 2.5 Flash Image,
          remove.bg (Kaleido), Cloudflare Workers. Al volumen de Americar conviene pedir pricing corporativo
          a Google Cloud + descuentos en Anthropic por enterprise.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-3">Comparación vs. edición manual</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <Compare
            title="Retoque manual (Photoshop)"
            items={[
              "15–25 min por foto",
              "Editor externo: $3–$8 USD por foto",
              "Depende de disponibilidad humana",
              "Inconsistencia visual entre operadores",
            ]}
            tone="slate"
          />
          <Compare
            title="Americar Photo AI (Nano Banana)"
            items={[
              "30–60 segundos por inspección",
              "$0.05–$0.26 USD por inspección según escenario",
              "Disparo automático al guardar — disponible 24/7",
              "Pipeline determinista con mismo prompt y segmentación",
            ]}
            tone="brand"
          />
        </div>
      </section>
    </div>
  );
}

function StageCard({ provider, stage, model, price, priceVolume, detail, pricing, highlighted }) {
  return (
    <div className={"rounded-xl p-5 border " + (highlighted ? "bg-brand-500/10 border-brand-500/40" : "bg-slate-900 border-slate-800")}>
      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-500 uppercase tracking-wider">{provider} · {stage}</div>
      </div>
      <div className="text-base font-semibold mt-1">{model}</div>
      <div className="text-3xl font-bold text-brand-300 mt-3">${price.toFixed(3)}</div>
      <div className="text-xs text-slate-500">por imagen</div>
      {priceVolume != null && (
        <div className="text-xs text-brand-300 mt-1">con volumen: ${priceVolume.toFixed(2)}/img</div>
      )}
      <p className="text-xs text-slate-400 mt-3 leading-relaxed">{detail}</p>
      <p className="text-[11px] text-slate-500 mt-2 font-mono">{pricing}</p>
    </div>
  );
}

function ScenarioCard({ active, onClick, label, desc, total, breakdown }) {
  return (
    <button
      onClick={onClick}
      className={
        "text-left rounded-xl p-5 border transition " +
        (active
          ? "bg-brand-500/10 border-brand-500 ring-2 ring-brand-500/30"
          : "bg-slate-900 border-slate-800 hover:border-brand-500/50")
      }
    >
      <div className="text-xs text-slate-500 uppercase tracking-wider">Escenario</div>
      <div className="font-semibold mt-1">{label}</div>
      <div className="text-3xl font-bold text-brand-300 mt-3">${total.toFixed(3)}</div>
      <div className="text-xs text-slate-500">por inspección</div>
      <p className="text-xs text-slate-400 mt-3 leading-relaxed">{desc}</p>
      <ul className="mt-3 pt-3 border-t border-slate-800 text-xs text-slate-400 space-y-1">
        {breakdown.map((b) => (
          <li key={b.k} className="flex justify-between gap-2">
            <span>{b.k}</span>
            <span className="font-mono text-slate-300">${b.v.toFixed(3)}</span>
          </li>
        ))}
      </ul>
    </button>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-950 border border-slate-800 p-4">
      <div className="text-xs text-slate-400 uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-bold text-brand-300 mt-1">{value}</div>
    </div>
  );
}

function Compare({ title, items, tone }) {
  const border = tone === "brand" ? "border-brand-500/40 bg-brand-500/5" : "border-slate-800 bg-slate-900";
  return (
    <div className={"rounded-xl p-5 border " + border}>
      <h4 className="font-semibold mb-3">{title}</h4>
      <ul className="space-y-1.5 text-sm text-slate-300 list-disc pl-5">
        {items.map((i) => <li key={i}>{i}</li>)}
      </ul>
    </div>
  );
}
