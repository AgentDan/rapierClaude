import { Router } from "express";
import { readCatalog, readQuestionnaire } from "../config/load.js";
import { loadProfile, saveProfile } from "../dialog/profile-store.js";
import { getNextQuestion } from "../dialog/engine/question-engine.js";

const router = Router();

function isSafeClientId(clientId) {
  return typeof clientId === "string" && /^[A-Za-z0-9_-]+$/.test(clientId);
}

router.get("/catalog", (req, res) => {
  res.json(readCatalog().draft);
});

router.get("/dialog/next", (req, res) => {
  const clientId = req.query.clientId;
  if (!isSafeClientId(clientId)) {
    return res.status(400).json({ error: "invalid clientId" });
  }

  const questionnaire = readQuestionnaire();
  const profile = loadProfile(clientId);
  const next = getNextQuestion(questionnaire, profile);
  res.json({ question: next ? next.question : null });
});

router.post("/dialog/answer", (req, res) => {
  const { clientId, questionId, optionId } = req.body ?? {};
  if (!isSafeClientId(clientId)) {
    return res.status(400).json({ error: "invalid clientId" });
  }

  const questionnaire = readQuestionnaire();
  const question = (questionnaire.draft.questions ?? []).find((q) => q.id === questionId);
  if (!question) {
    return res.status(404).json({ error: "unknown question" });
  }

  const option = (question.options ?? []).find((opt) => opt.id === optionId);
  if (!option) {
    return res.status(400).json({ error: "unknown option" });
  }

  const profile = loadProfile(clientId);
  profile.fields[questionId] = {
    value: optionId,
    source: "stated",
    confidence: "high"
  };
  saveProfile(profile);
  res.json({ ok: true });
});

export default router;
