import { useEffect, useRef, useState } from "react";

const LS_WORKER = "americar.workerUrl";

export default function Demo() {
  const [workerUrl, setWorkerUrl] = useState(localStorage.getItem(LS_WORKER) || "");
  const [quality, setQuality] = useState("medium");
  const [file, setFile] = useState(null);
  const [imgEl, setImgEl] = useState(null);
  const [plateRect, setPlateRect] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [resultReady, setResultReady] = useState(false);
  const [error, setError] = useState("");
  const [scale, setScale] = useState(1);

  const markCanvas = useRef(null);
  const resultCanvas = useRef(null);
  const logoRef = useRef(null);

  useEffect(() => {
    const img = new Image();
    img.src = "./americar-logo.png";
    img.onload = () => (logoRef.current = img);
  }, []);

  useEffect(() => {
    localStorage.setItem(LS_WORKER, workerUrl);
  }, [workerUrl]);

  const onFile = (e) => {
    setError("");
    setResultReady(false);
    setPlateRect(null);
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const img = new Image();
    img.onload = () => setImgEl(img);
    img.src = URL.createObjectURL(f);
  };

  useEffect(() => {
    if (!imgEl || !markCanvas.current) return;
    const canvas = markCanvas.current;
    const ctx = canvas.getContext("2d");
    const maxW = Math.min(window.innerWidth - 80, 900);
    const s = Math.min(1, maxW / imgEl.width);
    setScale(s);
    canvas.width = imgEl.width * s;
    canvas.height = imgEl.height * s;
    ctx.drawImage(imgEl, 0, 0, canvas.width, canvas.height);

    let drawing = false, start = null, rect = null;
    const pos = (e) => {
      const r = canvas.getBoundingClientRect();
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      const cy = e.touches ? e.touches[0].clientY : e.clientY;
      return { x: (cx - r.left) * (canvas.width / r.width), y: (cy - r.top) * (canvas.height / r.height) };
    };
    const redraw = () => {
      ctx.drawImage(imgEl, 0, 0, canvas.width, canvas.height);
      if (rect) {
        ctx.strokeStyle = "#22c55e"; ctx.lineWidth = 3; ctx.setLineDash([8, 4]);
        ctx.strokeRect(rect.x, rect.y, rect.w, rect.h); ctx.setLineDash([]);
        ctx.fillStyle = "rgba(34,197,94,0.15)";
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      }
    };
    const down = (e) => { e.preventDefault(); drawing = true; start = pos(e); };
    const move = (e) => {
      if (!drawing) return; e.preventDefault();
      const p = pos(e);
      rect = { x: Math.min(start.x, p.x), y: Math.min(start.y, p.y), w: Math.abs(p.x - start.x), h: Math.abs(p.y - start.y) };
      redraw();
    };
    const up = () => {
      drawing = false;
      if (rect && rect.w > 10 && rect.h > 5) setPlateRect(rect);
    };
    canvas.onmousedown = down; canvas.onmousemove = move; canvas.onmouseup = up; canvas.onmouseleave = up;
    canvas.ontouchstart = down; canvas.ontouchmove = move; canvas.ontouchend = up;
  }, [imgEl]);

  const pickSize = (w, h) => {
    const r = w / h;
    if (r > 1.3) return "1536x1024";
    if (r < 0.77) return "1024x1536";
    return "1024x1024";
  };

  const toB64 = (f) => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => { const s = r.result; res(s.substring(s.indexOf(",") + 1)); };
    r.onerror = rej; r.readAsDataURL(f);
  });

  const process = async () => {
    if (!workerUrl) return setError("Falta la URL del Worker en la configuración abajo.");
    if (!plateRect) return setError("Marcá la patente primero.");
    setProcessing(true); setError(""); setResultReady(false);
    try {
      const size = pickSize(imgEl.width, imgEl.height);
      const b64 = await toB64(file);
      const res = await fetch(workerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: b64, mime: file.type, size, quality }),
      });
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      const { image } = await res.json();
      await renderResult(image, size);
      setResultReady(true);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setProcessing(false);
    }
  };

  const renderResult = (b64, size) => new Promise((resolve) => {
    const [W, H] = size.split("x").map(Number);
    const canvas = resultCanvas.current;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, W, H);
      const r = plateRect;
      const sx = W / (imgEl.width * scale);
      const sy = H / (imgEl.height * scale);
      const px = r.x * sx, py = r.y * sy, pw = r.w * sx, ph = r.h * sy;
      const pad = Math.max(pw, ph) * 0.1;
      roundRect(ctx, px - pad, py - pad, pw + pad * 2, ph + pad * 2, 8);
      ctx.fillStyle = "#ffffff"; ctx.fill();
      if (logoRef.current) drawLogoFit(ctx, logoRef.current, px - pad, py - pad, pw + pad * 2, ph + pad * 2);
      resolve();
    };
    img.src = "data:image/png;base64," + b64;
  });

  const download = () => {
    const link = document.createElement("a");
    link.download = `americar-${Date.now()}.jpg`;
    link.href = resultCanvas.current.toDataURL("image/jpeg", 0.92);
    link.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-1">Demo interactiva</h2>
        <p className="text-slate-400 text-sm">Subí una foto, marcá la patente y procesá con gpt-image-1.</p>
      </div>

      <div className="rounded-xl bg-slate-900 border border-slate-800 p-5">
        <label className="block text-sm font-medium mb-2">1. Subí una foto del vehículo</label>
        <input
          type="file"
          accept="image/*"
          onChange={onFile}
          className="block w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-brand-500 file:text-slate-950 file:font-semibold hover:file:bg-brand-300"
        />
      </div>

      {imgEl && (
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-3">
          <label className="block text-sm font-medium">2. Marcá la patente arrastrando el mouse</label>
          <div className="bg-black rounded-lg flex justify-center max-h-[70vh] overflow-auto">
            <canvas ref={markCanvas} className="cursor-crosshair block max-w-full" />
          </div>
          <div className="flex gap-3 flex-wrap items-center">
            <button
              onClick={process}
              disabled={!plateRect || processing}
              className="bg-brand-500 hover:bg-brand-300 disabled:opacity-40 text-slate-950 font-semibold px-5 py-2 rounded-lg"
            >
              {processing ? "Procesando…" : "3. Procesar con IA"}
            </button>
            {plateRect && <span className="text-xs text-slate-400">Patente marcada ✓</span>}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/40 text-red-300 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {processing && (
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-6 text-center">
          <div className="inline-block w-8 h-8 border-2 border-slate-700 border-t-brand-500 rounded-full animate-spin" />
          <p className="text-slate-400 text-sm mt-3">Procesando… 20–60 segundos.</p>
        </div>
      )}

      <div className={resultReady ? "" : "hidden"}>
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-4">
          <h3 className="font-semibold">4. Resultado</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-400 mb-1">Original</p>
              {file && <img src={URL.createObjectURL(file)} alt="" className="w-full rounded-lg bg-black" />}
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Procesada</p>
              <canvas ref={resultCanvas} className="w-full rounded-lg bg-black" />
            </div>
          </div>
          <button
            onClick={download}
            className="bg-brand-500 hover:bg-brand-300 text-slate-950 font-semibold px-5 py-2 rounded-lg"
          >
            Descargar JPG
          </button>
        </div>
      </div>

      <details className="rounded-xl bg-slate-900/60 border border-slate-800 p-4">
        <summary className="cursor-pointer text-sm text-slate-300 font-medium">Configuración</summary>
        <div className="mt-4 space-y-3">
          <label className="block text-sm">
            <span className="text-slate-400">URL del Cloudflare Worker</span>
            <input
              type="text"
              value={workerUrl}
              onChange={(e) => setWorkerUrl(e.target.value.trim())}
              placeholder="https://americar-photo.tu-subdominio.workers.dev"
              className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-400">Calidad</span>
            <select
              value={quality}
              onChange={(e) => setQuality(e.target.value)}
              className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm"
            >
              <option value="low">Baja (~$0.02)</option>
              <option value="medium">Media (~$0.07)</option>
              <option value="high">Alta (~$0.19)</option>
            </select>
          </label>
        </div>
      </details>
    </div>
  );
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawLogoFit(ctx, img, x, y, w, h) {
  const pad = Math.min(w, h) * 0.15;
  const boxW = w - pad * 2, boxH = h - pad * 2;
  const ratio = img.width / img.height;
  let dw = boxW, dh = dw / ratio;
  if (dh > boxH) { dh = boxH; dw = dh * ratio; }
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}
