import { runChat } from "../server/aiCore.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ text: "Method not allowed" });

  const { prompt, language } = req.body || {};
  if (typeof prompt !== "string" || !prompt.trim()) return res.status(400).json({ text: "Empty prompt" });
  if (prompt.length > 60_000) return res.status(413).json({ text: "Prompt too long" });

  const out = await runChat({ prompt, language, env: process.env });
  res.status(200).json({ text: out.text });
}