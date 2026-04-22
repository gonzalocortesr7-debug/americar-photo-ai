const STEPS = [
  {
    n: 0,
    title: "Trigger: inspector guarda la inspección",
    desc: "El inspector termina el paso 10 y presiona Guardar. El portal toma la foto marcada como ★ Foto de publicación (Frente Derecho, ángulo fijo para toda la flota) y encola el job. Las otras 13 fotos quedan intactas.",
    tech: "Portal Americar · POST /inspections/:id/publication-photo",
  },
  {
    n: 1,
    title: "Análisis con Claude Sonnet 4",
    desc: "Claude inspecciona la foto y devuelve JSON factual: lado visible del auto (ej. 'front-left 3/4, faro conductor a la derecha del encuadre'), zonas sucias, reflejos parásitos, ubicación exacta de la patente, rayones/chips/desgaste que DEBEN preservarse. No genera prompt libre — solo describe lo que ve.",
    tech: "Anthropic · messages + vision → JSON",
  },
  {
    n: 2,
    title: "Segmentación: cutout pixel-perfect del auto",
    desc: "El auto se recorta del fondo con segmentación (remove.bg con type=car, o modelo equivalente). Los pixeles del vehículo se preservan 1:1 — misma orientación, mismo lado, mismos rayones, mismas llantas. Aquí se garantiza que no haya mirror ni rotación.",
    tech: "remove.bg · type=car (full resolution)",
  },
  {
    n: 3,
    title: "Inpainting IA SOLO en zonas sucias/reflejos",
    desc: "Con las máscaras que devuelve Claude, se hace inpainting puntual dentro del cutout del auto: se quita el barro en las llantas, el polvo del capó, el reflejo del sol en el techo. La IA solo toca las áreas enmascaradas; el resto del auto queda intacto.",
    tech: "gpt-image-1 · images.edits + mask",
  },
  {
    n: 4,
    title: "Compositing: auto limpio sobre cabina virtual",
    desc: "En canvas se compone: fondo de estudio (cyclorama gris claro + piso reflectante) + auto recortado + sombra bajo el vehículo + corrección de iluminación global. El auto nunca se regenera — se pega.",
    tech: "WASM Canvas · Sharp @ Worker",
  },
  {
    n: 5,
    title: "Overlay de patente",
    desc: "Sobre la imagen ya compuesta, se dibuja un cuadro oscuro con el texto/logo Americar en las coordenadas que Claude detectó para la patente.",
    tech: "Canvas drawImage + roundRect",
  },
  {
    n: 6,
    title: "Devolución al portal",
    desc: "La foto procesada se persiste como imagen principal del aviso; las 13 fotos restantes quedan como galería secundaria sin procesar. Webhook de estado: pending → processing → done → error.",
    tech: "R2 / S3 · webhook por inspección",
  },
];

export default function Pipeline() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-1">Pipeline de procesamiento</h2>
        <p className="text-slate-400 text-sm">
          Disparado al <strong className="text-brand-300">guardar la inspección</strong> sobre una única foto: la
          marcada con ★ <strong>Foto de publicación</strong> (Frente Derecho, ángulo fijo para toda la flota).
          Tiempo estimado: 30–60 segundos.
        </p>
      </div>

      <div className="rounded-xl bg-brand-600/10 border border-brand-500/40 p-4 text-sm text-slate-200">
        <strong className="text-brand-300">Principio del pipeline:</strong> segmentación primero, IA después. Los pixeles del
        auto se preservan 1:1 mediante cutout; la IA generativa solo interviene dentro de máscaras puntuales (suciedad, reflejos)
        y sobre el fondo. De esta forma es <strong>imposible</strong> que el auto salga espejado, rotado o rejuvenecido.
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
        <h3 className="font-semibold text-brand-300 mb-2">Garantías del pipeline</h3>
        <ul className="text-sm text-slate-300 space-y-1.5 list-disc pl-5">
          <li><strong>Orientación preservada:</strong> si entra Frente Derecho, sale Frente Derecho — no hay paso generativo que pueda reflejarla.</li>
          <li><strong>Auto usado sigue siendo usado:</strong> rayones, chips y desgaste de llantas quedan porque nadie los toca.</li>
          <li><strong>IA acotada:</strong> solo inpainting dentro de máscaras de suciedad/reflejos y fondo. Nunca sobre la silueta completa del auto.</li>
          <li><strong>Fallback:</strong> si algún paso falla, la foto original del inspector es la que se publica.</li>
        </ul>
      </div>
    </div>
  );
}
