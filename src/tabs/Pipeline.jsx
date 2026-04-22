const STEPS = [
  {
    n: 0,
    title: "Captura guiada en el paso 10 (teléfono del inspector)",
    desc: "En cada uno de los 14 slots, la cámara del teléfono muestra una silueta SVG del ángulo esperado superpuesta al stream (estilo verificación facial pero vehicular). El inspector alinea el auto, dispara, y revisa el preview. El slot ★ Frente Derecho queda destacado como FOTO DE PUBLICACIÓN.",
    tech: "react-webcam · silhouette overlay · browser-image-compression",
  },
  {
    n: 1,
    title: "Trigger: inspector guarda la inspección",
    desc: "El inspector termina el formulario y presiona Guardar. El MF dispara un POST al BFF con la foto de publicación (Frente Derecho) + metadata mínima. Las otras 13 fotos quedan intactas como respaldo.",
    tech: "portal_mf_inspection → POST /inspection/:id/publication-photo",
  },
  {
    n: 2,
    title: "Análisis con Claude Sonnet 4",
    desc: "Claude inspecciona la foto y devuelve JSON factual: lado visible del auto (ej. 'front-right 3/4, faro derecho del conductor en el centro del encuadre'), zonas sucias, reflejos parásitos, ubicación exacta de la patente, rayones/chips/desgaste que DEBEN preservarse. No genera prompt libre.",
    tech: "Anthropic · messages + vision → JSON",
  },
  {
    n: 3,
    title: "Segmentación: cutout pixel-perfect",
    desc: "El auto se recorta del fondo con remove.bg (type=car, full resolution). Los pixeles del vehículo se preservan 1:1 — misma orientación, mismo lado, mismos rayones, mismas llantas. Aquí se garantiza que no haya mirror ni rotación.",
    tech: "remove.bg · type=car (full resolution)",
  },
  {
    n: 4,
    title: "Correcciones con Nano Banana (Gemini)",
    desc: "Con las máscaras de Claude, Nano Banana hace ediciones locales dentro del cutout: quita el barro de las llantas, el polvo del capó, los reflejos parásitos, y corrige la iluminación. Nano Banana preserva identidad del sujeto mejor que alternativas generativas; solo toca lo enmascarado.",
    tech: "Google Gemini 2.5 Flash Image · edits con mask",
  },
  {
    n: 5,
    title: "Compositing: auto limpio sobre cabina virtual",
    desc: "En canvas se compone: fondo de estudio (cyclorama gris claro + piso reflectante) + auto recortado + sombra bajo el vehículo + balance final de iluminación. El auto nunca se regenera: se pega.",
    tech: "WASM Canvas · Sharp @ Worker",
  },
  {
    n: 6,
    title: "Overlay de patente",
    desc: "Sobre la imagen ya compuesta se dibuja un cuadro oscuro con el texto/logo Americar en las coordenadas detectadas por Claude.",
    tech: "Canvas drawImage + roundRect",
  },
  {
    n: 7,
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
          Captura guiada en el teléfono + pipeline IA disparado al <strong className="text-brand-300">guardar
          la inspección</strong>, sobre una única foto: la marcada con ★ <strong>Foto de publicación</strong> (Frente
          Derecho, ángulo fijo para toda la flota). Tiempo estimado: 30–60 segundos.
        </p>
      </div>

      <div className="rounded-xl bg-brand-600/10 border border-brand-500/40 p-4 text-sm text-slate-200">
        <strong className="text-brand-300">Principio del pipeline:</strong> segmentación primero, IA después. Los pixeles del
        auto se preservan 1:1 mediante cutout; la IA generativa (Nano Banana) solo interviene dentro de máscaras puntuales
        (suciedad, reflejos) y sobre el fondo. De esta forma es <strong>imposible</strong> que el auto salga espejado,
        rotado o rejuvenecido.
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
        <h3 className="font-semibold text-brand-300 mb-2">Por qué Nano Banana</h3>
        <ul className="text-sm text-slate-300 space-y-1.5 list-disc pl-5">
          <li><strong>Preservación de identidad</strong> del sujeto superior a gpt-image-1 y SDXL para ediciones locales.</li>
          <li><strong>Soporte nativo de máscaras</strong> para inpainting acotado: solo toca las zonas marcadas.</li>
          <li><strong>Fidelidad fotorrealista</strong> alta sin “estética 3D” que rejuvenece al auto.</li>
          <li><strong>Costo y latencia</strong> competitivos para un pipeline disparado una vez por inspección.</li>
        </ul>
      </div>

      <div className="rounded-xl bg-slate-900/60 border border-brand-700/40 p-5">
        <h3 className="font-semibold text-brand-300 mb-2">Garantías del pipeline</h3>
        <ul className="text-sm text-slate-300 space-y-1.5 list-disc pl-5">
          <li><strong>Orientación preservada:</strong> si entra Frente Derecho, sale Frente Derecho — no hay paso generativo que pueda reflejarla.</li>
          <li><strong>Auto usado sigue siendo usado:</strong> rayones, chips y desgaste de llantas quedan porque nadie los toca.</li>
          <li><strong>IA acotada:</strong> Nano Banana solo trabaja dentro de máscaras de suciedad/reflejos y sobre el fondo. Nunca sobre la silueta completa del auto.</li>
          <li><strong>Fallback:</strong> si algún paso falla, la foto original del inspector es la que se publica.</li>
        </ul>
      </div>
    </div>
  );
}
