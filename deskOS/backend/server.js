import "dotenv/config";
import express from "express";
import cors from "cors";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateDialogData } from "./dialog/validate-dialog-data.js";
import apiRoutes from "./api/routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_DIR = path.join(__dirname, "..", "storage", "config");
const QUESTIONNAIRE_PATH = path.join(CONFIG_DIR, "questionnaire.json");
const CATALOG_PATH = path.join(CONFIG_DIR, "catalog.json");

const questionnaire = JSON.parse(readFileSync(QUESTIONNAIRE_PATH, "utf-8"));
const catalog = JSON.parse(readFileSync(CATALOG_PATH, "utf-8"));

try {
  validateDialogData({ questionnaire, catalog });
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
