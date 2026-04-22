export default function Arquitectura() {
  return (
    <div className="space-y-8">
      <section className="rounded-xl bg-brand-600/10 border border-brand-500/40 p-4 text-sm text-slate-200">
        <strong className="text-brand-300">Punto de integración único:</strong> Portal Americar →
        Formulario de Inspección → paso 10 <em>“Fotografías del Vehículo”</em>. El pipeline IA se
        activa al presionar <em>Guardar</em> y corre solo sobre la foto de publicación
        (<strong>Frente Derecho</strong>, ángulo fijo para toda la flota). El slot aparece destacado
        con el badge <em>★ Foto de publicación</em> en la UI del inspector.
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Diagrama</h2>
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-6 overflow-x-auto">
          <pre className="text-xs text-slate-300 leading-relaxed">{`
 ┌──────────────────────────────┐
 │   Portal Americar            │
 │   Formulario de Inspección   │
 │   ├─ …                       │
 │   ├─ 10. Fotografías (14)    │◄── único touchpoint
 │   │     └─ ★ Frente Derecho  │   foto de publicación
 │   └─ 11. Fotos adicionales   │
 └──────────────┬───────────────┘
                │  [Guardar inspección]
                ▼
 ┌──────────────────────────────┐
 │   Cloudflare Worker          │
 │   (orquestador del pipeline) │
 └──┬──────┬──────┬──────┬──────┘
    │      │      │      │
    ▼      ▼      ▼      ▼
 ┌────┐ ┌──────────┐ ┌─────────┐ ┌──────────┐
 │ 1. │ │ 2.       │ │ 3.      │ │ 4.       │
 │Cla │ │Segment.  │ │Inpaint  │ │Canvas    │
 │JSON│ │cutout    │ │IA masks │ │compose   │
 │    │ │(auto     │ │(sucio + │ │(fondo    │
 │    │ │preservado│ │reflejos)│ │+ auto +  │
 │    │ │1:1)      │ │         │ │sombra +  │
 │    │ │          │ │         │ │ patente) │
 └────┘ └──────────┘ └─────────┘ └──────────┘
   │         │           │            │
   ▼         ▼           ▼            ▼
 Anthropic remove.bg  gpt-image-1  Worker WASM
 Claude 4  type=car   images.edits  Sharp / Canvas
                      (con máscara)

                ▼
 ┌──────────────────────────────┐
 │   Portal Americar            │
 │   Aviso publicado            │  ◄── mismo auto, mismo lado, fondo studio
 └──────────────────────────────┘
`}</pre>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Stack tecnológico</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <StackCard
            title="Frontend (Portal Americar)"
            items={[
              "Sin UI nueva: se reutiliza paso 10 del formulario de inspección",
              "Slot Frente Derecho destacado con badge ★ Foto de publicación",
              "Al guardar, dispara POST al Worker con esa única foto",
              "Fallback: si el pipeline falla, queda la foto original en el aviso",
            ]}
          />
          <StackCard
            title="Backend (proxy)"
            items={[
              "Cloudflare Workers (serverless)",
              "Secret binding para claves OpenAI / Anthropic",
              "CORS restringido al dominio del Portal Americar",
              "1 llamada a Claude + 1 a gpt-image-1 por inspección",
            ]}
          />
          <StackCard
            title="IA / Visión"
            items={[
              "Claude Sonnet 4 — análisis factual (orientación, zonas sucias, patente)",
              "remove.bg — segmentación type=car: el auto sale 1:1 del fondo",
              "gpt-image-1 images.edits — inpainting acotado por máscaras",
              "Canvas / Sharp — compositing final en el Worker",
            ]}
          />
          <StackCard
            title="Seguridad"
            items={[
              "Claves de IA nunca expuestas al navegador",
              "Rate limiting + quota por inspector",
              "Dominio allowlist en CORS (solo portal.americar.tech)",
              "Auditoría: original + procesada + prompt guardados",
            ]}
          />
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Por qué esta arquitectura</h2>
        <ul className="text-slate-300 space-y-2 list-disc pl-6">
          <li><strong>Segmentación primero, IA después:</strong> imposible que el auto salga espejado, rotado o rejuvenecido — sus pixeles nunca pasan por un modelo generativo completo.</li>
          <li><strong>IA acotada a máscaras:</strong> gpt-image-1 solo ve y toca las zonas sucias, los reflejos y el fondo; el resto del auto permanece 1:1.</li>
          <li><strong>Cero cambios de flujo para el inspector:</strong> sigue cargando fotos en el paso 10 como hoy.</li>
          <li><strong>Un solo punto de disparo:</strong> al guardar la inspección; nada que pedir por fuera.</li>
          <li><strong>Separación cliente/servidor:</strong> las claves de OpenAI/Anthropic viven solo en el Worker.</li>
          <li><strong>Sin infra propia:</strong> ni servidores ni contenedores; todo serverless.</li>
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
