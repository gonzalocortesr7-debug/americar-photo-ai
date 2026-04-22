const PROMPT = `Transforma esta foto en una imagen profesional de catálogo automotriz para un portal de venta de vehículos usados.

Requerimientos:
- Limpieza: eliminar polvo, suciedad, manchas de agua, barro y reflejos sucios de la carrocería, vidrios, llantas y neumáticos. El auto debe verse recién lavado y detallado.
- Fondo: reemplazar el fondo original por un estudio virtual tipo showroom automotriz, con piso liso oscuro reflectante y una pared de gradiente suave gris claro a blanco. Iluminación profesional uniforme, sin sombras duras.
- Conservar EXACTAMENTE: marca, modelo, color, año, ángulo de cámara, posición del vehículo, accesorios, llantas originales y cualquier detalle del vehículo. No alterar la carrocería ni las proporciones.
- Calidad: resultado fotorrealista, nítido, apto para publicación comercial.
- No añadir texto, logos, marcas de agua ni elementos extra.`;

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:8000",
  "http://127.0.0.1:5173",
];

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const cors = buildCors(origin, env);

    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405, cors);

    try {
      const { image, mime, size, quality } = await request.json();
      if (!image) return json({ error: "missing image" }, 400, cors);

      const sizes = ["1024x1024", "1536x1024", "1024x1536"];
      const outSize = sizes.includes(size) ? size : "1024x1024";
      const outQuality = ["low", "medium", "high"].includes(quality) ? quality : "medium";

      const bytes = base64ToBytes(image);
      const blob = new Blob([bytes], { type: mime || "image/png" });
      const ext = (mime || "image/png").split("/")[1] || "png";

      const form = new FormData();
      form.append("model", "gpt-image-1");
      form.append("prompt", PROMPT);
      form.append("size", outSize);
      form.append("quality", outQuality);
      form.append("image", blob, `input.${ext}`);

      const res = await fetch("https://api.openai.com/v1/images/edits", {
        method: "POST",
        headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` },
        body: form,
      });

      const data = await res.json();
      if (!res.ok) return json({ error: data?.error?.message || "OpenAI error", detail: data }, res.status, cors);

      const b64 = data?.data?.[0]?.b64_json;
      if (!b64) return json({ error: "no image", detail: data }, 502, cors);
      return json({ image: b64 }, 200, cors);
    } catch (err) {
      return json({ error: err.message || String(err) }, 500, cors);
    }
  },
};

function buildCors(origin, env) {
  const extra = (env.ALLOWED_ORIGIN || "").split(",").map((s) => s.trim()).filter(Boolean);
  const allowed = [...ALLOWED_ORIGINS, ...extra];
  const allow = allowed.includes(origin) ? origin : (allowed[0] || "*");
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function json(body, status, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

function base64ToBytes(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
