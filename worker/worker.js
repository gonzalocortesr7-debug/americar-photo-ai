const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:8000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
];

const ANALYZE_INSTRUCTION = `You are an automotive photo inspector. Look at the input car photo and return ONLY valid JSON (no markdown, no backticks).

Structure:
{
 "vehicle":{
   "brand":"",
   "model":"",
   "color":"EXACT paint color with hue AND finish (e.g. 'dark navy blue metallic', 'pearl white', 'silver grey', 'dark forest green'). NEVER collapse a dark blue, green or grey into just 'black'.",
   "bodyType":""
 },
 "orientation":{
   "visibleSide":"front | rear | left side | right side | front-left 3/4 | front-right 3/4 | rear-left 3/4 | rear-right 3/4",
   "describe":"one short sentence"
 },
 "condition":{
   "existingWear":["visible scratches, chips, dents, tire wear, rust, faded paint"],
   "dirtAreas":["removable dirt: dust, mud, water spots, pollen"],
   "reflections":["unwanted glare: sun hotspots, person reflections, signage"],
   "lighting":"short description of lighting issues"
 },
 "plate":{
   "visible":true,
   "text":"plate text if readable",
   "bbox":{
     "x_pct":0.0,
     "y_pct":0.0,
     "w_pct":0.0,
     "h_pct":0.0
   }
 }
}

BBOX INSTRUCTIONS — read carefully:
The image is a rectangle. Coordinates are fractions of the FULL image dimensions (0.0 = edge, 1.0 = opposite edge).
- x_pct: distance from LEFT edge of image to LEFT edge of plate, divided by image width
- y_pct: distance from TOP edge of image to TOP edge of plate, divided by image height
- w_pct: plate width divided by image width  (typical: 0.10–0.25)
- h_pct: plate height divided by image height (typical: 0.03–0.08)

Example: a plate that starts at 40% from the left, 72% from the top, and is 18% wide and 6% tall → x_pct=0.40, y_pct=0.72, w_pct=0.18, h_pct=0.06

If no plate is visible, set visible=false and leave bbox as all zeros.`;

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const cors = buildCors(origin, env);

    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405, cors);

    try {
      const body = await request.json();
      const action = body.action || "analyze";

      if (action === "analyze") {
        if (!body.image) return json({ error: "missing image" }, 400, cors);
        const result = await analyzeWithClaude(env, body.image, body.mime);
        return json(result, 200, cors);
      }

      if (action === "process") {
        if (!body.image) return json({ error: "missing image" }, 400, cors);
        const [analysis, cutout] = await Promise.all([
          analyzeWithClaude(env, body.image, body.mime),
          removeBackground(env, body.image, body.mime),
        ]);
        return json({ cutout, analysis, editor: "removebg+canvas" }, 200, cors);
      }

      return json({ error: "unknown action" }, 400, cors);
    } catch (err) {
      return json({ error: err.message || String(err) }, 500, cors);
    }
  },
};

async function analyzeWithClaude(env, imageB64, mime) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mime || "image/jpeg", data: imageB64 } },
            { type: "text", text: ANALYZE_INSTRUCTION },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`anthropic ${res.status}: ${text.slice(0, 300)}`);
  }
  const data = await res.json();
  const text = data?.content?.map((c) => c.text || "").join("").trim();
  const cleaned = text.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try { return JSON.parse(cleaned.slice(start, end + 1)); } catch {}
    }
    throw new Error("Claude did not return valid JSON. Raw: " + text.slice(0, 400));
  }
}

async function removeBackground(env, imageB64, mime) {
  if (!env.REMOVEBG_API_KEY) {
    throw new Error("REMOVEBG_API_KEY not configured on worker.");
  }

  const binary = atob(imageB64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  const form = new FormData();
  form.append("image_file", new Blob([bytes], { type: mime || "image/jpeg" }), "car.jpg");
  form.append("size", "auto");
  form.append("type", "car");

  const res = await fetch("https://api.remove.bg/v1.0/removebg", {
    method: "POST",
    headers: { "X-Api-Key": env.REMOVEBG_API_KEY },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`remove.bg ${res.status}: ${text.slice(0, 300)}`);
  }

  const buf = await res.arrayBuffer();
  const out = new Uint8Array(buf);
  let b64 = "";
  for (let i = 0; i < out.length; i++) b64 += String.fromCharCode(out[i]);
  return btoa(b64);
}

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
