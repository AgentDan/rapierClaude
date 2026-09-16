import { Router } from "express";
import multer from "multer";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { uploadFile } from "../storage/client.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CATALOG_PATH = path.join(__dirname, "..", "catalog", "catalog.json");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50 MB
});

function readCatalog() {
  return JSON.parse(readFileSync(CATALOG_PATH, "utf-8"));
}

function writeCatalog(catalog) {
  writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2));
}

const router = Router();

router.get("/catalog", (req, res) => {
  res.json(readCatalog());
});

router.post("/products/:sku/model", upload.single("model"), async (req, res) => {
  const { sku } = req.params;

  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded (expected field \"model\")" });
  }
  if (!req.file.originalname.toLowerCase().endsWith(".glb")) {
    return res.status(400).json({ error: "Only .glb files are accepted" });
  }

  const catalog = readCatalog();
  const product = catalog.products.find((p) => p.sku === sku);
  if (!product) {
    return res.status(404).json({ error: `Unknown sku "${sku}"` });
  }

  const key = `products/${sku}/model.glb`;

  try {
    const url = await uploadFile(key, req.file.buffer, "model/gltf-binary");
    product.media = product.media || {};
    product.media.model3d = url;
    writeCatalog(catalog);
    res.json({ sku, model3d: url });
  } catch (err) {
    res.status(502).json({ error: `Upload to storage failed: ${err.message}` });
  }
});

router.get("/products/:sku/model-url", (req, res) => {
  const { sku } = req.params;
  const catalog = readCatalog();
  const product = catalog.products.find((p) => p.sku === sku);

  if (!product) {
    return res.status(404).json({ error: `Unknown sku "${sku}"` });
  }
  if (!product.media || !product.media.model3d) {
    return res.status(404).json({ error: `No model uploaded for sku "${sku}"` });
  }

  res.json({ sku, model3d: product.media.model3d });
});

export default router;
