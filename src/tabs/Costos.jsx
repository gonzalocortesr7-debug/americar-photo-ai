import { useState } from "react";

const PRICE = { low: 0.02, medium: 0.07, high: 0.19 };

export default function Costos() {
  const [volume, setVolume] = useState(500);
  const [quality, setQuality] = useState("medium");
  const monthly = volume * PRICE[quality];
  const yearly = monthly * 12;

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-semibold mb-2">Estructura de costos</h2>
        <p className="text-slate-300">
          Modelo 100% variable: solo se paga por imagen procesada. No hay costos
          fijos de infra (GitHub Pages + Cloudflare Workers free tier).
        </p>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-3">Por imagen (OpenAI gpt-image-1)</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <QualityCard name="Baja" price={PRICE.low} res="1024px" use="Borrador interno" />
          <QualityCard name="Media" price={PRICE.medium} res="1024-1536px" use="Publicación estándar" highlighted />
          <QualityCard name="Alta" price={PRICE.high} res="1536px máx" use="Destacados / premium" />
        </div>
      </section>

      <section className="rounded-xl bg-slate-900 border border-slate-800 p-6">
        <h3 className="text-lg font-semibold mb-4">Calculadora de volumen</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm text-slate-400">Fotos procesadas por mes</span>
              <input
                type="number"
                min="1"
                value={volume}
                onChange={(e) => setVolume(Math.max(1, Number(e.target.value) || 0))}
                className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="text-sm text-slate-400">Calidad</span>
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
                className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2"
              >
                <option value="low">Baja — $0.02</option>
                <option value="medium">Media — $0.07</option>
                <option value="high">Alta — $0.19</option>
              </select>
            </label>
          </div>
          <div className="space-y-3">
            <Stat label="Costo mensual estimado" value={`$${monthly.toFixed(2)} USD`} />
            <Stat label="Costo anual estimado" value={`$${yearly.toFixed(2)} USD`} />
            <Stat label="Costo por imagen" value={`$${PRICE[quality].toFixed(2)} USD`} />
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-4">
          * Precios OpenAI gpt-image-1 (referencia). Hosting y ancho de banda sin costo bajo free tier.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-3">Comparación vs. edición manual</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <Compare
            title="Retoque manual (Photoshop)"
            items={[
              "15–25 min por foto",
              "Editor externo: $3–$8 USD/foto",
              "Depende de disponibilidad humana",
              "Inconsistencia visual entre operadores",
            ]}
            tone="slate"
          />
          <Compare
            title="Americar Photo AI"
            items={[
              "30–60 segundos por foto",
              "$0.02–$0.19 USD/foto",
              "Disponible 24/7 a demanda",
              "Resultado consistente por prompt fijo",
            ]}
            tone="brand"
          />
        </div>
      </section>
    </div>
  );
}

function QualityCard({ name, price, res, use, highlighted }) {
  return (
    <div className={"rounded-xl p-5 border " + (highlighted ? "bg-brand-500/10 border-brand-500/40" : "bg-slate-900 border-slate-800")}>
      <div className="text-sm text-slate-400">Calidad {name}</div>
      <div className="text-3xl font-bold mt-1">${price.toFixed(2)}</div>
      <div className="text-xs text-slate-500 mt-1">por imagen</div>
      <div className="text-xs text-slate-400 mt-3">Resolución: {res}</div>
      <div className="text-xs text-slate-400">Uso: {use}</div>
    </div>
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
