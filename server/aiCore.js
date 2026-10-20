// Server-side AI core (runs on Vercel function / Vite dev server). Keys never reach the browser.
// Order: Gemini -> Groq -> OpenAI. Auto-fallback on error/limit/timeout, auto-discovers model if name is retired.

const TIMEOUT_MS = 15_000;
const COOLDOWN_MS = 60_000;
const cooldownUntil = {};

const makeProviders = (env) => [
  {
    name: "Gemini",
    type: "gemini",
    key: env.GEMINI_API_KEY,
    model: env.GEMINI_MODEL || "gemini-3.8-flash",
    pick: (id) => /flash/.test(id) && !/lite|image|tts|live|embed|audio|exp|thinking|robotics|computer|learnlm/.test(id),
  },
  {
    name: "Groq",
    type: "openai",
    key: env.GROQ_API_KEY,
    url: "https://api.groq.com/openai/v1",
    model: env.GROQ_MODEL || "llama-3.3-70b-versatile",
    pick: (id) => /llama|gpt-oss|qwen|kimi/.test(id) && !/whisper|guard|tts|playai|safeguard|orpheus/.test(id),
  },
  {
    name: "OpenAI",
    type: "openai",
    key: env.OPENAI_API_KEY,
    url: "https://api.openai.com/v1",
    model: env.OPENAI_MODEL || "gpt-4o-mini",
    pick: (id) => /^gpt-4o-mini|^gpt-4\.1-mini|^gpt-5.*mini/.test(id),
  },
];

let cachedProviders = null;

const timedFetch = async (url, opts = {}) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...opts, signal: controller.signal });
  } catch (err) {
    if (err.name === "AbortError") {
      const e = new Error(`Timeout (${TIMEOUT_MS / 1000}s)`);
      e.status = 408;
      throw e;
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
};

const readJson = async (res) => {
  try {
    return await res.json();
  } catch {
    return null;
  }
};

const makeError = (res, data) => {
  const err = new Error(data?.error?.message || data?.[0]?.error?.message || `HTTP ${res.status}`);
  err.status = res.status;
  return err;
};

const callOnce = async (p, model, prompt) => {
  if (p.type === "gemini") {
    const res = await timedFetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: { "x-goog-api-key": p.key, "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );
    const data = await readJson(res);
    if (!res.ok || data?.error) throw makeError(res, data);
    const text = data?.candidates?.[0]?.content?.parts?.map((x) => x.text).join("");
    if (!text) throw new Error("Empty response");
    return text;
  }
  const res = await timedFetch(`${p.url}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${p.key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }] }),
  });
  const data = await readJson(res);
  if (!res.ok || data?.error) throw makeError(res, data);
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("Empty response");
  return text;
};

const discoverModels = async (p) => {
  let ids = [];
  if (p.type === "gemini") {
    const res = await timedFetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=200", {
      headers: { "x-goog-api-key": p.key },
    });
    const data = await readJson(res);
    ids = (data?.models || [])
      .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
      .map((m) => m.name.replace("models/", ""));
  } else {
    const res = await timedFetch(`${p.url}/models`, { headers: { Authorization: `Bearer ${p.key}` } });
    const data = await readJson(res);
    ids = (data?.data || []).map((m) => m.id);
  }
  return ids.filter(p.pick).sort().reverse();
};

const callProvider = async (p, prompt) => {
  try {
    return await callOnce(p, p.model, prompt);
  } catch (err) {
    if (err.status !== 404 && err.status !== 400) throw err;
    const candidates = (await discoverModels(p)).filter((m) => m !== p.model);
    let lastErr = err;
    for (const m of candidates.slice(0, 3)) {
      try {
        const out = await callOnce(p, m, prompt);
        p.model = m;
        return out;
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr;
  }
};

export const runChat = async ({ prompt, language = "english", env }) => {
  if (!cachedProviders) cachedProviders = makeProviders(env);
  const langPrefix =
    language === "roman-urdu" ? "Please reply in concise Roman Urdu: " : "Please reply in concise English: ";
  const fullPrompt = langPrefix + prompt;

  const available = cachedProviders.filter((p) => p.key && !(cooldownUntil[p.name] > Date.now()));
  if (available.length === 0) {
    return { ok: false, text: "Error: Koi API key set nahi hai (ya sab limits khatam hain)." };
  }

  const failures = [];
  for (const p of available) {
    try {
      return { ok: true, text: await callProvider(p, fullPrompt) };
    } catch (err) {
      console.warn(`[${p.name}] failed:`, err.message);
      failures.push(`${p.name}: ${err.message}`);
      if ([429, 402, 408].includes(err.status)) cooldownUntil[p.name] = Date.now() + COOLDOWN_MS;
    }
  }
  return { ok: false, text: "Sab AI providers fail ho gaye:\n" + failures.join("\n") };
};