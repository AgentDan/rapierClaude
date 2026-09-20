import { Router } from "express";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CATALOG_PATH = path.join(__dirname, "..", "catalog", "catalog.json");

function readCatalog() {
  return JSON.parse(readFileSync(CATALOG_PATH, "utf-8"));
}

const router = Router();

router.get("/catalog", (req, res) => {
  res.json(readCatalog());
});

export default router;
