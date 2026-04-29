import { useEffect, useRef, useState } from "react";

const LS_WORKER = "americar.workerUrl";

function compositeStudio(cutoutB64, analysis, logoText) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const timer = setTimeout(() => reject(new Error("compositeStudio timeout")), 30000);

    img.onload = () => {
      clearTimeout(timer);
      const W = img.naturalWidth;
      const H = img.naturalHeight;
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");

      // ── 1. CABINA VIRTUAL (ciclorama fotográfico estilo catálogo) ────
      // Base gris-blanco (ni blanco puro ni gris evidente)
      ctx.fillStyle = "#efefef";
      ctx.fillRect(0, 0, W, H);

      // Luz cenital amplia y suave (softbox grande arriba)
      const topLight = ctx.createRadialGradient(W * 0.5, H * 0.18, 0, W * 0.5, H * 0.35, W * 0.95);
      topLight.addColorStop(0,    "rgba(255,255,255,0.7)");
      topLight.addColorStop(0.5,  "rgba(255,255,255,0.22)");
      topLight.addColorStop(1,    "rgba(255,255,255,0)");
      ctx.fillStyle = topLight;
      ctx.fillRect(0, 0, W, H);

      // Vignette muy sutil para profundidad de ciclorama (esquinas levemente más oscuras)
      const vig = ctx.createRadialGradient(W * 0.5, H * 0.45, H * 0.3, W * 0.5, H * 0.45, W * 0.95);
      vig.addColorStop(0, "rgba(0,0,0,0)");
      vig.addColorStop(1, "rgba(0,0,0,0.08)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);

      // ── 2. REFLEXIÓN EN EL PISO (clave del estilo catálogo) ──────────
      // Línea de horizonte donde tocan las ruedas
      const reflY = H * 0.86;
      ctx.save();
      ctx.translate(0, reflY * 2);
      ctx.scale(1, -1);
      ctx.globalAlpha = 0.22;
      ctx.drawImage(img, 0, 0, W, H);
      ctx.restore();

      // Fade-out gradual de la reflexión hacia el borde inferior
      const reflFade = ctx.createLinearGradient(0, reflY, 0, H);
      reflFade.addColorStop(0,    "rgba(239,239,239,0)");
      reflFade.addColorStop(0.35, "rgba(239,239,239,0.55)");
      reflFade.addColorStop(1,    "rgba(239,239,239,1)");
      ctx.fillStyle = reflFade;
      ctx.fillRect(0, reflY, W, H - reflY);

      // ── 3. SOMBRA DE CONTACTO (bajo las ruedas) ──────────────────────
      ctx.save();
      ctx.filter = "blur(22px)";
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = "#404040";
      ctx.beginPath();
      ctx.ellipse(W * 0.5, H * 0.862, W * 0.38, H * 0.028, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // ── 4. AUTO (píxeles 100% originales del recorte) ─────────────────
      ctx.drawImage(img, 0, 0, W, H);

      // ── 5. TAPADO DE PATENTE (rectángulo blanco + texto oscuro, estilo catálogo) ──
      const isRear = (analysis?.orientation?.visibleSide || "").includes("rear");
      const pb = isRear
        ? { x: 0.35, y: 0.715, w: 0.22, h: 0.058 }
        : { x: 0.35, y: 0.71,  w: 0.22, h: 0.058 };

      if (analysis?.plate?.visible !== false) {
        const px = pb.x * W, py = pb.y * H, pw = pb.w * W, ph = pb.h * H;
        // Sombra sutil bajo el rectángulo
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.25)";
        ctx.shadowBlur = 6;
        ctx.shadowOffsetY = 2;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(px, py, pw, ph);
        ctx.restore();
        // Texto CLICAR en gris oscuro
        ctx.font = `600 ${Math.max(10, ph * 0.55)}px Arial,sans-serif`;
        ctx.fillStyle = "#1f1f1f";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText((logoText || "CLICAR").toUpperCase(), px + pw / 2, py + ph / 2);
      }

      resolve(canvas.toDataURL("image/png").split(",")[1]);
    };

    img.onerror = (e) => { clearTimeout(timer); reject(e); };
    img.src = "data:image/png;base64," + cutoutB64;
  });
}

const PUBLICATION_SLOT = "frente-der";

