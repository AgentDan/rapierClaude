# deskOS — minimal working skeleton

An AI workspace configurator skeleton: a Node.js/Express server that serves
a product catalog, and a Three.js + Rapier client that renders a scene and
simulates physics (no frontend framework).

This is a skeleton, not a full product. The goal: the server returns data,
the client builds a scene and simulates physics on it. Success criterion:
a desk rests on an invisible floor, and a monitor drops onto the desk and
stays on it instead of falling through.

## Project structure

```
deskOS/
├── server/
│   ├── api/routes.js
│   ├── catalog/catalog.json
│   ├── catalog-engine/validate.js
│   └── server.js
├── client/
│   ├── renderer/scene.js
│   ├── physics/{world.js, bodies.js, sync.js, registry.js}
│   ├── index.html
│   └── main.js
├── package.json
└── README.md
```

Units: the catalog and everything server-side uses millimetres. The client
physics layer uses metres. The mm → m conversion happens in exactly one
place: [client/physics/bodies.js](client/physics/bodies.js).

## 1. Install dependencies

```bash
npm install
```

## 2. Configure environment

Copy `.env.example` to `.env`. The only setting is `PORT` (default `3000`).

```bash
cp .env.example .env
```

## 3. Run the app

```bash
npm run dev
```

Starts the Express API and the Vite client together. The catalog is
validated on server start (unique SKUs, required fields); an invalid
catalog exits with an error. The API listens on `PORT` from `.env`
(default `3000`). Vite is at `http://localhost:5173` and proxies
`/api/*` to the Express server.

To run them separately (two terminals): `npm run dev:server` and
`npm run dev:client`.

## 4. Open it in a browser

Go to `http://localhost:5173`. You should see a desk sitting on an
(invisible) floor, and a monitor dropping onto it and coming to rest on top
— not falling through. That's the minimal skeleton criterion.

## API

- `GET /api/catalog` — returns the full catalog.
