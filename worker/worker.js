const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:8000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
];

const ANALYZE_INSTRUCTION = `You are an automotive photo inspector. Look at the input car photo and return ONLY valid JSON (no markdown, no backticks).

Do NOT write a generation prompt. Just describe the scene factually so a compositing pipeline can clean it.

Structure:
{
 "vehicle":{
   "brand":"",
   "model":"",
   "color":"EXACT paint color — be specific about hue AND finish (e.g. 'dark navy blue metallic', 'pearl white', 'silver grey', 'dark forest green', 'dark anthracite grey metallic'). NEVER collapse a dark blue, dark green or dark grey into just 'black'. Look carefully at the hue under the ambient light.",
   "bodyType":""
 },
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
    `You are editing an existing photograph. DO NOT regenerate, redraw, or re-render the car. You must work with the actual pixels of the input image and change only what is explicitly listed below. Every part of the car must look like the original photo.`,
    ``,
    `The car in this photo is a ${v.color || ""} ${v.brand || ""} ${v.model || ""}. This is a USED vehicle for a second-hand listing.`,
    ``,
    `PAINT COLOR — ABSOLUTE RULE:`,
    `- The exact paint color is: "${v.color || "same as input"}".`,
    `- DO NOT change the hue, saturation, tone, or finish of the paint under any circumstance.`,
    `- If the input shows a dark navy blue car, the output must show a dark navy blue car — NOT black, NOT dark grey.`,
    `- Copy the paint color directly from the input image pixels. Do not interpret or "improve" it.`,
    ``,
    `ORIENTATION — ABSOLUTE RULES:`,
    `- The visible side is "${o.visibleSide || "same as input"}". ${o.describe || ""}`,
    `- DO NOT mirror, flip or invert the image in any direction.`,
    `- DO NOT rotate the car or change the camera angle, framing or perspective.`,
    `- Output the SAME SIDE of the car as the input. Never swap left and right.`,
    ``,
    `PRESERVATION — DO NOT TOUCH ANY OF THESE:`,
    `- Every sign of age and use: ${wear}. These are REAL and must stay exactly as-is.`,
    `- Paint condition: dull areas stay dull, faded areas stay faded, scuffs stay scuffs.`,
    `- Wheels: same rims, same tire wear, same brake dust. No polishing, no restyling.`,
    `- Body shape, proportions, trim, grille, headlights, mirrors, roof, window tint. Zero restyling.`,
    `- DO NOT add gloss, shine, or polish. DO NOT make the car look restored or new.`,
    `- DO NOT re-render or re-draw any surface. Edit pixels; do not replace them with generated content.`,
    ``,
    `ALLOWED CHANGES — ONLY THESE FIVE, NOTHING ELSE:`,
    `1. Remove removable surface dirt: ${dirt}. "Car wash" level only — no detailing, no restoration.`,
    `2. Neutralize harsh reflections/glare: ${reflections}. Keep the car's natural paint texture and sheen.`,
    `3. Correct exposure so the car is evenly visible (${c.lighting || "balance highlights and shadows"}). Do NOT alter any color.`,
    `4. Replace ONLY the background (everything outside the car) with: neutral light-grey seamless cyclorama backdrop, matte light-grey floor, faint floor reflection of the car, soft even diffuse overhead lighting, natural soft shadow under the vehicle. Functional used-car photo studio — NOT a luxury showroom.`,
    `5. Cover ONLY the license plate${p.location ? ` (at ${p.location})` : ""} with a small dark rectangle containing "${logoLabel}" in white sans-serif text. Cover nothing else.`,
    ``,
    `OUTPUT: the SAME car from the input photo — same color, same wear, same shape — with only the background swapped, dirt removed, exposure corrected, and plate covered. Photorealistic edited photograph. Not a render. Not a new car. The same used car.`,
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
        const image = await editWithNanoBanana(env, body.image, body.mime, body.prompt);
        return json({ image }, 200, cors);
      }

      if (action === "process") {
        if (!body.image) return json({ error: "missing image" }, 400, cors);
        const analysis = await analyzeWithClaude(env, body.image, body.mime);
        const prompt = buildEditPrompt(analysis, body.logoText);
        const image = await editWithNanoBanana(env, body.image, body.mime, prompt);
        return json({ image, analysis, promptUsed: prompt, editor: "gemini-2.5-flash-image" }, 200, cors);
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

async function editWithNanoBanana(env, imageB64, mime, prompt) {
  if (!env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not configured on worker — run `npx wrangler secret put GEMINI_API_KEY`.");
  }
  const model = "gemini-2.5-flash-image";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": env.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mime || "image/jpeg", data: imageB64 } },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ["IMAGE"],
        temperature: 0.2,
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
      ],
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || `gemini ${res.status}: ${JSON.stringify(data).slice(0, 300)}`);
  }
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find((p) => p.inline_data || p.inlineData);
  const b64 = imagePart?.inline_data?.data || imagePart?.inlineData?.data;
  if (!b64) {
    const reason = data?.candidates?.[0]?.finishReason || "unknown";
    throw new Error(`Nano Banana no devolvió imagen (finishReason: ${reason}). Respuesta: ${JSON.stringify(data).slice(0, 400)}`);
  }
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
