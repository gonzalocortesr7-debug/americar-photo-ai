export default function Arquitectura() {
  return (
    <div className="space-y-8">
      <section className="rounded-xl bg-brand-600/10 border border-brand-500/40 p-4 text-sm text-slate-200">
        <strong className="text-brand-300">Punto de integración único:</strong> micro-frontend{" "}
        <code className="text-brand-300">portal_mf_inspection</code> del backoffice Americar (paso 10 “Fotografías
        del Vehículo”). No se construye una app nueva ni un portal paralelo: se suma captura guiada con silueta
        sobre la cámara del teléfono y un disparador IA al guardar la inspección. El BFF existente{" "}
        <code>api.americar.tech</code> gana un único endpoint nuevo.
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Diagrama</h2>
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-6 overflow-x-auto">
          <pre className="text-xs text-slate-300 leading-relaxed">{`
 📱 Inspector en terreno (teléfono)
 │
 ▼
 ┌───────────────────────────────────────────┐
 │  Backoffice Americar — Module Federation  │
 │  shell: portal_mf_app                     │
 │  └─ MF: portal_mf_inspection              │
 │     (React 18 · RHF · Yup · HeroIcons)    │
 │                                           │
 │     Paso 10 · Fotografías del vehículo    │
 │     ├─ 14 slots (HOY: <input file>)       │
 │     ├─ + react-webcam + silueta SVG       │
 │     └─ ★ Frente Derecho = FOTO PUBLICACIÓN│
 └──────────────┬────────────────────────────┘
                │  [Guardar inspección]
                │  POST /inspection/:id/publication-photo
                ▼
 ┌───────────────────────────────────────────┐
 │  BFF · api.americar.tech                  │
 │  (nuevo endpoint orquestador)             │
 └──────────────┬────────────────────────────┘
                │
                ▼
 ┌───────────────────────────────────────────┐
 │  Cloudflare Worker — pipeline IA          │
 │  1. Claude Sonnet 4 → JSON factual        │
 │  2. remove.bg type=car → cutout 1:1       │
 │  3. Nano Banana (Gemini) → correcciones   │
 │     acotadas por máscara                  │
 │  4. Canvas compose → estudio + sombra     │
 │  5. Overlay patente + logo                │
 └──────────────┬────────────────────────────┘
                │
                ▼
 ┌───────────────────────────────────────────┐
 │  Storage del portal (R2 / S3)             │
 │  Aviso publicable con foto procesada      │
 └───────────────────────────────────────────┘
`}</pre>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Integración con el stack existente</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <StackCard
            title="Dentro del MF portal_mf_inspection"
            items={[
              "Se respeta: React 18, React Hook Form, Yup, HeroIcons v2, clsx, CSS Modules, Webpack Module Federation",
              "Se suma: react-webcam + @tanstack/react-query + browser-image-compression + @sentry/react",
              "Slot ★ Frente Derecho destacado con badge como foto de publicación",
              "Al guardar, dispara un único POST al BFF; resto del flujo igual que hoy",
            ]}
          />
          <StackCard
            title="Backend / BFF"
            items={[
              "Endpoint nuevo: POST /inspection/:id/publication-photo",
              "Orquesta al Worker Cloudflare (proxy + pipeline IA)",
              "Webhook de estado: pending → processing → done → error",
              "Storage: foto procesada reemplaza la principal del aviso; las 13 restantes intactas",
            ]}
          />
          <StackCard
            title="Pipeline IA (Cloudflare Worker)"
            items={[
              "Claude Sonnet 4 — análisis factual: lado visible, wear a preservar, patente",
              "remove.bg (type=car) — cutout pixel-perfect del auto",
              "Nano Banana (Google Gemini image generation) — correcciones acotadas por máscara",
              "Canvas / Sharp @ Worker — compositing del estudio virtual y overlay de patente",
            ]}
          />
          <StackCard
            title="Captura guiada (UX móvil)"
            items={[
              "Stream de cámara con react-webcam dentro del MF",
              "Silueta SVG del ángulo por slot superpuesta (como face-ID pero vehicular)",
              "14 siluetas: frente, frente 3/4 izq/der, laterales, posteriores, llantas, tablero, panel",
              "Validación de encuadre básica antes de aceptar la toma",
            ]}
          />
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Por qué esta arquitectura</h2>
        <ul className="text-slate-300 space-y-2 list-disc pl-6">
          <li><strong>Cero disrupción para el inspector:</strong> sigue usando el mismo backoffice en el mismo teléfono. Solo aparece la silueta de encuadre y el badge de la foto de publicación.</li>
          <li><strong>Compatibilidad con Module Federation:</strong> todas las libs nuevas se bundlean dentro del MF sin tocar el shell.</li>
          <li><strong>Segmentación primero, IA después:</strong> los pixeles del auto se preservan 1:1 vía cutout. Nano Banana solo toca lo enmascarado. Imposible mirror o rejuvenecimiento.</li>
          <li><strong>Nano Banana como editor IA:</strong> preserva identidad del sujeto mejor que alternativas y soporta ediciones localizadas por máscara.</li>
          <li><strong>Un solo nuevo endpoint en el BFF:</strong> mínimo cambio en <code>api.americar.tech</code>.</li>
          <li><strong>Fallback seguro:</strong> si el pipeline IA falla, la foto original del slot Frente Derecho es la que queda en el aviso.</li>
        </ul>
      </section>
    </div>
  );
}

function StackCard({ title, items }) {
  return (
    <div className="rounded-xl bg-slate-900 border border-slate-800 p-5">
      <h3 className="font-semibold text-brand-300 mb-2">{title}</h3>
      <ul className="text-sm text-slate-300 space-y-1 list-disc pl-4">
        {items.map((i) => <li key={i}>{i}</li>)}
      </ul>
    </div>
  );
}
