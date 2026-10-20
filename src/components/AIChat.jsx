import React, { useState, useRef } from "react";
import { askGemini } from "../gemini";

export default function AIChat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState("english"); // Options: "english" | "roman-urdu"
  const abortControllerRef = useRef(null);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput("");

    const newMessages = [...messages, { sender: "user", text: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    // Create a new controller so user can click Stop
    abortControllerRef.current = new AbortController();

    const reply = await askGemini(
      userMsg, 
      language, 
      abortControllerRef.current.signal
    );

    setMessages([...newMessages, { sender: "ai", text: reply }]);
    setLoading(false);
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setLoading(false);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    alert("Text copied to clipboard!");
  };

  return (
    <div style={{ background: "#fff", padding: "20px", borderRadius: "15px", border: "1px solid #ffe4e1" }}>
      {/* Header & Language Selector */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
        <h2 style={{ color: "#d81b60", margin: 0 }}>💬 AI Study Chat</h2>
        <div>
          <label style={{ fontSize: "14px", color: "#d81b60", marginRight: "8px", fontWeight: "bold" }}>
            Language:
          </label>
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)}
            style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid #f8bbd0", background: "#fff", color: "#d81b60", cursor: "pointer" }}
          >
            <option value="english">English</option>
            <option value="roman-urdu">Roman Urdu</option>
          </select>
        </div>
      </div>

      {/* Chat Messages */}
      <div style={{ height: "320px", overflowY: "auto", border: "1px solid #f8bbd0", padding: "12px", borderRadius: "10px", marginBottom: "15px" }}>
        {messages.map((m, i) => (
          <div key={i} style={{ textAlign: m.sender === "user" ? "right" : "left", margin: "10px 0" }}>
            <div style={{ display: "inline-block", maxWidth: "80%", textAlign: "left" }}>
              <span style={{ 
                background: m.sender === "user" ? "#ec407a" : "#f8bbd0", 
                color: m.sender === "user" ? "#fff" : "#000", 
                padding: "10px 14px", 
                borderRadius: "12px", 
                display: "block",
                whiteSpace: "pre-wrap"
              }}>
                {m.text}
              </span>
              {m.sender === "ai" && m.text && (
                <button 
                  onClick={() => handleCopy(m.text)}
                  style={{ background: "none", border: "none", color: "#d81b60", fontSize: "12px", cursor: "pointer", marginTop: "4px", padding: 0 }}
                >
                  📋 Copy Text
                </button>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ textAlign: "left", margin: "8px 0" }}>
            <span style={{ background: "#f8bbd0", color: "#d81b60", padding: "8px 12px", borderRadius: "12px", display: "inline-block", fontStyle: "italic" }}>
              {language === "roman-urdu" ? "Soch raha hai..." : "Thinking..."}
            </span>
          </div>
        )}
      </div>

      {/* Input Form & Buttons */}
      <form onSubmit={handleSend} style={{ display: "flex", gap: "10px" }}>
        <input 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          placeholder={language === "roman-urdu" ? "Kuch bhi poochien..." : "Ask anything..."} 
          style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #f8bbd0" }} 
        />
        
        {loading ? (
          <button 
            type="button" 
            onClick={handleStop}
            style={{ background: "#e53935", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}
          >
            Stop
          </button>
        ) : (
          <button 
            type="submit" 
            style={{ background: "#ec407a", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}
          >
            Send
          </button>
        )}
      </form>
    </div>
  );
}