const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:8000",
  "http://127.0.0.1:5173",
];

const ANALYZE_INSTRUCTION = `You are an automotive photo inspector for a USED-CAR dealership. Your output drives a pipeline that must KEEP THE CAR LOOKING USED. Return ONLY valid JSON (no markdown, no backticks).

Do NOT write a generation prompt. Just describe the scene factually.

CLASSIFICATION RULES — read these carefully before filling the JSON:
- "existingWear" is the DEFAULT bucket. Anything that has been on the car for more than a few hours, anything that belongs to the car's history, anything that is part of the wheels/tires/rims/brakes — goes here. It MUST be preserved.
- "dirtAreas" is RESTRICTIVE: only fresh, recently-deposited dust, pollen or water droplets on HORIZONTAL BODY PANELS (hood, roof, trunk lid). Nothing else qualifies.
- If unsure whether something is "dirt" or "wear" → classify as "existingWear". The pipeline preserves wear; misclassifying as dirt would erase real condition.
- NEVER put any of these in "dirtAreas": dirty wheels, dusty rims, brake dust on calipers/rotors, tire grime, mud splatter, dirty wheel arches, scratches, chips, dents, faded paint, rust, oxidation, swirl marks, scuffs, accumulated grime, anything on a vertical body panel.

Structure:
{
 "vehicle":{"brand":"","model":"","color":"EXACT paint color with hue AND finish (e.g. 'dark navy blue metallic', 'pearl white', 'silver grey', 'dark forest green', 'dark charcoal grey metallic'). NEVER collapse a dark blue, green or grey into just 'black'. Look carefully at the hue under ambient light.","bodyType":""},
 "orientation":{
   "visibleSide":"front | rear | left side | right side | front-left 3/4 | front-right 3/4 | rear-left 3/4 | rear-right 3/4",
   "describe":"one short sentence describing which side of the car faces the camera (e.g. 'the driver headlight is on the right of the frame; the car faces the camera from its front-left 3/4')"
 },
 "condition":{
   "existingWear":["EVERYTHING that must be preserved: scratches, chips, dents, faded paint, rust, oxidation, swirl marks, scuffs, AND ALSO the current state of the wheels (rim condition, brake dust, tire grime, tire wear, dirty wheel arches), AND any accumulated dirt on bumpers/sides/lower body. Be exhaustive — this list protects the used-car identity."],
   "wheelsState":"short factual description of the wheels as-is (e.g. 'alloy rims with brake dust on front-right, tires slightly dirty, small curb rash on front-right rim'). Whatever you write here, the pipeline will preserve untouched.",
   "dirtAreas":["RESTRICTIVE: only fresh dust/pollen/water droplets on horizontal body panels (hood, roof, trunk lid). Leave empty [] if there is nothing that clearly fits. Do NOT list wheels, sides, lower body, defects, or anything ambiguous."],
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
  const wheels = (c.wheelsState || "").trim() || "the wheels exactly as shown in the input — same dirt, same brake dust, same tire grime, same rim condition";
  const dirtList = (c.dirtAreas || []).filter(Boolean);
  const dirt = dirtList.length
    ? dirtList.join("; ")
    : "(none — leave the car untouched, do not clean anything)";
  const hasDirt = dirtList.length > 0;
  const reflections = (c.reflections || []).join("; ") || "unwanted glare and reflections";
  const logoLabel = (logoText || "").trim() || "AMERICAR";

  return [
    `Edit this exact photo of a ${v.color || ""} ${v.brand || ""} ${v.model || ""}. This is a REAL USED CAR on a dealership lot — the customer needs to see exactly how this specific unit looks today, not an idealized version.`,
    ``,
    `USED-CAR INTEGRITY — TOP RULE (overrides every other instruction):`,
    `- The car must come out of this edit looking IDENTICAL to the input in every aspect of its physical condition.`,
    `- DO NOT clean, polish, repair, restore, refresh, or "improve" the car in any way.`,
    `- DO NOT remove or attenuate ANY defect: scratches, chips, dents, swirl marks, paint fading, oxidation, rust, stone marks, bumper scuffs, curb rash. ALL stay, in the same place, with the same visibility.`,
    `- DO NOT touch the wheels under any circumstance. Wheels, rims, tires, brake calipers, brake discs, wheel arches and any dirt/dust/grime on them MUST remain exactly as in the input. Current wheel state: ${wheels}. The pipeline will reject any output where the wheels look cleaner, newer, or different in any way.`,
    `- DO NOT touch the lower body, sides, bumpers, or rocker panels. Any accumulated dirt or grime there stays.`,
    `- If you are unsure whether a mark on the car is dirt or wear → LEAVE IT AS-IS. Default to preservation.`,
    ``,
    `PAINT COLOR — ABSOLUTE RULE:`,
    `- The car's exact paint color is "${v.color || "as shown in the input"}".`,
    `- DO NOT change the hue, saturation, tone, or finish of the paint UNDER ANY CIRCUMSTANCE.`,
    `- DO NOT convert dark blue, dark green, dark charcoal grey or any dark color into black.`,
    `- DO NOT brighten, darken, shift, or "improve" the paint color in any way.`,
    `- Copy the paint color directly from the input image pixels — do not interpret, normalize, or stylize it.`,
    ``,
    `ORIENTATION (ABSOLUTE RULES — breaking any of these ruins the output):`,
    `- The visible side is "${o.visibleSide || "same as input"}". ${o.describe || ""}`,
    `- DO NOT mirror, flip or invert the image horizontally or vertically.`,
    `- DO NOT rotate the car. DO NOT change the camera angle, framing or perspective.`,
    `- If the driver's headlight is on the right of the frame in the input, it MUST be on the right of the frame in the output.`,
    `- Output the SAME SIDE of the car as the input. Never swap left and right.`,
    ``,
    `EXPLICIT PRESERVATION CHECKLIST (the output must look like the SAME used vehicle, NOT a new one):`,
    `- Keep every sign of age and use: ${wear}.`,
    `- Keep current paint condition: every existing scratch, chip, bumper scuff, faded area, stone mark stays in place.`,
    `- Keep the wheels EXACTLY as in the input: ${wheels}. Same rims, same tire wear, same brake dust pattern, same wheel arch dirt. No polishing.`,
    `- Keep the original body shape, proportions, trim, grille, headlights, mirrors, roof, window tint. No restyling.`,
    `- Do NOT make the car look newer, shinier or restored. Do NOT add showroom polish. The vehicle's lived-in character is the point.`,
    ``,
    `ALLOWED CHANGES (only these — nothing else):`,
    hasDirt
      ? `1. Remove ONLY recent, loose dust/pollen/water droplets from HORIZONTAL BODY PANELS (hood, roof, trunk lid): ${dirt}. NEVER touch wheels, sides, bumpers, or any vertical surface. If in doubt, leave it.`
      : `1. NO cleaning is allowed in this image. Do not remove any dirt, dust, or marks from the car. The car stays as-is.`,
    `2. Neutralize unwanted reflections and glare on body paint only: ${reflections}. Keep realistic metallic paint reflections. Do not touch wheels or trim.`,
    `3. Correct global exposure so the scene is evenly lit (${c.lighting || "balance highlights and shadows"}). Adjust lighting, not surfaces. Do not re-paint, do not re-color, do not smooth, do not retouch.`,
    `4. Replace the ORIGINAL BACKGROUND ONLY (everything that is NOT the car) with a virtual photo studio: near-white seamless cyclorama backdrop, light grey floor with a subtle realistic reflection of the car, soft overhead studio softbox lighting, controlled soft shadow under the vehicle.`,
    `5. Cover ONLY the license plate${p.location ? ` (located at ${p.location})` : ""} with a small dark rectangle containing the centered text "${logoLabel}" in clean minimalist white sans-serif typography. Do not cover anything else.`,
    ``,
    `FINAL CHECK before emitting the image: compare the car in your output against the input pixel-by-pixel. The car itself — paint, wheels, defects, dirt on body sides and wheels — must be visually indistinguishable from the input. Only the background, plate cover, and exposure should differ. Photorealistic DSLR result, not a 3D render.`,
  ].join("\n");
};