const SLOTS = [
  { id: "frente-izq", label: "Frente Izquierdo" },
  { id: "frente", label: "Frente" },
  { id: "frente-der", label: "Frente Derecho" },
  { id: "lateral-der", label: "Lateral Derecho" },
  { id: "posterior-der", label: "Posterior Derecho" },
  { id: "posterior", label: "Posterior" },
  { id: "posterior-izq", label: "Posterior Izquierdo" },
  { id: "lateral-izq", label: "Lateral Izquierdo" },
  { id: "llanta-del-izq", label: "Llanta delantera izquierda" },
  { id: "llanta-del-der", label: "Llanta delantera derecha" },
  { id: "llanta-tra-der", label: "Llanta trasera derecha" },
  { id: "llanta-tra-izq", label: "Llanta trasera izquierda" },
  { id: "tablero", label: "Tablero" },
  { id: "panel", label: "Panel de instrumentos" },
];

export default function Demo() {
  const [workerUrl, setWorkerUrl] = useState(
    localStorage.getItem(LS_WORKER) || "https://americar-photo.gonzalocortesr7.workers.dev"
  );
  const [logoText, setLogoText] = useState("CLICAR");
  const [file, setFile] = useState(null);
  const [imageB64, setImageB64] = useState(null);
  const [mime, setMime] = useState(null);
  const [preview, setPreview] = useState(null);
  const [activeSlot, setActiveSlot] = useState(PUBLICATION_SLOT);

  const [phase, setPhase] = useState("idle");
  const [analysis, setAnalysis] = useState(null);
  const [promptUsed, setPromptUsed] = useState(null);
  const [resultB64, setResultB64] = useState(null);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  useEffect(() => { localStorage.setItem(LS_WORKER, workerUrl); }, [workerUrl]);

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setError(""); setAnalysis(null); setResultB64(null); setPhase("idle");
    setFile(f); setMime(f.type); setPreview(URL.createObjectURL(f));
    const r = new FileReader();
    r.onload = () => { const s = r.result; setImageB64(s.substring(s.indexOf(",") + 1)); };
    r.readAsDataURL(f);
  };

  const process = async () => {
    if (!imageB64) return;
    setPhase("processing"); setError("");
    try {
      const res = await fetch(workerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "process", image: imageB64, mime, logoText }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(body.error || res.statusText);
      }
      const data = await res.json();
      setAnalysis(data.analysis);
      setPromptUsed(null);
      if (data.cutout) {
        const final = await compositeStudio(data.cutout, data.analysis, logoText);
        setResultB64(final);
      } else {
        setResultB64(data.image);
      }
      setPhase("done");
    } catch (e) {
      setError(e.message || String(e));
      setPhase("idle");
    }
  };

  const download = () => {
    if (!resultB64) return;
    const link = document.createElement("a");
    link.download = `americar-${Date.now()}.png`;
    link.href = "data:image/png;base64," + resultB64;
    link.click();
  };

  const reset = () => {
    setFile(null); setImageB64(null); setPreview(null); setMime(null);
    setAnalysis(null); setPromptUsed(null); setResultB64(null); setPhase("idle"); setError("");
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold mb-1">Demo interactiva</h2>
        <p className="text-slate-400 text-sm">
          Así se ve integrado en el <strong className="text-brand-300">paso 10 “Fotografías del Vehículo”</strong> del Portal Americar.
          El procesamiento IA corre <strong className="text-brand-300">solo sobre la foto de publicación</strong> (Frente Derecho),
          marcada en la UI para que el inspector sepa cuál es la que va a aparecer en el aviso.
        </p>
      </div>

      {/* Mock del Portal Americar — paso 10 */}
      <PortalMock
        activeSlot={activeSlot}
        publicationSlot={PUBLICATION_SLOT}
        onSlotClick={(id) => { setActiveSlot(id); if (fileRef.current) fileRef.current.click(); }}
      />

      <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs p-3 leading-relaxed">
        <strong>Nota:</strong> este demo llama al Cloudflare Worker conectado a{" "}
        <strong>Nano Banana (Gemini 2.5 Flash Image)</strong>. Sigue siendo IA directa (sin la segmentación
        remove.bg que describe el Pipeline IA de producción), así que aún pueden aparecer desviaciones menores.
        En producción, la captura vive dentro del MF <code>portal_mf_inspection</code> con{" "}
        <code>react-webcam</code> + silueta de encuadre, y el pipeline agrega cutout 1:1 del auto antes de la
        edición con máscaras. Ver tabs <strong>Stack Actual</strong>, <strong>Arquitectura</strong> y{" "}
        <strong>Pipeline IA</strong>.
      </div>

      {/* Área de trabajo: slot seleccionado */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">Slot activo</div>
              <div className="text-lg font-semibold text-brand-300">
                {SLOTS.find((s) => s.id === activeSlot)?.label}
              </div>
            </div>
            {activeSlot === PUBLICATION_SLOT && (
              <span className="ml-2 inline-flex items-center gap-1 text-[10px] uppercase tracking-wide font-bold bg-brand-500 text-white px-2 py-1 rounded-full">
                ★ Foto de publicación
              </span>
            )}
          </div>
          <div className="text-xs text-slate-500 max-w-sm text-right">
            Ángulo fijo para toda la flota: <strong>Frente Derecho</strong>.
            Es la única foto que atraviesa el pipeline IA al guardar la inspección.
          </div>
        </div>

        {!file && (
          <div className="space-y-3">
            <label className="block text-sm">
              <span className="text-slate-400">Texto sobre la patente (overlay post-IA)</span>
              <input
                type="text"
                value={logoText}
                onChange={(e) => setLogoText(e.target.value)}
                placeholder='Ej: "CLICAR" o "SALAZAR ISRAEL | CLICAR"'
                className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm font-medium mt-2">Subí la foto de este slot</label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={onFile}
              className="block w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-brand-500 file:text-white file:font-semibold hover:file:bg-brand-600"
            />
          </div>
        )}

        {file && !resultB64 && phase === "idle" && (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl bg-slate-950 border border-slate-800 p-3">
              <img src={preview} alt="" className="w-full rounded-lg bg-black" />
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-sm text-slate-300">
                Al <strong>Guardar</strong> la inspección se ejecuta únicamente sobre la foto de publicación (<strong className="text-brand-300">Frente Derecho</strong>):
              </p>
              <ol className="text-xs text-slate-400 space-y-1 list-decimal pl-5">
                <li>Claude analiza marca, modelo, color, ángulo/lado, suciedad, reflejos, patente.</li>
                <li>Claude genera un prompt que <strong>solo</strong> pide: corregir luces, quitar suciedad, atenuar reflejos, tapar patente, poner fondo de cabina virtual.</li>
                <li>Nano Banana (Gemini 2.5 Flash Image) aplica las correcciones sin espejar, sin rotar y sin rejuvenecer el auto.</li>
              </ol>
              <button
                onClick={process}
                className="bg-brand-500 hover:bg-brand-600 text-white font-semibold px-5 py-2.5 rounded-lg mt-2 inline-flex items-center justify-center gap-2"
              >
                <CheckIcon /> Simular “Guardar inspección”
              </button>
              <button onClick={reset} className="text-xs text-slate-400 hover:text-slate-200">Cambiar foto</button>
            </div>
          </div>
        )}

        {phase === "processing" && (
          <div className="rounded-xl bg-slate-950 border border-slate-800 p-6 text-center">
            <div className="inline-block w-8 h-8 border-2 border-slate-700 border-t-brand-500 rounded-full animate-spin" />
            <p className="text-slate-400 text-sm mt-3">
              Procesando… Claude analiza la foto + remove.bg recorta el auto + se compone el fondo de cabina virtual.
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/40 text-red-300 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {resultB64 && (
          <div className="space-y-4">
            {analysis?.vehicle && (
              <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <Stat k="Marca" v={analysis.vehicle.brand} />
                <Stat k="Modelo" v={analysis.vehicle.model} />
                <Stat k="Color detectado" v={analysis.vehicle.color} />
                <Stat k="Carrocería" v={analysis.vehicle.bodyType} />
                <Stat k="Ángulo" v={analysis.orientation?.visibleSide} />
                {analysis.plate?.text && <Stat k="Patente detectada" v={analysis.plate.text} />}
              </div>
            )}
            <div className="rounded-xl bg-slate-950 border border-slate-800 p-5 space-y-4">
              <div className="text-xs text-slate-500 uppercase tracking-wider">Resultado (slot {activeSlot})</div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Original (la que carga el inspector)</p>
                  <img src={preview} alt="" className="w-full rounded-lg bg-black" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Procesada (la que va al aviso)</p>
                  <img src={"data:image/png;base64," + resultB64} alt="" className="w-full rounded-lg bg-black" />
                </div>
              </div>

              <ChangesApplied analysis={analysis} />

              <div className="flex gap-3 flex-wrap">
                <button onClick={download} className="bg-brand-500 hover:bg-brand-600 text-white font-semibold px-5 py-2 rounded-lg">
                  Descargar PNG
                </button>
                <button onClick={reset} className="border border-slate-700 hover:border-brand-500 text-slate-300 px-5 py-2 rounded-lg">
                  Probar otra foto
                </button>
              </div>
            </div>

            {/* Debug: análisis Claude + prompt enviado a Gemini */}
            <details className="rounded-xl bg-slate-900/60 border border-slate-700 p-4 text-xs">
              <summary className="cursor-pointer text-slate-300 font-medium text-sm">🔍 Debug — Análisis Claude + Prompt enviado a Gemini</summary>
              <div className="mt-4 space-y-4">
                <div>
                  <div className="text-slate-400 uppercase tracking-wider mb-1 font-semibold">Análisis Claude (JSON)</div>
                  <pre className="bg-slate-950 rounded-lg p-3 overflow-auto text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {JSON.stringify(analysis, null, 2)}
                  </pre>
                </div>
                {promptUsed && (
                  <div>
                    <div className="text-slate-400 uppercase tracking-wider mb-1 font-semibold">Prompt enviado a Gemini (edit prompt)</div>
                    <pre className="bg-slate-950 rounded-lg p-3 overflow-auto text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {promptUsed}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          </div>
        )}
      </div>

      <details className="rounded-xl bg-slate-900/60 border border-slate-800 p-4">
        <summary className="cursor-pointer text-sm text-slate-300 font-medium">Configuración</summary>
        <label className="block text-sm mt-3">
          <span className="text-slate-400">URL del Cloudflare Worker</span>
          <input
            type="text"
            value={workerUrl}
            onChange={(e) => setWorkerUrl(e.target.value.trim())}
            className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm"
          />
        </label>
      </details>
    </div>
  );
}

function PortalMock({ activeSlot, publicationSlot, onSlotClick }) {
  return (
    <div className="rounded-xl overflow-hidden border border-slate-800 shadow-lg">
      {/* Header Portal Americar */}
      <div className="bg-[#0b0b0b] text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center text-slate-950 text-xs font-bold">A</div>
          <span className="font-semibold tracking-wide text-sm">PORTAL AMERICAR</span>
        </div>
        <span className="text-xs text-slate-400">gonzalo.cortes@americar.tech</span>
      </div>

      {/* Cuerpo con sidebar + contenido */}
      <div className="flex bg-slate-100 text-portal-ink">
        <aside className="w-64 bg-slate-50 border-r border-slate-200 p-3 text-xs space-y-1 hidden md:block">
          {[
            "1 · Detalles del auto",
            "2 · Exterior",
            "3 · Interior",
            "4 · Electrónica y seguridad",
            "5 · Suspensión y frenos",
            "6 · Motor y transmisión",
            "7 · Llantas",
            "8 · Chasis",
            "9 · Scan",
            "10 · Fotografías del vehículo",
            "11 · Fotografías adicionales",
          ].map((s) => {
            const active = s.startsWith("10");
            return (
              <div
                key={s}
                className={
                  "px-3 py-2 rounded-md border " +
                  (active
                    ? "bg-brand-500 text-white border-brand-500 font-semibold"
                    : "bg-white border-slate-200 text-slate-600")
                }
              >
                {s}
              </div>
            );
          })}
        </aside>

        <div className="flex-1 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-bold text-slate-800">FOTOGRAFÍAS DEL VEHÍCULO</h3>
            <span className="text-sm font-semibold text-brand-600">10/11</span>
          </div>
          <div className="mb-3 rounded-md bg-brand-50 border border-brand-500/40 px-3 py-1.5 text-[11px] text-brand-700 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-brand-500 text-white text-[10px] font-bold">★</span>
            <span>
              La foto marcada con <strong>★ Foto de publicación</strong> (Frente Derecho) es la única que
              se procesa con IA y la que aparecerá en el aviso. Ángulo fijo para toda la flota.
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {SLOTS.map((s) => {
              const active = s.id === activeSlot;
              const isPub = s.id === publicationSlot;
              return (
                <button
                  key={s.id}
                  onClick={() => onSlotClick(s.id)}
                  className={
                    "relative aspect-[4/3] rounded-md border-2 flex flex-col items-center justify-center text-[10px] text-center p-1 transition " +
                    (isPub
                      ? "border-brand-500 bg-brand-500/10 text-brand-700 ring-2 ring-brand-500 shadow-[0_0_0_3px_rgba(20,184,166,0.15)]"
                      : active
                        ? "border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-300"
                        : "border-brand-500/60 bg-white text-brand-700 hover:bg-brand-50")
                  }
                >
                  {isPub && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap shadow">
                      ★ FOTO DE PUBLICACIÓN
                    </span>
                  )}
                  <CameraIcon />
                  <span className="mt-1 font-semibold leading-tight">Cargar Foto</span>
                  <span className="leading-tight">{s.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button className="px-4 py-1.5 rounded-md bg-slate-200 text-slate-700 text-xs font-semibold">Anterior</button>
            <button
              className="px-4 py-1.5 rounded-md bg-brand-500 text-white text-xs font-semibold inline-flex items-center gap-1"
              title="En producción, al guardar la inspección se dispara el pipeline sobre los 14 slots"
            >
              <CheckIcon /> Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChangesApplied({ analysis }) {
  const plate = analysis?.issues?.plateText || analysis?.issues?.hasPlate;
  const doneItems = [
    {
      title: "Iluminación corregida",
      desc: "Exposición pareja; se quitaron las zonas quemadas y las sombras duras que ocultaban el color real.",
    },
    {
      title: "Suciedad removida",
      desc: "Se eliminó polvo, barro, manchas y restos de cera/agua de la carrocería y los vidrios.",
    },
    {
      title: "Reflejos y brillos neutralizados",
      desc: "Se atenuaron los reflejos del ambiente (luces, personas, cartelería) que no corresponden al auto.",
    },
    {
      title: "Patente tapada",
      desc: plate
        ? `Se cubrió la patente detectada${analysis?.issues?.plateText ? ` (${analysis.issues.plateText})` : ""} con un cuadro + logo Americar.`
        : "Se aplicó un cuadro con logo Americar sobre el área de patente.",
    },
    {
      title: "Fondo de cabina virtual",
      desc: "Se reemplazó el fondo original por un estudio gris claro con piso reflectante.",
    },
  ];
  const preservedItems = [
    "Mismo vehículo: marca, modelo, color y carrocería idénticos.",
    "Mismo ángulo y mismo lado: si era Frente Derecho, sigue siendo Frente Derecho (no se espeja ni rota).",
    "Mismo estado del auto: rayones, golpes, llantas y desgaste del original se mantienen.",
  ];

  return (
    <div className="rounded-xl bg-slate-900 border border-brand-700/40 p-4 space-y-4">
      <div>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h4 className="font-semibold text-brand-300 text-sm uppercase tracking-wide">¿Qué se le hizo a la foto?</h4>
          <span className="text-[10px] text-slate-500">Transformaciones aplicadas por el pipeline</span>
        </div>
        <ul className="space-y-2">
          {doneItems.map((i) => (
            <li key={i.title} className="flex items-start gap-3 text-sm">
              <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-brand-500 text-slate-950 flex items-center justify-center">
                <CheckIcon />
              </span>
              <div>
                <div className="font-semibold text-slate-200">{i.title}</div>
                <div className="text-xs text-slate-400">{i.desc}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-slate-800 pt-3">
        <h4 className="font-semibold text-slate-300 text-xs uppercase tracking-wide mb-2">Lo que NO se tocó</h4>
        <ul className="space-y-1.5">
          {preservedItems.map((t) => (
            <li key={t} className="flex items-start gap-2 text-xs text-slate-400">
              <span className="mt-1 shrink-0 w-1.5 h-1.5 rounded-full bg-slate-500" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function CameraIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function Stat({ k, v }) {
  return (
    <div>
      <div className="text-xs text-slate-500 uppercase tracking-wide">{k}</div>
      <div className="text-slate-200">{v || "—"}</div>
    </div>
  );
}
