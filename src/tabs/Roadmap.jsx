const PHASES = [
  {
    phase: "Fase 1",
    name: "Quick wins sobre portal_mf_inspection",
    duration: "Semanas 1-3",
    status: "now",
    items: [
      "Migrar fetch() del formulario a @tanstack/react-query (caching, retry, prefetching del catálogo marcas/modelos/versiones)",
      "Skeleton screens por sección con react-loading-skeleton",
      "Compresión client-side de fotos con browser-image-compression antes del upload (60-80% menos bytes)",
      "Preview post-upload (objectURL) — hoy no hay galería",
      "Integrar @sentry/react con ErrorBoundary por MF",
    ],
  },
  {
    phase: "Fase 2",
    name: "Captura guiada + pipeline IA (scope de esta propuesta)",
    duration: "Semanas 4-8",
    status: "next",
    items: [
      "Componente CaptureView con react-webcam dentro del MF, overlay de silueta SVG por ángulo (14 slots)",
      "Botón dual por slot: Capturar (cámara con silueta) + Subir (galería)",
      "Slot ★ Frente Derecho destacado como FOTO DE PUBLICACIÓN en la UI del inspector",
      "Nuevo endpoint en BFF: POST /inspection/:id/publication-photo",
      "Cloudflare Worker orquestando: Claude (análisis) → remove.bg (cutout) → Nano Banana (correcciones por máscara) → Canvas compose (estudio + patente)",
      "Lightbox con react-photo-view y crop post-captura con react-image-crop (aspect fijo)",
      "Slider antes/después con react-compare-slider para verificar la foto procesada",
      "Webhook de estado: pending → processing → done → error",
    ],
  },
  {
    phase: "Fase 3",
    name: "UX del formulario",
    duration: "Semanas 9-12",
    status: "later",
    items: [
      "Transiciones entre las 11 secciones con framer-motion",
      "Validación inline real-time con @hookform/resolvers (ya hay RHF + Yup)",
      "Select con búsqueda async para marca/modelo/versión con react-select",
      "Formateo numérico con react-number-format para km y precios",
      "Barra de progreso por sección + auto-save cada 30s",
    ],
  },
  {
    phase: "Fase 4",
    name: "Resiliencia & offline",
    duration: "Semanas 13-16",
    status: "later",
    items: [
      "Service Worker con workbox-webpack-plugin para cache de assets del MF",
      "Auto-save del formulario en IndexedDB con idb-keyval (inspector en zonas con mala señal)",
      "Queue de uploads pendientes con retry automático",
      "Indicador de estado de conexión en la UI",
    ],
  },
  {
    phase: "Fase 5",
    name: "Dashboard supervisión",
    duration: "Semanas 17-20",
    status: "later",
    items: [
      "Dashboard de inspecciones: completadas, pendientes, promedio/día (recharts)",
      "Métricas de calidad fotográfica: % aprobadas por el pipeline IA",
      "Ranking de inspectores por velocidad y calidad de foto de publicación",
      "Tendencias semanales y mensuales",
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
        <p className="text-slate-400 text-sm">
          Plan de 20 semanas en 5 fases, alineado con la auditoría del backoffice actual. Cada fase vive dentro del MF{" "}
          <code>portal_mf_inspection</code> sin romper Module Federation.
        </p>
      </div>

      <div className="rounded-xl bg-brand-600/10 border border-brand-500/40 p-4 text-sm text-slate-200">
        <strong className="text-brand-300">Alcance del roadmap:</strong> todas las fases se implementan dentro
        del paso 10 <em>“Fotografías del Vehículo”</em> del Formulario de Inspección existente. El disparador del
        pipeline IA es el <strong>Guardar</strong> de la inspección y corre únicamente sobre la
        <strong> ★ Foto de publicación</strong> (Frente Derecho, ángulo fijo para toda la flota) — destacada
        visualmente en la UI del inspector.
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
          Validar con el equipo de backoffice el nuevo endpoint{" "}
          <code className="text-brand-300">POST /inspection/:id/publication-photo</code> en el BFF, integrar{" "}
          <code>react-webcam</code> dentro del slot Frente Derecho con silueta SVG de referencia, y cablear el pipeline
          del Cloudflare Worker con Nano Banana + remove.bg. Una vez validado el output con inspecciones reales
          (SsangYong Tivoli y similares), activamos el resto de los slots.
        </p>
      </div>
    </div>
  );
}
