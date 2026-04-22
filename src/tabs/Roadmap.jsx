const PHASES = [
  {
    phase: "Fase 1",
    name: "MVP funcional",
    duration: "1 semana",
    status: "done",
    items: [
      "Upload de foto + marcado manual de patente",
      "Integración OpenAI gpt-image-1 vía Worker",
      "Overlay del logo Americar en la zona de la patente",
      "Descarga del JPG final",
    ],
  },
  {
    phase: "Fase 2",
    name: "Hardening y despliegue",
    duration: "1 semana",
    status: "now",
    items: [
      "Deploy del Worker en Cloudflare con secret",
      "Publicación del frontend en GitHub Pages",
      "CORS restringido al dominio de producción",
      "Rate limiting básico por IP",
    ],
  },
  {
    phase: "Fase 3",
    name: "Detección automática de patente",
    duration: "2 semanas",
    status: "next",
    items: [
      "Modelo YOLO / Roboflow para detección automática",
      "Fallback manual si la confianza es baja",
      "A/B contra el flujo manual para medir mejora",
    ],
  },
  {
    phase: "Fase 4",
    name: "Procesamiento en lote",
    duration: "2 semanas",
    status: "next",
    items: [
      "Upload de zip con múltiples fotos",
      "Cola de procesamiento con progreso",
      "Descarga zip con resultados",
      "Integración opcional con el backoffice del portal",
    ],
  },
  {
    phase: "Fase 5",
    name: "Optimizaciones avanzadas",
    duration: "open",
    status: "later",
    items: [
      "Máscara (inpainting) para no alterar el vehículo",
      "Preset de fondos alternativos (exterior, garaje)",
      "Métricas: tiempo por foto, costo mensual, tasa de aceptación",
      "Watermark configurable por concesionaria",
    ],
  },
];

const STATUS = {
  done: { label: "Completado", color: "bg-brand-500 text-slate-950" },
  now: { label: "En curso", color: "bg-amber-400 text-slate-950" },
  next: { label: "Siguiente", color: "bg-slate-700 text-slate-200" },
  later: { label: "Backlog", color: "bg-slate-800 text-slate-400" },
};

export default function Roadmap() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-1">Roadmap</h2>
        <p className="text-slate-400 text-sm">Plan de implementación en 5 fases incrementales.</p>
      </div>

      <ol className="relative border-l border-slate-800 ml-3 space-y-6">
        {PHASES.map((p) => {
          const s = STATUS[p.status];
          return (
            <li key={p.phase} className="pl-6">
              <span className={"absolute -left-2.5 w-5 h-5 rounded-full border-2 border-slate-950 " + s.color.split(" ")[0]} />
              <div className="rounded-xl bg-slate-900 border border-slate-800 p-5">
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider">{p.phase} · {p.duration}</div>
                    <h3 className="text-lg font-semibold">{p.name}</h3>
                  </div>
                  <span className={"text-xs font-semibold px-2.5 py-1 rounded-full " + s.color}>{s.label}</span>
                </div>
                <ul className="mt-3 space-y-1.5 text-sm text-slate-300 list-disc pl-5">
                  {p.items.map((i) => <li key={i}>{i}</li>)}
                </ul>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="rounded-xl bg-slate-900/60 border border-brand-700/40 p-5">
        <h3 className="font-semibold text-brand-300 mb-2">Próximo paso para validar</h3>
        <p className="text-slate-300 text-sm">
          Desplegar el Worker en Cloudflare con tu API key de OpenAI y probar
          con 10-20 fotos reales del catálogo actual. Con eso ajustamos el prompt
          y evaluamos pasar a Fase 3.
        </p>
      </div>
    </div>
  );
}
