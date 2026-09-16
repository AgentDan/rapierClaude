# deskOS — minimal working skeleton

An AI workspace configurator skeleton: a Node.js/Express server that serves
a product catalog and handles model uploads, and a Three.js + Rapier client
that renders a scene and simulates physics (no frontend framework).

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
│   ├── catalog-engine/{graph.js, validate.js}
│   ├── storage/client.js
│   └── server.js
├── client/
│   ├── renderer/scene.js
│   ├── physics/{world.js, bodies.js, host-constraint.js, sync.js, registry.js}
│   ├── index.html
│   └── main.js
├── scripts/create-bucket.js
├── package.json
└── README.md
```

Units: the catalog and everything server-side uses millimetres. The client
physics layer uses metres. The mm → m conversion happens in exactly one
place: [client/physics/bodies.js](client/physics/bodies.js).

## 1. Set up storage

You need an S3-compatible object store. Pick one:

### Option A — run MinIO locally (no Docker)

Download the MinIO server binary directly and run it:

**Linux / macOS:**

```bash
curl -O https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio
./minio server ./data --console-address ":9001"
```

**Windows:**

Download `minio.exe` from the official MinIO download page
(https://min.io/docs/minio/windows/index.html) and run it from PowerShell:

```powershell
.\minio.exe server .\data --console-address ":9001"
```

MinIO's S3 API listens on `http://localhost:9000` by default, and its web
console on `http://localhost:9001` (default credentials: `minioadmin` /
`minioadmin`, unless overridden with `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD`).

Leave it running in its own terminal.

### Option B — use Cloudflare R2 or AWS S3 directly

Skip installing MinIO. Just put real credentials in `.env` — the code in
[server/storage/client.js](server/storage/client.js) works identically either
way; only `S3_ENDPOINT` changes (e.g. your R2 account endpoint, or
`https://s3.<region>.amazonaws.com` for AWS).

## 2. Install dependencies

```bash
npm install
```

## 3. Configure environment

Copy `.env.example` to `.env` and adjust values (bucket name, keys, endpoint)
to match whichever storage option you picked above.

```bash
cp .env.example .env
```

## 4. Create the bucket

Run once, manually (not automatic on server start):

```bash
node scripts/create-bucket.js
```

This creates the `deskos-media` bucket (if it doesn't already exist) and, if
`STORAGE_PUBLIC=true` in `.env`, enables public read access on the
`products/` prefix.

## 5. Run the server

```bash
npm run dev:server
```

Validates `server/catalog/catalog.json` on startup (unique SKUs, required
fields) and exits with an error if it's invalid. Listens on `PORT` from
`.env` (default `3000`).

## 6. Run the client

In a second terminal:

```bash
npm run dev:client
```

Starts the Vite dev server (default `http://localhost:5173`), proxying
`/api/*` requests to the Express server on port 3000.

## 7. Open it in a browser

Go to `http://localhost:5173`. You should see a desk sitting on an
(invisible) floor, and a monitor dropping onto it and coming to rest on top
— not falling through. That's the minimal skeleton criterion.

## API

- `GET /api/catalog` — returns the full catalog.
- `POST /api/products/:sku/model` — upload a `.glb` model (multipart field
  `model`, 50 MB limit); updates `media.model3d` for that product.
- `GET /api/products/:sku/model-url` — returns the public URL of a product's
  uploaded model.