const buildEditPromptEs = (analysis, logoText) => {
  const v = analysis?.vehicle || {};
  const o = analysis?.orientation || {};
  const c = analysis?.condition || {};
  const p = analysis?.plate || {};
  const wear = (c.existingWear || []).join("; ") || "todo el desgaste existente";
  const wheels = (c.wheelsState || "").trim() || "las llantas tal cual aparecen en el input — misma suciedad, mismo brake dust, misma mugre en neumáticos, misma condición de los rines";
  const dirtList = (c.dirtAreas || []).filter(Boolean);
  const dirt = dirtList.length
    ? dirtList.join("; ")
    : "(ninguno — dejá el auto intacto, no limpies nada)";
  const hasDirt = dirtList.length > 0;
  const reflections = (c.reflections || []).join("; ") || "reflejos y brillos no deseados";
  const logoLabel = (logoText || "").trim() || "AMERICAR";

  return [
    `Editá esta foto exacta de un ${v.color || ""} ${v.brand || ""} ${v.model || ""}. Es un AUTO USADO REAL en el lote de una concesionaria — el cliente necesita ver exactamente cómo se ve esta unidad específica hoy, no una versión idealizada.`,
    ``,
    `INTEGRIDAD DEL AUTO USADO — REGLA SUPREMA (anula cualquier otra instrucción):`,
    `- El auto debe salir de esta edición IDÉNTICO al input en cada aspecto de su condición física.`,
    `- NO limpies, pulas, repares, restaures, refresques ni "mejores" el auto de ninguna manera.`,
    `- NO elimines ni atenúes NINGÚN defecto: rayones, chips, abolladuras, swirl marks, pintura desteñida, oxidación, óxido, marcas de piedras, scuffs en bumper, curb rash. TODO queda, en el mismo lugar, con la misma visibilidad.`,
    `- NO toques las llantas bajo ninguna circunstancia. Llantas, rines, neumáticos, calipers de freno, discos de freno, pasarruedas y cualquier suciedad/polvo/mugre sobre ellos DEBE quedar exactamente como en el input. Estado actual de las llantas: ${wheels}. El pipeline rechazará cualquier output donde las llantas se vean más limpias, más nuevas o distintas de cualquier modo.`,
    `- NO toques la parte inferior del cuerpo, los lados, los bumpers ni los rocker panels. Cualquier suciedad o mugre acumulada ahí queda.`,
    `- Si tenés dudas de si una marca en el auto es suciedad o desgaste → DEJALA TAL CUAL. El default es preservación.`,
    ``,
    `COLOR DE LA PINTURA — REGLA ABSOLUTA:`,
    `- El color exacto de la pintura es "${v.color || "el que se ve en el input"}".`,
    `- NO cambies el tono, saturación, matiz ni finish de la pintura BAJO NINGUNA CIRCUNSTANCIA.`,
    `- NO conviertas azul oscuro, verde oscuro, gris carbón oscuro ni ningún color oscuro en negro.`,
    `- NO aclares, oscurezcas, desplaces ni "mejores" el color de la pintura de ninguna manera.`,
    `- Copiá el color de la pintura directamente desde los pixels del input — no lo interpretes, normalices ni estilices.`,
    ``,
    `ORIENTACIÓN (REGLAS ABSOLUTAS — romper cualquiera arruina el output):`,
    `- El lado visible es "${o.visibleSide || "el mismo que el input"}". ${o.describe || ""}`,
    `- NO espejes, voltees ni inviertas la imagen horizontal ni verticalmente.`,
    `- NO rotes el auto. NO cambies el ángulo de cámara, el encuadre ni la perspectiva.`,
    `- Si el faro del conductor está a la derecha del cuadro en el input, DEBE estar a la derecha del cuadro en el output.`,
    `- Devolvé EL MISMO LADO del auto que el input. Nunca intercambies izquierda y derecha.`,
    ``,
    `CHECKLIST EXPLÍCITO DE PRESERVACIÓN (el output debe verse como el MISMO vehículo usado, NO uno nuevo):`,
    `- Conservá cada signo de edad y uso: ${wear}.`,
    `- Conservá la condición actual de la pintura: cada rayón existente, chip, scuff de bumper, área desteñida, marca de piedra queda en su lugar.`,
    `- Conservá las llantas EXACTAMENTE como en el input: ${wheels}. Mismos rines, mismo desgaste de neumáticos, mismo patrón de brake dust, misma suciedad de pasarruedas. Sin pulir.`,
    `- Conservá la forma original del cuerpo, proporciones, trim, parrilla, faros, espejos, techo, tinte de ventanas. Sin restyling.`,
    `- NO hagas que el auto se vea más nuevo, más brillante ni restaurado. NO agregues showroom polish. El carácter "vivido" del vehículo es el punto.`,
    ``,
    `CAMBIOS PERMITIDOS (solamente estos — nada más):`,
    hasDirt
      ? `1. Quitá SOLO polvo, polen o gotas de agua RECIÉN DEPOSITADAS de PANELES HORIZONTALES DEL CUERPO (capó, techo, baúl): ${dirt}. NUNCA toques llantas, lados, bumpers, ni ninguna superficie vertical. Si hay duda, dejalo.`
      : `1. NO se permite ninguna limpieza en esta imagen. No remuevas suciedad, polvo ni marcas del auto. El auto queda tal cual.`,
    `2. Neutralizá reflejos y brillos no deseados solo en la pintura del cuerpo: ${reflections}. Mantené reflejos metálicos realistas en la pintura. No toques llantas ni trim.`,
    `3. Corregí la exposición global para que la escena quede pareja (${c.lighting || "balanceá highlights y sombras"}). Ajustá iluminación, no superficies. NO repintes, NO recolores, NO suavices, NO retoques.`,
    `4. Reemplazá SOLO EL FONDO ORIGINAL (todo lo que NO es el auto) por un estudio fotográfico virtual: cyclorama blanco roto seamless, piso gris claro con un reflejo sutil y realista del auto, luz suave de softbox cenital, sombra suave controlada bajo el vehículo.`,
    `5. Cubrí ÚNICAMENTE la patente${p.location ? ` (ubicada en ${p.location})` : ""} con un rectángulo oscuro pequeño que contenga centrado el texto "${logoLabel}" en tipografía sans-serif blanca, minimalista y limpia. No cubras nada más.`,
    ``,
    `CHEQUEO FINAL antes de emitir la imagen: compará el auto del output contra el input pixel por pixel. El auto en sí — pintura, llantas, defectos, suciedad en lados del cuerpo y en llantas — debe ser visualmente indistinguible del input. Solo el fondo, el cuadro sobre la patente y la exposición pueden diferir. Resultado fotorrealista de DSLR, no un render 3D.`,
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
        const result = await analyzeWithOpenAI(env, body.image, body.mime);
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
        const analysis = await analyzeWithOpenAI(env, body.image, body.mime);
        const prompt = buildEditPrompt(analysis, body.logoText);
        const promptEs = buildEditPromptEs(analysis, body.logoText);
        const image = await editWithNanoBanana(env, body.image, body.mime, prompt);
        return json({ image, analysis, promptUsed: prompt, promptUsedEs: promptEs, editor: "gemini-2.5-flash-image" }, 200, cors);
      }

      return json({ error: "unknown action" }, 400, cors);
    } catch (err) {
      return json({ error: err.message || String(err) }, 500, cors);
    }
  },
};

async function analyzeWithOpenAI(env, imageB64, mime) {
  if (!env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY not configured on worker — run `npx wrangler secret put OPENAI_API_KEY`.");
  }
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      max_tokens: 4000,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: ANALYZE_INSTRUCTION },
            { type: "image_url", image_url: { url: `data:${mime || "image/jpeg"};base64,${imageB64}` } },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`openai ${res.status}: ${text.slice(0, 300)}`);
  }
  const data = await res.json();
  const text = (data?.choices?.[0]?.message?.content || "").trim();
  const cleaned = text.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try { return JSON.parse(cleaned.slice(start, end + 1)); } catch {}
    }
    throw new Error("OpenAI did not return valid JSON. Raw (first 800): " + text.slice(0, 800));
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
