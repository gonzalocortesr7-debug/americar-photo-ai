const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:8000",
  "http://127.0.0.1:5173",
];

const ANALYZE_INSTRUCTION = `You are an automotive photo inspector. Look at the input car photo and return ONLY valid JSON (no markdown, no backticks).

Do NOT write a generation prompt. Just describe the scene factually so a compositing pipeline can clean it.

Structure:
{
 "vehicle":{"brand":"","model":"","color":"","bodyType":""},
 "orientation":{
   "visibleSide":"front | rear | left side | right side | front-left 3/4 | front-right 3/4 | rear-left 3/4 | rear-right 3/4",
   "describe":"one short sentence describing which side of the car faces the camera (e.g. 'the driver headlight is on the right of the frame; the car faces the camera from its front-left 3/4')"
 },
 "condition":{
   "existingWear":["list visible scratches, chips, dents, tire wear, rust, faded paint — MUST be preserved as-is"],
   "dirtAreas":["list areas with removable dirt only: dust, mud, water spots, pollen, grime"],
   "reflections":["list unwanted reflections/glare to neutralize: sun hotspots, person reflections, signage, sky glare"],
   "lighting":"short description of current lighting issues"
 },
 "plate":{"visible":true,"text":"","location":"describe position (e.g. 'center of front bumper, below grille')"}
}`;

const buildEditPrompt = (analysis, logoText) => {
  const v = analysis?.vehicle || {};
  const o = analysis?.orientation || {};
  const c = analysis?.condition || {};
  const p = analysis?.plate || {};
  const wear = (c.existingWear || []).join("; ") || "all existing wear";
  const dirt = (c.dirtAreas || []).join("; ") || "surface dust and grime";
  const reflections = (c.reflections || []).join("; ") || "unwanted glare and reflections";
  const logoLabel = (logoText || "").trim() || "AMERICAR";

  return [
    `Edit this exact photo of a ${v.color || ""} ${v.brand || ""} ${v.model || ""}. This is a real used car on a dealership lot — keep it that way.`,
    ``,
    `ORIENTATION (ABSOLUTE RULES — breaking any of these ruins the output):`,
    `- The visible side is "${o.visibleSide || "same as input"}". ${o.describe || ""}`,
    `- DO NOT mirror, flip or invert the image horizontally or vertically.`,
    `- DO NOT rotate the car. DO NOT change the camera angle, framing or perspective.`,
    `- If the driver's headlight is on the right of the frame in the input, it MUST be on the right of the frame in the output.`,
    `- Output the SAME SIDE of the car as the input. Never swap left and right.`,
    ``,
    `PRESERVATION (the output must look like the SAME used vehicle, NOT a new one):`,
    `- Keep every sign of age and use: ${wear}.`,
    `- Keep current paint condition, any existing scratches, chips, bumper scuffs, faded areas, stone marks.`,
    `- Keep the existing wheels exactly as they are (same rims, same tire wear, same brake dust pattern). Do not replace, re-style, or polish them.`,
    `- Keep the original body shape, proportions, trim, grille, headlights, mirrors, roof, window tint. No restyling.`,
    `- Do NOT make the car look newer, shinier or restored. Do NOT add showroom polish.`,
    ``,
    `ALLOWED CHANGES (only these — nothing else):`,
    `1. Remove removable dirt only: ${dirt}. A car wash would remove it; restoration work would not.`,
    `2. Neutralize unwanted reflections and glare: ${reflections}. Keep realistic metallic paint reflections.`,
    `3. Correct lighting so the car is evenly exposed (${c.lighting || "balance highlights and shadows"}). Do not re-paint, do not re-color.`,
    `4. Replace the ORIGINAL BACKGROUND ONLY (everything that is NOT the car) with a virtual photo studio: near-white seamless cyclorama backdrop, light grey floor with a subtle realistic reflection of the car, soft overhead studio softbox lighting, controlled soft shadow under the vehicle.`,
    `5. Cover ONLY the license plate${p.location ? ` (located at ${p.location})` : ""} with a small dark rectangle containing the centered text "${logoLabel}" in clean minimalist white sans-serif typography. Do not cover anything else.`,
    ``,
    `OUTPUT: the SAME car, in the SAME orientation, with clean surfaces, corrected lighting, studio background and covered plate. Photorealistic DSLR result, not a 3D render.`,
  ].join("\n");
};

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

      if (action === "generate") {
        if (!body.image) return json({ error: "missing image" }, 400, cors);
        if (!body.prompt) return json({ error: "missing prompt" }, 400, cors);
        const image = await editWithOpenAI(env, body.image, body.mime, body.prompt, body.size, body.quality);
        return json({ image }, 200, cors);
      }

      if (action === "process") {
        if (!body.image) return json({ error: "missing image" }, 400, cors);
        const analysis = await analyzeWithClaude(env, body.image, body.mime);
        const prompt = buildEditPrompt(analysis, body.logoText);
        const image = await editWithOpenAI(env, body.image, body.mime, prompt, body.size, body.quality);
        return json({ image, analysis, promptUsed: prompt }, 200, cors);
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
      max_tokens: 4000,
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
    throw new Error("Claude did not return valid JSON. Raw (first 800): " + text.slice(0, 800));
  }
}

async function editWithOpenAI(env, imageB64, mime, prompt, size, quality) {
  const allowedSizes = ["auto", "1024x1024", "1536x1024", "1024x1536"];
  const outSize = allowedSizes.includes(size) ? size : "auto";
  const outQuality = ["low", "medium", "high"].includes(quality) ? quality : "high";

  const bytes = base64ToBytes(imageB64);
  const blob = new Blob([bytes], { type: mime || "image/jpeg" });

  const form = new FormData();
  form.append("model", "gpt-image-1");
  form.append("prompt", prompt);
  form.append("n", "1");
  form.append("size", outSize);
  form.append("quality", outQuality);
  form.append("image", blob, "input." + ((mime || "image/jpeg").split("/")[1] || "jpg"));

  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` },
    body: form,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `openai ${res.status}`);
  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) throw new Error("no image returned from images.edits: " + JSON.stringify(data).slice(0, 400));
  return b64;
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

function base64ToBytes(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
