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
    `Edit this exact photo of a ${v.color || ""} ${v.brand || ""} ${v.model || ""}. This is a USED car for a second-hand vehicle listing — the result must look like a professional used-car listing photo, NOT a new-car advertisement.`,
    ``,
    `ORIENTATION (ABSOLUTE RULES — breaking any of these ruins the output):`,
    `- The visible side is "${o.visibleSide || "same as input"}". ${o.describe || ""}`,
    `- DO NOT mirror, flip or invert the image horizontally or vertically.`,
    `- DO NOT rotate the car. DO NOT change the camera angle, framing or perspective.`,
    `- If the driver's headlight is on the right of the frame in the input, it MUST be on the right of the frame in the output.`,
    `- Output the SAME SIDE of the car as the input. Never swap left and right.`,
    ``,
    `PRESERVATION — THIS IS THE MOST IMPORTANT SECTION. Read carefully:`,
    `- This car has been driven and shows normal wear. That wear is REAL, EXPECTED, and MUST be preserved exactly as-is.`,
    `- Keep every sign of age and use: ${wear}.`,
    `- Keep current paint condition — dull areas stay dull, faded areas stay faded, scuffs stay scuffs.`,
    `- Keep the existing wheels exactly as they are (same rims, same tire wear, same brake dust pattern). Do not replace, re-style, or polish them.`,
    `- Keep the original body shape, proportions, trim, grille, headlights, mirrors, roof, window tint. No restyling whatsoever.`,
    `- CRITICAL: Do NOT add gloss, shine, or polish to the paint. Do NOT make the car look restored, detailed, or brand new. A prospective buyer must see the vehicle's REAL current condition.`,
    `- The aging and imperfections are intentional — they build trust with the buyer. Removing them would be misleading.`,
    ``,
    `ALLOWED CHANGES (only these — nothing else):`,
    `1. Remove removable surface dirt only: ${dirt}. Think "car wash result", not "full detail/restoration".`,
    `2. Neutralize unwanted reflections and harsh glare: ${reflections}. Preserve the car's natural paint texture and realistic sheen.`,
    `3. Correct exposure so the car is evenly visible (${c.lighting || "balance highlights and shadows"}). Do NOT re-color or re-paint any panel.`,
    `4. Replace the ORIGINAL BACKGROUND ONLY (everything that is NOT the car) with a used-car dealership indoor photo studio: neutral light-grey seamless cyclorama backdrop, matte light-grey floor with a faint subtle reflection of the car, soft even overhead lighting without dramatic highlights, natural soft shadow under the vehicle. The studio must look functional and professional, NOT like a luxury new-car showroom.`,
    `5. Cover ONLY the license plate${p.location ? ` (located at ${p.location})` : ""} with a small dark rectangle containing the centered text "${logoLabel}" in clean minimalist white sans-serif typography. Do not cover anything else.`,
    ``,
    `OUTPUT: the SAME used car, in the SAME orientation, with clean surfaces (not polished), corrected exposure, neutral studio background, and covered plate. Photorealistic DSLR result. A buyer should look at this photo and trust that the car genuinely looks like this — because it does.`,
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
