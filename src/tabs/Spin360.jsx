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
          Si se sube a 36 frames, el ticket mensual en modo B ronda los {clp(FRAMES_HIGH * PER_FRAME_IA * MONTHLY_VOL * USD_TO_CLP)} — aún por debajo del costo mensual de Impel ({clp(4200 * USD_TO_CLP)}).
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
