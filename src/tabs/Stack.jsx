export default function Stack() {
  return (
    <div className="space-y-8">
      <section className="rounded-xl bg-brand-600/10 border border-brand-500/40 p-4 text-sm text-slate-200">
        <strong className="text-brand-300">Premisa del proyecto:</strong> no se construye una app nueva. La mejora
        se inyecta dentro del micro-frontend <code className="text-brand-300">portal_mf_inspection</code> del
        backoffice actual de Americar, respetando stack, BFF, flujo y UX que el inspector ya usa hoy desde su teléfono.
      </section>

      <div>
        <h2 className="text-2xl font-semibold mb-1">Stack actual del backoffice</h2>
        <p className="text-slate-400 text-sm">
          Auditoría en vivo sobre <code>backoffice.americar.com</code> — Portal Inspecciones v2.0 (abril 2026).
          8 micro-frontends, 448 módulos webpack, 39 JS bundles.
        </p>
      </div>

      <section>
        <h3 className="text-lg font-semibold text-brand-300 mb-3">Arquitectura general</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <KV items={[
            ["Arquitectura", "Micro-Frontends · Webpack 5 Module Federation"],
            ["MFs totales", "8 aplicaciones independientes"],
            ["Bundles JS", "39 archivos · 448 módulos"],
            ["API Backend", "BFF en api.americar.tech"],
            ["CRM", "Creatio"],
          ]} />
          <KV items={[
            ["Shell host", "portal_mf_app · backoffice.americar.com"],
            ["MF objetivo", "portal_mf_inspection (278 módulos)"],
            ["Subdominio", "inspection.backoffice.americar.com"],
            ["Formulario", "11 secciones · 14 slots de fotos (paso 10)"],
            ["Canal", "Móvil · inspector en terreno"],
          ]} />
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-brand-300 mb-3">Librerías core ya en uso</h3>
        <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500 bg-slate-950">
              <tr>
                <th className="text-left px-4 py-2">Librería</th>
                <th className="text-left px-4 py-2">Categoría</th>
                <th className="text-left px-4 py-2">Scope</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {CORE_LIBS.map((r) => (
                <tr key={r[0]}>
                  <td className="px-4 py-2 font-mono text-brand-300">{r[0]}</td>
                  <td className="px-4 py-2 text-slate-300">{r[1]}</td>
                  <td className="px-4 py-2 text-slate-400">{r[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          El componente actual de fotos <code>gallery__Ff78b</code> usa <code>&lt;input type=&quot;file&quot;&gt;</code> nativo, sin
          preview, sin guía de encuadre, sin compresión.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-brand-300 mb-3">BFF — endpoints relevantes</h3>
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 font-mono text-xs text-slate-300 space-y-1">
          <div>GET  /inspection/&#123;id&#125;/form   · formulario de inspección</div>
          <div>GET  /config/&#123;dealerId&#125;     · configuración por dealer</div>
          <div>GET  /pricing/years           · años</div>
          <div>GET  /pricing/brands          · marcas</div>
          <div>GET  /pricing/models          · modelos</div>
          <div>GET  /pricing/versions        · versiones</div>
          <div>GET  /locations               · sucursales</div>
          <div>GET  /geo/cities              · ciudades</div>
          <div className="text-brand-300">POST /inspection/&#123;id&#125;/publication-photo · (nuevo) disparador del pipeline al guardar</div>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-brand-300 mb-3">Gaps que la propuesta cierra</h3>
        <div className="space-y-3">
          <Gap sev="CRÍTICO" title="Fotografía vehicular sin guía"
               cur="Input nativo HTML. Sin preview, sin silueta de encuadre, sin compresión. Fotos suben raw."
               fix="Captura guiada con silueta SVG por slot (14 ángulos) sobre stream de cámara tipo face-ID, preview instantáneo y compresión client-side." />
          <Gap sev="CRÍTICO" title="Sin galería ni verificación"
               cur="0 elementos <img> en la sección de fotos. Inspector no puede verificar lo que subió."
               fix="Preview post-captura, lightbox con zoom, slider antes/después para la foto de publicación procesada." />
          <Gap sev="ALTO" title="Sin data fetching con cache"
               cur="fetch() nativo. Sin React Query ni retry. Sin optimistic updates."
               fix="TanStack Query para caching, retry automático y prefetching del catálogo (marcas/modelos/versiones)." />
          <Gap sev="ALTO" title="Sin error tracking"
               cur="Sin ErrorBoundary ni Sentry. Fallos silenciosos en terreno."
               fix="Sentry por MF con ErrorBoundary. Observabilidad del pipeline IA end-to-end." />
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-brand-300 mb-3">Librerías que sumamos (mantener stack compatible)</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <LibCard priority="P0" items={[
            ["@tanstack/react-query", "Caching + retry + prefetch para el formulario y el catálogo"],
            ["browser-image-compression", "Comprime las 14 fotos client-side antes del upload (60-80% menos bytes)"],
            ["react-webcam", "Stream de cámara con overlay — base para la silueta por slot"],
            ["@sentry/react", "Error tracking + performance por MF"],
            ["@hookform/resolvers", "Optimiza integración RHF + Yup ya en uso"],
          ]} />
          <LibCard priority="P1" items={[
            ["react-photo-view", "Lightbox con zoom y swipe entre los 14 slots"],
            ["react-image-crop", "Crop post-captura con aspect fijo (4:3 exterior, 16:9 interior)"],
            ["react-compare-slider", "Antes / Después para la foto de publicación procesada"],
            ["framer-motion", "Transiciones entre las 11 secciones del formulario"],
            ["react-loading-skeleton", "Skeletons mientras el pipeline IA procesa la publicación"],
          ]} />
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-brand-300 mb-3">Reglas de integración</h3>
        <ul className="text-slate-300 space-y-2 list-disc pl-6 text-sm">
          <li>Ninguna de estas libs rompe Module Federation — se incluyen en el bundle del MF <code>portal_mf_inspection</code>.</li>
          <li>Nada de cambiar React Router, CSS Modules ni el shell. El contrato del shell host se respeta.</li>
          <li>El BFF existente suma un único endpoint nuevo: <code>POST /inspection/:id/publication-photo</code>.</li>
          <li>La silueta de encuadre y el slot de publicación viven <em>dentro</em> de la sección 10 actual, sin pantallas nuevas.</li>
          <li>La foto procesada con IA reemplaza la imagen principal del aviso; las otras 13 quedan intactas como respaldo.</li>
        </ul>
      </section>
    </div>
  );
}

const CORE_LIBS = [
  ["React 18", "Framework", "Todos los MFs"],
  ["React Router DOM", "Routing", "Shell (portal_mf_app)"],
  ["React Hook Form", "Forms", "Inspección, Appraiser"],
  ["Yup", "Validación", "Inspección"],
  ["HeroIcons v2", "Iconografía", "Global (36 iconos)"],
  ["clsx", "Utility", "Inspección, Shell"],
  ["CSS Modules", "Styling", "Todos los MFs (class__hash5)"],
  ["Tailwind CSS", "Styling", "Parcial (w-6, h-6)"],
  ["react-toastify", "Notificaciones", "Global"],
  ["Webpack 5", "Build", "Module Federation"],
  ["D3.js", "Charts", "Shell (referencia)"],
];

function KV({ items }) {
  return (
    <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 divide-y divide-slate-800">
      {items.map(([k, v]) => (
        <div key={k} className="py-2 first:pt-0 last:pb-0 flex gap-4 text-sm">
          <div className="w-36 shrink-0 text-slate-500">{k}</div>
          <div className="text-slate-200">{v}</div>
        </div>
      ))}
    </div>
  );
}

function Gap({ sev, title, cur, fix }) {
  const color =
    sev === "CRÍTICO" ? "bg-red-500/15 text-red-300 border-red-500/40" :
    sev === "ALTO" ? "bg-amber-500/15 text-amber-300 border-amber-500/40" :
    "bg-slate-700/40 text-slate-300 border-slate-600";
  return (
    <div className="rounded-xl bg-slate-900 border border-slate-800 p-4">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className={"text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border " + color}>{sev}</span>
        <h4 className="font-semibold text-slate-100">{title}</h4>
      </div>
      <div className="grid md:grid-cols-2 gap-3 text-sm">
        <div><div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Hoy</div><div className="text-slate-300">{cur}</div></div>
        <div><div className="text-xs text-brand-500 uppercase tracking-wider mb-1">Propuesta</div><div className="text-slate-200">{fix}</div></div>
      </div>
    </div>
  );
}

function LibCard({ priority, items }) {
  return (
    <div className="rounded-xl bg-slate-900 border border-slate-800 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-500 text-slate-950">{priority}</span>
        <span className="text-xs text-slate-400">{priority === "P0" ? "Implementar ya" : "Siguiente sprint"}</span>
      </div>
      <ul className="space-y-2 text-sm">
        {items.map(([name, why]) => (
          <li key={name}>
            <div className="font-mono text-brand-300">{name}</div>
            <div className="text-xs text-slate-400">{why}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
