import { useState } from "react";

// Todos los precios oficiales de los proveedores (Anthropic, Google, remove.bg, Cloudflare)
// están publicados en USD. Abajo se muestran también en CLP para referencia Americar.
// Referencia abril 2026.
const USD_TO_CLP = 960;

// Claude Sonnet 4: input $3 / MTok · output $15 / MTok (Anthropic).
// Una foto 1024² + prompt de análisis ≈ 1.600 input + 500 output tokens → ~$0.0123 / análisis.
const CLAUDE_PER_ANALYSIS = 0.013;
// Nano Banana (Gemini 2.5 Flash Image): $30 / 1M output tokens · 1.290 tokens por imagen → $0.039 / edición.
const GEMINI_PER_EDIT = 0.039;
// remove.bg: PAYG $0.20 / call; plan 2000 imgs/mes ≈ $0.07 por imagen.
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

const VOLUME_ROWS = [1000, 2000, 3000];
const AMERICAR_RANGE = [3000];

function clp(v) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(v);
}
function usd(v, fraction = 2) {
  return "$" + v.toFixed(fraction) + " USD";
}

export default function Costos() {
  const [volume, setVolume] = useState(3000);
  const [scenarioId, setScenarioId] = useState("produccion-volumen");
  const scenario = SCENARIOS[scenarioId];
  const monthlyUSD = volume * scenario.perInspection;
  const yearlyUSD = monthlyUSD * 12;
  const monthlyCLP = monthlyUSD * USD_TO_CLP;
  const yearlyCLP = yearlyUSD * USD_TO_CLP;

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-semibold mb-2">Estructura de costos</h2>
        <p className="text-slate-300">
          Modelo 100% variable: una sola foto procesada por inspección (★ Frente Derecho).
          Sin infra fija: Cloudflare Workers y GitHub Pages free tier absorben el hosting.
        </p>
        <div className="mt-4 rounded-xl bg-brand-600/10 border border-brand-500/40 p-4 text-sm text-slate-200">
          <strong className="text-brand-300">Moneda:</strong> todos los proveedores (Anthropic, Google, remove.bg,
          Cloudflare) publican sus precios en <strong>USD</strong>. En este tab se muestran los valores en USD
          y su equivalente en <strong>CLP</strong> al tipo de cambio referencial{" "}
          <code className="text-brand-300">1 USD = {USD_TO_CLP.toLocaleString("es-CL")} CLP</code> (abril 2026).
          Para presupuesto oficial, actualizar al tipo de cambio del mes.
        </div>
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
            <Stat label="Costo mensual" usd={usd(monthlyUSD)} clp={clp(monthlyCLP)} />
            <Stat label="Costo anual" usd={usd(yearlyUSD)} clp={clp(yearlyCLP)} />
            <Stat label="Costo por inspección" usd={usd(scenario.perInspection, 3)} clp={clp(scenario.perInspection * USD_TO_CLP)} />
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-4">
          * Conversión USD→CLP referencial ({USD_TO_CLP.toLocaleString("es-CL")} CLP/USD). Actualizar al tipo de cambio
          del mes para el presupuesto oficial. Al volumen estimado de Americar (hasta 3.000 inspecciones/mes) conviene
          pedir pricing corporativo a Google Cloud + descuentos en Anthropic enterprise para bajar el ticket unitario.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-3">Proyección por volumen</h3>

        <div className="grid md:grid-cols-3 gap-3 mb-4">
          <LegendCard
            title="Qué muestra esta tabla"
            body="Cuánto cuesta procesar con IA la foto de publicación de cada inspección, según cuántas inspecciones haga Americar por mes. Cada celda tiene el monto mensual (USD + CLP) y el proyectado anual."
          />
          <LegendCard
            title="Por qué 3 escenarios"
            body="Son 3 combinaciones posibles del pipeline IA. Lo único que cambia entre ellas es si se agrega o no remove.bg (segmentación del auto) y, si se agrega, si se paga por llamada o con plan al volumen."
          />
          <LegendCard
            title="Fila destacada (AMERICAR)"
            body="El volumen real esperado de Americar llega hasta 3.000 inspecciones/mes. Esa fila está pintada para que sea fácil ubicar el número relevante al presupuesto."
          />
        </div>

        <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500 bg-slate-950">
              <tr>
                <th className="text-left px-4 py-3">Inspecciones / mes</th>
                {Object.entries(SCENARIOS).map(([id, s]) => {
                  const recommended = id === "produccion-volumen";
                  return (
                    <th key={id} className={"text-right px-4 py-3 " + (recommended ? "bg-brand-500/20 text-brand-200" : "")}>
                      <div className="flex flex-col items-end gap-1">
                        {recommended && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-brand-500 text-slate-950">★ RECOMENDADO</span>
                        )}
                        <span>{s.label}</span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {VOLUME_ROWS.map((v) => (
                <tr key={v} className={AMERICAR_RANGE.includes(v) ? "bg-brand-500/5" : ""}>
                  <td className="px-4 py-3 font-semibold text-slate-200">
                    {v.toLocaleString("es-CL")}
                    {AMERICAR_RANGE.includes(v) && <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-brand-500 text-slate-950">AMERICAR</span>}
                  </td>
                  {Object.entries(SCENARIOS).map(([id, s]) => {
                    const m = v * s.perInspection;
                    const recommended = id === "produccion-volumen";
                    return (
                      <td key={id} className={"px-4 py-3 text-right " + (recommended ? "bg-brand-500/10" : "")}>
                        <div className={"font-mono " + (recommended ? "text-brand-200 font-bold" : "text-slate-200")}>{usd(m)}</div>
                        <div className={"text-xs " + (recommended ? "text-brand-300/80" : "text-slate-500")}>{clp(m * USD_TO_CLP)} / mes</div>
                        <div className={"text-[11px] " + (recommended ? "text-brand-300/60" : "text-slate-600")}>{clp(m * USD_TO_CLP * 12)} / año</div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-4">
          <ScenarioExplainer
            title="Sin segmentación"
            tag="más barato"
            body="El Worker manda la foto directo a Claude (análisis) y a Nano Banana (edición). Es el flujo del demo actual. No hay garantía estructural de que el auto no se modifique: la IA podría espejar, rotar o rejuvenecer. Útil para pilotos y para avisos internos."
          />
          <ScenarioExplainer
            title="Producción PAYG"
            tag="seguro, caro"
            highlighted
            body="Agrega remove.bg (pay-as-you-go $0.20/img) para recortar el auto antes de que Nano Banana lo toque. El auto queda 1:1 — imposible que cambie orientación o wear. Costo alto por llamada."
          />
          <ScenarioExplainer
            title="Producción con volumen"
            tag="★ recomendado"
            recommended
            body="Mismo pipeline seguro del PAYG, pero con plan mensual de remove.bg (2.000 imágenes por $139, ≈ $0.07/img). Hasta 3.000 inspecciones por mes es el escenario con mejor relación costo/seguridad."
          />
        </div>

        <div className="mt-4 rounded-xl bg-slate-900/60 border border-slate-800 p-4 text-xs text-slate-400 leading-relaxed">
          <strong className="text-slate-200">Cómo leer la tabla:</strong> buscá la fila del volumen esperado
          (hasta 3.000 para Americar) y mirá la columna destacada en verde (<strong>Producción con volumen</strong>).
          Ese es el costo que deberías presupuestar. Los otros dos escenarios son para dimensionar el rango
          mínimo (sin segmentación) y máximo (PAYG) antes de negociar el plan con el proveedor.
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-3">Escenario Americar — hasta 3.000 inspecciones/mes</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {Object.entries(SCENARIOS).map(([id, s]) => {
            const m = 3000 * s.perInspection;
            const y = m * 12;
            return (
              <div key={id} className={"rounded-xl p-5 border " + (id === "produccion-volumen" ? "bg-brand-500/10 border-brand-500/40" : "bg-slate-900 border-slate-800")}>
                <div className="text-xs text-slate-500 uppercase tracking-wider">{s.label}</div>
                <div className="mt-3">
                  <div className="text-xs text-slate-400">Costo mensual (3.000 insp.)</div>
                  <div className="text-2xl font-bold text-brand-300 leading-tight">{clp(m * USD_TO_CLP)}</div>
                  <div className="text-xs text-slate-500 font-mono">{usd(m)}</div>
                </div>
                <div className="mt-3">
                  <div className="text-xs text-slate-400">Costo anual</div>
                  <div className="text-xl font-bold text-slate-100 leading-tight">{clp(y * USD_TO_CLP)}</div>
                  <div className="text-xs text-slate-500 font-mono">{usd(y)}</div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-800 text-xs text-slate-400">
                  Costo por inspección: <span className="font-mono text-slate-300">{usd(s.perInspection, 3)}</span> · <span className="font-mono">{clp(s.perInspection * USD_TO_CLP)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-3">Comparación vs. Impel</h3>
        <p className="text-sm text-slate-400 mb-4">
          Impel es la plataforma de fotografía automotriz actualmente disponible en el mercado para
          concesionarios (procesa fotos de autos usados: fondo estudio, limpieza, patente). Costo referencial:
          <strong className="text-slate-200"> $4.200 USD/mes</strong> (licencia fija, {clp(4200 * USD_TO_CLP)}).
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <Compare
            title="Impel"
            items={[
              "Licencia fija: $4.200 USD/mes · " + clp(4200 * USD_TO_CLP) + "/mes",
              "$50.400 USD/año · " + clp(4200 * 12 * USD_TO_CLP) + "/año",
              "Costo independiente del volumen (pagás igual uses 500 o 5.000 inspecciones)",
              "Producto cerrado: sin control sobre prompts, pipeline o integración al MF",
            ]}
            tone="slate"
          />
          <Compare
            title="Americar Photo AI (Nano Banana) — recomendado"
            items={[
              "Escenario con volumen a 1.000 inspecciones: " + usd(1000 * SCENARIOS["produccion-volumen"].perInspection) + "/mes · " + clp(1000 * SCENARIOS["produccion-volumen"].perInspection * USD_TO_CLP) + "/mes",
              "Escenario con volumen a 3.000 inspecciones (tope Americar): " + usd(3000 * SCENARIOS["produccion-volumen"].perInspection) + "/mes · " + clp(3000 * SCENARIOS["produccion-volumen"].perInspection * USD_TO_CLP) + "/mes",
              "Costo 100% variable: si no procesás, no pagás",
              "Integrado en portal_mf_inspection · pipeline propio · prompts controlados",
            ]}
            tone="brand"
          />
        </div>

        <div className="mt-4 grid md:grid-cols-3 gap-4">
          <SavingsCard
            label="Ahorro mensual vs. Impel"
            value={4200 - 3000 * SCENARIOS["produccion-volumen"].perInspection}
            clpLabel={clp((4200 - 3000 * SCENARIOS["produccion-volumen"].perInspection) * USD_TO_CLP)}
            note="A 3.000 inspecciones/mes con escenario recomendado"
          />
          <SavingsCard
            label="Ahorro anual vs. Impel"
            value={(4200 - 3000 * SCENARIOS["produccion-volumen"].perInspection) * 12}
            clpLabel={clp((4200 - 3000 * SCENARIOS["produccion-volumen"].perInspection) * 12 * USD_TO_CLP)}
            note="12 meses de operación al tope del rango"
          />
          <SavingsCard
            label="% reducción de costo"
            value={null}
            custom={`${Math.round((1 - (3000 * SCENARIOS["produccion-volumen"].perInspection) / 4200) * 100)}%`}
            note="Costo de Photo AI sobre costo de Impel"
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
      <div className="text-3xl font-bold text-brand-300 mt-3">${price.toFixed(3)} <span className="text-sm text-slate-500 font-normal">USD</span></div>
      <div className="text-xs text-brand-500/80 font-mono">{clp(price * USD_TO_CLP)}</div>
      <div className="text-xs text-slate-500 mt-1">por imagen</div>
      {priceVolume != null && (
        <div className="text-xs text-brand-300 mt-1">
          con volumen: ${priceVolume.toFixed(2)} USD · {clp(priceVolume * USD_TO_CLP)} / img
        </div>
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
      <div className="text-3xl font-bold text-brand-300 mt-3">${total.toFixed(3)} <span className="text-sm text-slate-500 font-normal">USD</span></div>
      <div className="text-xs text-brand-500/80 font-mono">{clp(total * USD_TO_CLP)} / inspección</div>
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

function Stat({ label, usd, clp }) {
  return (
    <div className="rounded-lg bg-slate-950 border border-slate-800 p-4">
      <div className="text-xs text-slate-400 uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-bold text-brand-300 mt-1">{usd}</div>
      <div className="text-sm text-slate-300 font-mono mt-0.5">{clp}</div>
    </div>
  );
}

function SavingsCard({ label, value, clpLabel, note, custom }) {
  return (
    <div className="rounded-xl bg-brand-500/10 border border-brand-500/40 p-4">
      <div className="text-xs text-slate-400 uppercase tracking-wide">{label}</div>
      {custom ? (
        <div className="text-3xl font-bold text-brand-300 mt-1">{custom}</div>
      ) : (
        <>
          <div className="text-2xl font-bold text-brand-300 mt-1">${value.toFixed(0)} <span className="text-sm text-slate-500 font-normal">USD</span></div>
          <div className="text-sm font-mono text-slate-300 mt-0.5">{clpLabel}</div>
        </>
      )}
      <div className="text-[11px] text-slate-500 mt-2 leading-snug">{note}</div>
    </div>
  );
}

function LegendCard({ title, body }) {
  return (
    <div className="rounded-xl bg-slate-900 border border-slate-800 p-4">
      <div className="text-xs font-semibold text-brand-300 uppercase tracking-wider mb-1">{title}</div>
      <p className="text-xs text-slate-300 leading-relaxed">{body}</p>
    </div>
  );
}

function ScenarioExplainer({ title, tag, body, highlighted, recommended }) {
  const border = recommended
    ? "bg-brand-500/10 border-brand-500 ring-2 ring-brand-500/30"
    : highlighted
      ? "bg-slate-900 border-amber-500/40"
      : "bg-slate-900 border-slate-800";
  const tagClass = recommended
    ? "bg-brand-500 text-slate-950"
    : highlighted
      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
      : "bg-slate-800 text-slate-300";
  return (
    <div className={"rounded-xl p-4 border " + border}>
      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
        <div className="font-semibold text-slate-100">{title}</div>
        <span className={"text-[10px] font-bold px-2 py-0.5 rounded-full " + tagClass}>{tag}</span>
      </div>
      <p className="text-xs text-slate-400 leading-relaxed">{body}</p>
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
