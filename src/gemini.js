// Frontend helper: calls our own /api/chat (keys stay on the server).
// Name `askGemini` kept so existing components work unchanged.

export const askGemini = async (prompt, language = "english", signal = null) => {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, language }),
      signal,
    });
    const data = await res.json().catch(() => null);
    return data?.text || "No response received. Please try again!";
  } catch (error) {
    if (error.name === "AbortError") return "Response stopped by user.";
    console.error("Fetch Error:", error);
    return "Network error! Please check your internet connection.";
  }
};