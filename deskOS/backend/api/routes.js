import { Router } from "express";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CATALOG_PATH = path.join(__dirname, "..", "..", "storage", "config", "catalog.json");

function readCatalogDraft() {
  const catalog = JSON.parse(readFileSync(CATALOG_PATH, "utf-8"));
  return catalog.draft;
}

const router = Router();

router.get("/catalog", (req, res) => {
  res.json(readCatalogDraft());
});

export default router;
