const STEPS = [
  {
    n: 1,
    title: "Subida",
    desc: "El usuario sube la foto desde el navegador. Se lee localmente; no se envía a ningún lado todavía.",
    tech: "File API · FileReader",
  },
  {
    n: 2,
    title: "Marcar patente",
    desc: "El usuario dibuja un rectángulo sobre la patente en un canvas. Se guardan coordenadas normalizadas.",
    tech: "Canvas 2D · mouse/touch events",
  },
  {
    n: 3,
    title: "Envío al Worker",
    desc: "La imagen se codifica en base64 y se postea al Cloudflare Worker junto con el tamaño de salida elegido.",
    tech: "fetch POST · JSON",
  },
  {
    n: 4,
    title: "Llamada a OpenAI",
    desc: "El Worker arma un multipart/form-data y llama a /v1/images/edits con gpt-image-1 y el prompt curado.",
    tech: "multipart · Bearer token",
  },
  {
    n: 5,
    title: "Post-proceso en cliente",
    desc: "Se recibe la imagen procesada, se dibuja en canvas y se superpone un cuadro blanco con el logo Americar sobre las coordenadas escaladas de la patente.",
    tech: "Canvas drawImage · roundRect",
  },
  {
    n: 6,
    title: "Exportación",
    desc: "El usuario descarga la imagen final en JPG optimizado, lista para subir al portal.",
    tech: "canvas.toDataURL(image/jpeg)",
  },
];

export default function Pipeline() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-1">Pipeline de procesamiento</h2>
        <p className="text-slate-400 text-sm">
          Cada foto atraviesa estos 6 pasos. Tiempo total estimado: 20–60 segundos.
        </p>
      </div>

      <ol className="space-y-4">
        {STEPS.map((s) => (
          <li key={s.n} className="rounded-xl bg-slate-900 border border-slate-800 p-5 flex gap-4">
            <div className="shrink-0 w-10 h-10 rounded-full bg-brand-500 text-slate-950 font-bold flex items-center justify-center">
              {s.n}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{s.title}</h3>
              <p className="text-slate-300 text-sm mt-1">{s.desc}</p>
              <p className="text-xs text-slate-500 mt-2 font-mono">{s.tech}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="rounded-xl bg-slate-900/60 border border-brand-700/40 p-5">
        <h3 className="font-semibold text-brand-300 mb-2">Prompt usado en gpt-image-1</h3>
        <pre className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
{`Transforma esta foto en una imagen profesional de catálogo automotriz.
- Limpieza: eliminar polvo, barro, manchas y reflejos sucios.
- Fondo: estudio virtual con piso reflectante y gradiente gris claro.
- Conservar: marca, modelo, color, ángulo y proporciones.
- Fotorrealista, sin texto, sin logos, sin marcas de agua.`}
        </pre>
      </div>
    </div>
  );
}
