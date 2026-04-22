export default function Arquitectura() {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-semibold mb-3">Diagrama</h2>
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-6 overflow-x-auto">
          <pre className="text-xs text-slate-300 leading-relaxed">{`
 ┌────────────┐      ┌──────────────────┐      ┌──────────────────┐
 │  Navegador │──POST┤ Cloudflare Worker├──────┤  OpenAI Images   │
 │  (React)   │ JSON │   (proxy + auth) │ HTTPS│   gpt-image-1    │
 └─────┬──────┘      └─────────┬────────┘      └────────┬─────────┘
       │                        │                        │
       │  canvas: marcar       │  Authorization:         │  devuelve
       │  patente, overlay     │  Bearer <API KEY>       │  b64_json
       │  logo Americar        │  (secret en Worker)     │
       ▼                        ▼                        ▼
   Descarga JPG           CORS estricto             Edit + prompt
`}</pre>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Stack tecnológico</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <StackCard
            title="Frontend"
            items={[
              "React 18 + Vite",
              "TailwindCSS",
              "Canvas 2D API (overlay de logo)",
              "Hosteado en GitHub Pages",
            ]}
          />
          <StackCard
            title="Backend (proxy)"
            items={[
              "Cloudflare Workers (serverless)",
              "Secret binding para API key",
              "CORS restringido al dominio del frontend",
              "100k requests/día gratis",
            ]}
          />
          <StackCard
            title="IA"
            items={[
              "OpenAI gpt-image-1 (images.edit)",
              "Tamaños: 1024², 1536×1024, 1024×1536",
              "Calidad: low / medium / high",
              "Prompt versionado en el Worker",
            ]}
          />
          <StackCard
            title="Seguridad"
            items={[
              "API key nunca expuesta al navegador",
              "Rate limiting en Worker (opcional)",
              "Dominio allowlist en CORS",
              "HTTPS end-to-end",
            ]}
          />
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Por qué esta arquitectura</h2>
        <ul className="text-slate-300 space-y-2 list-disc pl-6">
          <li><strong>Separación cliente/servidor:</strong> la clave de OpenAI vive solo en el Worker.</li>
          <li><strong>Sin infra propia:</strong> ni servidores ni contenedores; todo serverless.</li>
          <li><strong>Cero vendor lock-in de UI:</strong> el frontend es HTML estático, fácil de migrar.</li>
          <li><strong>Costo plano:</strong> el único costo variable es OpenAI por imagen.</li>
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
