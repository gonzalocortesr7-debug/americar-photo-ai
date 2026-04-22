const PHASES = [
  {
    phase: "Fase 1",
    name: "Pipeline de procesamiento",
    duration: "Semanas 1-3",
    status: "now",
    items: [
      "Backend Cloudflare Worker proxeando a Claude Sonnet 4 + gpt-image-1",
      "Pipeline de compositing en canvas: fondo estudio + auto preservado + sombra + logo",
      "Preservación 100% de pixeles del vehículo (no regeneración)",
      "Overlay de logo Americar sobre patente (manual o detectado)",
      "Reemplazo de la foto original por la procesada en el storage del portal",
    ],
  },
  {
    phase: "Fase 2",
    name: "Fotografía mejorada — Captura guiada",
    duration: "Semanas 4-8",
    status: "next",
    items: [
      "Componente CaptureView dentro del paso 10 con overlay de silueta por cada uno de los 14 slots",
      "Botón dual en cada slot: Capturar (cámara) + Subir (galería)",
      "Catálogo de siluetas por slot: frente, frente 3/4, laterales, llantas, tablero, panel",
      "Lightbox con zoom para revisar fotos capturadas (react-photo-view)",
      "Crop tool post-captura con aspect ratio fijo (react-image-crop)",
      "Disparo del pipeline IA al Guardar la inspección (POST batch + webhook por slot)",
      "Slider antes/después en la galería de la inspección para validación comercial",
      "Impacto: fotos estandarizadas + pipeline IA activado sin cambiar el flujo del inspector",
    ],
  },
  {
    phase: "Fase 3",
    name: "Procesamiento en lote + integración portal",
    duration: "Semanas 9-12",
    status: "later",
    items: [
      "Cola de procesamiento por inspección (14 fotos en paralelo con control de concurrencia)",
      "Webhook de estado por slot: pending → processing → done → error",
      "Persistencia automática en el storage del portal reemplazando la foto original",
      "Dashboard de métricas: inspecciones procesadas, costo por inspección, tasa de aceptación",
    ],
  },
  {
    phase: "Fase 4",
    name: "Detección automática y optimizaciones",
    duration: "Open",
    status: "later",
    items: [
      "Detección automática de patente (YOLO / Roboflow) con fallback manual",
      "Preset de fondos alternativos (exterior outdoor, garaje premium, etc.)",
      "Retoque automático de suciedad puntual con máscara (Flux Kontext o similar)",
      "Watermark configurable por concesionaria o segmento",
    ],
  },
];

const STATUS = {
  done: { label: "Completado", color: "bg-brand-500 text-slate-950", dot: "bg-brand-500" },
  now: { label: "En curso", color: "bg-amber-400 text-slate-950", dot: "bg-amber-400" },
  next: { label: "Siguiente", color: "bg-sky-500 text-slate-950", dot: "bg-sky-500" },
  later: { label: "Backlog", color: "bg-slate-700 text-slate-200", dot: "bg-slate-700" },
};

export default function Roadmap() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-1">Roadmap</h2>
        <p className="text-slate-400 text-sm">Plan de implementación en 4 fases incrementales a 12 semanas.</p>
      </div>

      <div className="rounded-xl bg-brand-600/10 border border-brand-500/40 p-4 text-sm text-slate-200">
        <strong className="text-brand-300">Alcance del roadmap:</strong> todas las fases se implementan dentro
        del paso 10 <em>“Fotografías del Vehículo”</em> del Formulario de Inspección. El disparador es el
        <strong> Guardar</strong> de la inspección y la IA corre únicamente sobre la
        <strong> ★ Foto de publicación</strong> (Frente Derecho, ángulo fijo para toda la flota) —
        destacada visualmente en la UI del inspector.
      </div>

      <ol className="relative border-l border-slate-800 ml-3 space-y-6">
        {PHASES.map((p) => {
          const s = STATUS[p.status];
          return (
            <li key={p.phase} className="pl-6">
              <span className={"absolute -left-2.5 w-5 h-5 rounded-full border-2 border-slate-950 " + s.dot} />
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
        <h3 className="font-semibold text-brand-300 mb-2">Próximo paso inmediato</h3>
        <p className="text-slate-300 text-sm">
          Crear cuenta en remove.bg y obtener API key, reescribir Worker para llamar a
          su endpoint con <code className="text-brand-300">type=car</code>, y validar el
          resultado del compositing con una foto real (SsangYong Tivoli de referencia).
          Una vez aprobado el output visual, arrancamos Fase 2.
        </p>
      </div>
    </div>
  );
}
