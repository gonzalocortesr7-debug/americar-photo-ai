import { useEffect, useRef, useState } from "react";

// Supuestos de costo para el modo IA (tope alto de referencia).
// Una pasada por frame con Claude + Nano Banana ≈ $0.052; con remove.bg volumen ≈ $0.122.
const FRAMES_STD = 24;
const FRAMES_HIGH = 36;
const PER_FRAME_RAW = 0;
const PER_FRAME_IA = 0.122;
const MONTHLY_VOL = 3000;
const USD_TO_CLP = 960;

function usd(v, d = 2) { return "$" + v.toFixed(d) + " USD"; }
function clp(v) { return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(v); }

export default function Spin360() {
  return (
    <div className="space-y-8">
      <section className="rounded-xl bg-brand-600/10 border border-brand-500/40 p-4 text-sm text-slate-200">
        <strong className="text-brand-300">Qué es:</strong> vista 360° del vehículo embebida en el aviso — el
        visitante arrastra con el dedo y el auto gira como en el showroom. Es la experiencia distintiva de
        <strong> SpinCar (hoy Impel)</strong>. La replicamos dentro del mismo MF{" "}
        <code className="text-brand-300">portal_mf_inspection</code>, sin depender de Impel y con control
        total del pipeline.
      </section>

      <div>
        <h2 className="text-2xl font-semibold mb-1">Experiencia 360°</h2>
        <p className="text-slate-400 text-sm">
          Captura guiada por gyroscope del teléfono durante la inspección + viewer JS embebido en el aviso
          publicado. Diseñada como extensión opcional a la foto de publicación.
        </p>
      </div>

      <section>
        <h3 className="text-lg font-semibold text-brand-300 mb-3">1 · Captura en el paso 10</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-3">
            <h4 className="font-semibold">Flujo del inspector</h4>
            <ol className="text-sm text-slate-300 list-decimal pl-5 space-y-1">
              <li>Toca el botón <em>Spin 360°</em> (nuevo slot en el paso 10).</li>
              <li>La cámara se abre con un <strong>anillo de progreso</strong> que marca 0° → 360°.</li>
              <li>Camina alrededor del auto a paso lento (≈ 30–45 s).</li>
              <li>El teléfono dispara un frame cada ~10° usando el <strong>gyroscope (DeviceOrientation API)</strong>.</li>
              <li>Se capturan 24 frames (estándar) o 36 (premium). Preview inmediato del spin.</li>
              <li>El inspector puede repetir si el anillo quedó incompleto.</li>
            </ol>
          </div>
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-3">
            <h4 className="font-semibold">Stack</h4>
            <ul className="text-sm text-slate-300 list-disc pl-5 space-y-1">
              <li><code>react-webcam</code> — stream de cámara ya previsto en la propuesta</li>
              <li><code>DeviceOrientationEvent</code> + permission API (iOS requiere handshake explícito)</li>
              <li><code>browser-image-compression</code> — cada frame baja a ~180 KB antes del upload</li>
              <li>Upload en paralelo (pool de 4 conexiones) al BFF</li>
              <li>Fallback manual: si no hay sensor, se captura con timer + guía visual</li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-brand-300 mb-3">2 · Dos modos posibles</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <ModeCard
            recommended
            title="Modo A — Raw frames + hero procesado"
            pitch="Spin con los 24-36 frames originales + la foto de publicación pasa por IA como hoy."
            pros={[
              "Costo IA igual al actual (solo 1 foto procesada por inspección)",
              "Rápido de implementar: viewer JS estándar + upload múltiple al BFF",
              "El 'hero' del aviso sigue luciendo estudio-grade",
              "La experiencia 360 ya diferencia frente a listados sin spin",
            ]}
            cons={[
              "Los 24-36 frames mantienen fondo original (taller, calle) — no estudio",
              "Si el inspector capturó con mala luz, el spin se ve mediocre",
            ]}
            costLabel="Costo IA adicional"
            costValue={0}
            costMonthly={0}
          />
          <ModeCard
            title="Modo B — 360 full IA (paridad Impel)"
            pitch="Cada frame del spin pasa por el pipeline Claude + Nano Banana + remove.bg para fondo studio."
            pros={[
              "Paridad visual total con SpinCar/Impel",
              "Branding consistente: todo el giro sobre cyclorama gris y piso reflectante",
              "Diferenciador premium vs. listados de la competencia",
            ]}
            cons={[
              "Escala lineal de costo: 24-36 llamadas IA por inspección",
              "Latencia mayor (2-5 min procesando en el Worker post-Guardar)",
              "Frames deben estar bien alineados o el spin se 'salta'",
            ]}
            costLabel="Costo IA adicional por inspección (24 frames)"
            costValue={FRAMES_STD * PER_FRAME_IA}
            costMonthly={FRAMES_STD * PER_FRAME_IA * MONTHLY_VOL}
          />
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-brand-300 mb-3">Demo en vivo</h3>
        <p className="text-sm text-slate-400 mb-4">
          Arrastrá con el mouse (o deslizá con el dedo) sobre la imagen para girar el auto. Cargá 24-36 fotos
          secuenciales ordenadas por nombre (<code>01.jpg</code>, <code>02.jpg</code>, …) para probar con un
          auto real; mientras no cargues nada, corre una secuencia sintética de referencia.
        </p>
        <SpinViewerDemo />

        <div className="grid md:grid-cols-2 gap-3 mt-4">
          <RefLink
            name="@cloudimage/360-view — demo oficial"
            url="https://scaleflex.github.io/js-cloudimage-360-view/"
            body="Viewer JS recomendado funcionando con autos reales. Es exactamente el tipo de experiencia que embedaremos en el aviso."
          />
          <RefLink
            name="SpinCar / Impel — ejemplo público en VDP"
            url="https://www.spincar.com/inventory/?demo=used"
            body="Referencia comercial. Cada ficha tiene el spin activo arriba de la galería — nuestro modo B apunta a paridad visual con esto."
          />
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-brand-300 mb-3">Qué fotografía necesitás para producir un spin</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-5">
            <h4 className="font-semibold mb-3">Checklist de captura</h4>
            <ul className="text-sm text-slate-300 space-y-2">
              {CAPTURE_CHECKLIST.map((i) => (
                <li key={i.k} className="flex gap-3">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-brand-500 text-slate-950 text-[11px] font-bold flex items-center justify-center">✓</span>
                  <div>
                    <div className="font-semibold text-slate-200">{i.k}</div>
                    <div className="text-xs text-slate-400">{i.v}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-5">
            <h4 className="font-semibold mb-3">Errores que rompen el spin</h4>
            <ul className="text-sm text-slate-300 space-y-2">
              {PITFALLS.map((i) => (
                <li key={i} className="flex gap-3">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-red-500/80 text-white text-[11px] font-bold flex items-center justify-center">✗</span>
                  <span className="text-xs text-slate-300">{i}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-4 rounded-xl bg-brand-600/10 border border-brand-500/40 p-4 text-xs text-slate-200 leading-relaxed">
          <strong className="text-brand-300">Atajo para el piloto:</strong> si querés una muestra rápida sin
          esperar la integración, tomá un auto de la flota de Americar, colocalo en zona con sombra uniforme y
          piso plano, parate a ~2.5 m, y caminá alrededor disparando una foto cada paso y medio (≈ 15°).
          24 fotos JPG numeradas <code>01.jpg</code>→<code>24.jpg</code> alcanzan para armar el primer spin en
          el viewer de arriba.
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-brand-300 mb-3">3 · Viewer embebido en el aviso</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <ViewerCard
            name="@cloudimage/360-view"
            license="MIT"
            body="Viewer JS liviano (~15 KB). Acepta una secuencia de URLs ordenadas y soporta drag horizontal + autoplay. Ideal para el aviso público."
            fit="★ Recomendado"
          />
          <ViewerCard
            name="panolens.js / three.js"
            license="MIT"
            body="Si se quisiera ampliar a panoramas interiores (360° del habitáculo) o hotspots (marcadores de features). Más peso pero mucha flexibilidad."
            fit="Para interior / hotspots"
          />
          <ViewerCard
            name="Componente custom"
            license="—"
            body="Array de 24-36 <img>, una sola visible a la vez, mousemove/touchmove cambia el índice. 50 líneas de React. Máximo control, cero dependencias."
            fit="Para control absoluto"
          />
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-brand-300 mb-3">4 · Costos a volumen Americar (3.000 insp./mes)</h3>
        <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500 bg-slate-950">
              <tr>
                <th className="text-left px-4 py-3">Modo</th>
                <th className="text-left px-4 py-3">Frames</th>
                <th className="text-right px-4 py-3">IA por inspección</th>
                <th className="text-right px-4 py-3">Mensual (3.000)</th>
                <th className="text-right px-4 py-3">Anual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              <tr className="bg-brand-500/5">
                <td className="px-4 py-3 font-semibold text-slate-200">A · Raw + hero procesado <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-brand-500 text-slate-950">RECOMENDADO</span></td>
                <td className="px-4 py-3 text-slate-300">24 ó 36 raw</td>
                <td className="px-4 py-3 text-right font-mono text-slate-300">$0 (ya incluido en hero)</td>
                <td className="px-4 py-3 text-right font-mono text-slate-300">$0</td>
                <td className="px-4 py-3 text-right font-mono text-slate-300">$0</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-200">B · 360 full IA (24 frames)</td>
                <td className="px-4 py-3 text-slate-300">24 procesados</td>
                <td className="px-4 py-3 text-right font-mono text-slate-300">{usd(FRAMES_STD * PER_FRAME_IA)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="font-mono text-slate-200">{usd(FRAMES_STD * PER_FRAME_IA * MONTHLY_VOL, 0)}</div>
                  <div className="text-xs text-slate-500">{clp(FRAMES_STD * PER_FRAME_IA * MONTHLY_VOL * USD_TO_CLP)}</div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="font-mono text-slate-200">{usd(FRAMES_STD * PER_FRAME_IA * MONTHLY_VOL * 12, 0)}</div>
                  <div className="text-xs text-slate-500">{clp(FRAMES_STD * PER_FRAME_IA * MONTHLY_VOL * 12 * USD_TO_CLP)}</div>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-200">B · 360 full IA (36 frames)</td>
                <td className="px-4 py-3 text-slate-300">36 procesados</td>
                <td className="px-4 py-3 text-right font-mono text-slate-300">{usd(FRAMES_HIGH * PER_FRAME_IA)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="font-mono text-slate-200">{usd(FRAMES_HIGH * PER_FRAME_IA * MONTHLY_VOL, 0)}</div>
                  <div className="text-xs text-slate-500">{clp(FRAMES_HIGH * PER_FRAME_IA * MONTHLY_VOL * USD_TO_CLP)}</div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="font-mono text-slate-200">{usd(FRAMES_HIGH * PER_FRAME_IA * MONTHLY_VOL * 12, 0)}</div>
                  <div className="text-xs text-slate-500">{clp(FRAMES_HIGH * PER_FRAME_IA * MONTHLY_VOL * 12 * USD_TO_CLP)}</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          El costo por frame ($0.122) asume el escenario <em>Producción con volumen</em> del tab Costos.
          A 3.000 inspecciones/mes el Modo B supera al costo de Impel ({clp(4200 * USD_TO_CLP)}/mes) — solo tiene
          sentido si el engagement del spin full-IA genera uplift de conversión medible. El Modo A (raw)
          conserva el ahorro de ~91% vs. Impel y ya da diferenciación visual significativa.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-brand-300 mb-3">5 · Integración al aviso</h3>
        <ul className="text-slate-300 space-y-2 list-disc pl-6 text-sm">
          <li>El BFF gana un endpoint <code>POST /inspection/:id/spin</code> que recibe los N frames y devuelve el id del spin.</li>
          <li>Storage: los frames viven en R2/S3 con prefijo <code>inspection/{"{id}"}/spin/frame_NN.jpg</code>.</li>
          <li>El VDP (ficha del aviso) embeda el viewer JS con la lista de URLs. Lazy load — solo se descarga al interactuar.</li>
          <li>Fallback: si el spin no existe, el aviso muestra solo la foto de publicación como hoy. Cero riesgo para avisos actuales.</li>
          <li>Analytics: tracking de interacciones con el spin (engagement), importante para medir conversión vs. Impel.</li>
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-brand-300 mb-3">6 · Cuándo encarar cada modo</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <Phase
            title="Fase 6 — Spin 360 Raw (siguiente al MVP)"
            items={[
              "Componente de captura con gyroscope + anillo de progreso",
              "Upload paralelo de 24 frames al BFF",
              "Viewer @cloudimage/360-view en el aviso",
              "Cero impacto en costo IA",
              "Timeline: 4-6 semanas después del launch",
            ]}
          />
          <Phase
            title="Fase 7 — Spin 360 Full IA (si el engagement justifica)"
            items={[
              "Pipeline batch: cada frame pasa por Claude + remove.bg + Nano Banana",
              "Concurrencia controlada en el Worker (pool de 8)",
              "Validación de consistencia entre frames (mismo fondo, misma luz)",
              "Activar solo si vemos uplift medible vs. Modo A",
              "Timeline: decisión basada en métricas post-lanzamiento",
            ]}
          />
        </div>
      </section>
    </div>
  );
}

const CAPTURE_CHECKLIST = [
  { k: "24 o 36 frames en orden", v: "24 frames = 1 foto cada 15° · 36 frames = 1 foto cada 10°. Nombres numerados secuenciales (01.jpg → 24.jpg) — el viewer ordena por nombre." },
  { k: "Distancia constante al auto", v: "2.5 a 3 m. Si te alejás o acercás el auto cambia de tamaño entre frames y el spin 'late'." },
  { k: "Altura de cámara fija", v: "≈1.5 m, al centro vertical del auto. Idealmente cámara del teléfono a la altura del espejo lateral." },
  { k: "Mismo encuadre en todos los frames", v: "El auto ocupa el mismo % del cuadro de punta a punta (≈85% del ancho). Sin zoom ni recorte entre frames." },
  { k: "Iluminación difusa", v: "Sombra uniforme, interior de galpón o día nublado. El sol directo mueve reflejos y hotspots entre frames y el spin se ve nervioso." },
  { k: "Piso plano y limpio", v: "Sin charcos ni desniveles. Idealmente cemento gris neutro o asfalto parejo." },
  { k: "Paso constante", v: "Caminar a velocidad pareja y disparar en cada paso (o usar el modo auto-capture del SDK en producción)." },
  { k: "Cerrar el loop", v: "El frame final debe quedar casi idéntico al inicial para que el giro sea continuo. Si el 24 no cierra con el 01, el viewer corta feo." },
];

const PITFALLS = [
  "Moverse más rápido de un lado que del otro — ángulos desiguales, el auto 'salta'.",
  "Cambiar el zoom o acercarse en un frame para 'mostrar un detalle'.",
  "Sol directo con nubes pasando — luz inconsistente entre frames.",
  "Personas u obstáculos apareciendo en algunos frames (hay que re-hacer el spin).",
  "Orientación del teléfono inconsistente (rotar de vertical a horizontal).",
  "Perder frames y rellenar con duplicados — el spin se atasca visiblemente.",
];

function SpinViewerDemo() {
  const SYNTHETIC = 24;
  const [frames, setFrames] = useState(null); // array of objectURLs when user uploads
  const [idx, setIdx] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const containerRef = useRef(null);
  const dragStart = useRef(null);

  useEffect(() => {
    if (!autoplay || frames) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % SYNTHETIC), 80);
    return () => clearInterval(id);
  }, [autoplay, frames]);

  const total = frames ? frames.length : SYNTHETIC;

  const onFiles = (e) => {
    const list = Array.from(e.target.files || []);
    if (list.length < 8) { alert("Subí al menos 8 fotos para armar un spin."); return; }
    list.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    const urls = list.map((f) => URL.createObjectURL(f));
    setFrames(urls);
    setIdx(0);
    setAutoplay(false);
  };

  const reset = () => {
    if (frames) frames.forEach((u) => URL.revokeObjectURL(u));
    setFrames(null); setIdx(0); setAutoplay(true);
  };

  const onPointerDown = (e) => {
    setAutoplay(false);
    dragStart.current = { x: e.clientX ?? e.touches?.[0]?.clientX ?? 0, idx };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!dragStart.current || !containerRef.current) return;
    const x = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const delta = x - dragStart.current.x;
    const w = containerRef.current.clientWidth || 500;
    const steps = Math.round((delta / w) * total);
    const next = ((dragStart.current.idx - steps) % total + total) % total;
    setIdx(next);
  };
  const onPointerUp = () => { dragStart.current = null; };

  return (
    <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
      <div
        ref={containerRef}
        className="relative bg-slate-950 aspect-[16/9] touch-none select-none cursor-grab active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {frames ? (
          <img src={frames[idx]} alt="" className="w-full h-full object-contain pointer-events-none" />
        ) : (
          <SyntheticFrame angle={(idx / SYNTHETIC) * 360} />
        )}
        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-3 text-xs text-slate-300">
          <span className="px-2 py-1 rounded bg-slate-900/80 border border-slate-700 font-mono">
            Frame {idx + 1} / {total}
          </span>
          <div className="flex-1 h-1 bg-slate-800 rounded overflow-hidden">
            <div className="h-full bg-brand-500 transition-all" style={{ width: `${((idx + 1) / total) * 100}%` }} />
          </div>
          <span className="text-slate-500">{frames ? "(tus fotos)" : "demo sintética"}</span>
        </div>
      </div>

      <div className="p-4 flex flex-wrap gap-3 items-center justify-between">
        <label className="text-sm">
          <span className="text-slate-400 mr-2">Cargá 24–36 fotos numeradas:</span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={onFiles}
            className="text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-brand-500 file:text-white file:font-semibold hover:file:bg-brand-600"
          />
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => setAutoplay((a) => !a)}
            className="text-xs border border-slate-700 hover:border-brand-500 text-slate-300 px-3 py-1.5 rounded"
          >
            {autoplay ? "⏸ Pausar" : "▶ Auto-play"}
          </button>
          {frames && (
            <button onClick={reset} className="text-xs border border-slate-700 hover:border-brand-500 text-slate-300 px-3 py-1.5 rounded">
              Volver a demo sintética
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SyntheticFrame({ angle }) {
  // Vehículo sintético en SVG que gira según el ángulo — solo para ilustrar el giro; no es una foto real.
  const rad = (angle * Math.PI) / 180;
  const skew = Math.sin(rad) * 30;
  const scale = 0.75 + Math.abs(Math.cos(rad)) * 0.25;
  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg viewBox="0 0 400 180" className="w-5/6 h-5/6">
        <defs>
          <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
        </defs>
        <rect x="0" y="120" width="400" height="60" fill="url(#floor)" />
        <g transform={`translate(200 110) scale(${scale} 1) skewX(${skew * 0.3}) translate(-200 -110)`}>
          <path
            d="M60 120 Q 80 70 140 60 L 260 55 Q 320 60 340 120 Z"
            fill="#0d9488"
            stroke="#14b8a6"
            strokeWidth="2"
          />
          <path d="M140 60 L 170 30 L 230 28 L 260 55" fill="#0f766e" stroke="#14b8a6" strokeWidth="2" />
          <circle cx={110 + skew * 0.2} cy="125" r="14" fill="#0f172a" stroke="#14b8a6" strokeWidth="2" />
          <circle cx={290 + skew * 0.2} cy="125" r="14" fill="#0f172a" stroke="#14b8a6" strokeWidth="2" />
          <ellipse cx={200 + skew * 0.5} cy="138" rx="120" ry="6" fill="rgba(20,184,166,0.2)" />
        </g>
        <text x="200" y="170" textAnchor="middle" className="text-xs" fill="#64748b" fontSize="10">
          Demo sintética — arrastrá para girar · ángulo {Math.round(angle)}°
        </text>
      </svg>
    </div>
  );
}

function RefLink({ name, url, body }) {
  return (
    <a href={url} target="_blank" rel="noreferrer" className="block rounded-xl bg-slate-900 border border-slate-800 hover:border-brand-500/60 p-4 transition">
      <div className="flex items-center justify-between">
        <code className="text-brand-300 text-sm">{name}</code>
        <span className="text-xs text-slate-500">↗</span>
      </div>
      <p className="text-xs text-slate-400 leading-relaxed mt-2">{body}</p>
    </a>
  );
}

function ModeCard({ title, pitch, pros, cons, costLabel, costValue, costMonthly, recommended }) {
  return (
    <div className={"rounded-xl p-5 border " + (recommended ? "bg-brand-500/10 border-brand-500 ring-2 ring-brand-500/30" : "bg-slate-900 border-slate-800")}>
      <div className="flex items-center gap-2 mb-2">
        <h4 className="font-semibold text-slate-100">{title}</h4>
        {recommended && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-500 text-slate-950">★ RECOMENDADO</span>}
      </div>
      <p className="text-sm text-slate-300 mb-3">{pitch}</p>
      <div className="text-xs text-slate-500 uppercase tracking-wider">A favor</div>
      <ul className="text-xs text-slate-300 list-disc pl-5 mt-1 space-y-0.5">
        {pros.map((p) => <li key={p}>{p}</li>)}
      </ul>
      <div className="text-xs text-slate-500 uppercase tracking-wider mt-3">En contra</div>
      <ul className="text-xs text-slate-400 list-disc pl-5 mt-1 space-y-0.5">
        {cons.map((c) => <li key={c}>{c}</li>)}
      </ul>
      <div className="mt-3 pt-3 border-t border-slate-800">
        <div className="text-xs text-slate-500 uppercase tracking-wider">{costLabel}</div>
        <div className="text-2xl font-bold text-brand-300 mt-1">{usd(costValue, costValue > 0 ? 3 : 0)}</div>
        {costMonthly > 0 && (
          <div className="text-xs text-slate-400 mt-1">
            Mensual a 3.000 insp.: <span className="font-mono text-slate-200">{usd(costMonthly, 0)}</span> · <span className="font-mono">{clp(costMonthly * USD_TO_CLP)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function ViewerCard({ name, license, body, fit }) {
  return (
    <div className="rounded-xl bg-slate-900 border border-slate-800 p-4">
      <div className="flex items-center justify-between mb-2">
        <code className="text-brand-300 text-sm">{name}</code>
        <span className="text-[10px] font-mono text-slate-500">{license}</span>
      </div>
      <p className="text-xs text-slate-400 leading-relaxed">{body}</p>
      <div className="text-[11px] text-brand-400 mt-3 font-semibold">{fit}</div>
    </div>
  );
}

function Phase({ title, items }) {
  return (
    <div className="rounded-xl bg-slate-900 border border-slate-800 p-4">
      <h4 className="font-semibold text-slate-100 mb-2">{title}</h4>
      <ul className="text-sm text-slate-300 list-disc pl-5 space-y-1">
        {items.map((i) => <li key={i}>{i}</li>)}
      </ul>
    </div>
  );
}
