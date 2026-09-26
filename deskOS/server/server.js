import "dotenv/config";
import express from "express";
import cors from "cors";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateCatalog } from "./catalog-engine/validate.js";
import { validateDialogData } from "../backend/dialog/validate-dialog-data.js";
import apiRoutes from "./api/routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CATALOG_PATH = path.join(__dirname, "catalog", "catalog.json");
const DIALOG_QUESTIONNAIRE_PATH = path.join(__dirname, "..", "storage", "config", "questionnaire.json");
const DIALOG_CATALOG_PATH = path.join(__dirname, "..", "storage", "config", "catalog.json");

const catalog = JSON.parse(readFileSync(CATALOG_PATH, "utf-8"));
const questionnaire = JSON.parse(readFileSync(DIALOG_QUESTIONNAIRE_PATH, "utf-8"));
const dialogCatalog = JSON.parse(readFileSync(DIALOG_CATALOG_PATH, "utf-8"));

try {
  validateCatalog(catalog);
} catch (err) {
  console.error("Failed to start server: catalog is invalid.");
  console.error(err.message);
  process.exit(1);
}

try {
  validateDialogData({ questionnaire, catalog: dialogCatalog });
  console.log("Dialog data is valid.");
} catch (err) {
  console.error("Failed to start server: dialog data is invalid.");
  console.error(err.message);
  process.exit(1);
}

const app = express();
app.use(cors());
app.use("/api", apiRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`deskOS server listening on http://localhost:${PORT}`);
});
