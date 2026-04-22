# Americar Photo AI

Propuesta técnica v3.0 para automatizar la mejora de fotos de vehículos usados usando OpenAI `gpt-image-1`.

**Flujo:** upload → marcar patente → limpieza + fondo estudio con IA → overlay del logo Americar sobre la patente → descarga JPG.

## Stack

- **Frontend:** React 18 + Vite + TailwindCSS
- **Backend:** Cloudflare Worker (proxy que custodia la API key)
- **IA:** OpenAI `gpt-image-1` vía `/v1/images/edits`
- **Hosting:** GitHub Pages (frontend) + Cloudflare Workers (backend)

## Desarrollo local

```bash
# 1. Frontend
npm install
npm run dev                  # http://localhost:5173

# 2. Worker (en otra terminal)
cd worker
npm install
echo 'OPENAI_API_KEY=sk-...' > .dev.vars
npx wrangler dev             # http://localhost:8787
```

Abrí la pestaña **Demo**, expandí "Configuración" y pegá `http://localhost:8787` como Worker URL.

## Despliegue

**Worker:**
```bash
cd worker
npx wrangler login
npx wrangler secret put OPENAI_API_KEY
npx wrangler deploy
```

**Frontend (GitHub Pages):**
```bash
npm run build
# publicar dist/ en la rama gh-pages
```

Editá `worker/wrangler.toml` → `ALLOWED_ORIGIN` con el dominio final de GitHub Pages y re-deploy.

## Estructura

```
americar-photo-ai/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── public/
│   └── americar-logo.png
├── src/
│   ├── main.jsx
│   ├── index.css
│   ├── App.jsx
│   └── tabs/
│       ├── Resumen.jsx
│       ├── Arquitectura.jsx
│       ├── Pipeline.jsx
│       ├── Demo.jsx
│       ├── Costos.jsx
│       └── Roadmap.jsx
└── worker/
    ├── worker.js
    ├── wrangler.toml
    └── package.json
```
