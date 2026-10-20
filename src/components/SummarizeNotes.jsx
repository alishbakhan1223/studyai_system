import React, { useState } from "react";
import { askGemini } from "../gemini";
import * as pdfjsLib from "pdfjs-dist";

// Use standard unpkg worker URL
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export default function SummarizeNotes() {
  const [textInput, setTextInput] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [fileName, setFileName] = useState("");

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setExtracting(true);
    setTextInput("Reading PDF contents...");

    try {
      const reader = new FileReader();
      reader.onload = async function () {
        try {
          const typedarray = new Uint8Array(this.result);
          const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
          let extractedText = "";

          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const textItems = textContent.items.map((item) => item.str);
            extractedText += textItems.join(" ") + "\n";
          }

          if (extractedText.trim().length > 0) {
            setTextInput(extractedText);
          } else {
            setTextInput("No text found in PDF. Please paste text manually.");
            alert("PDF se text extract nahi ho saka. Aap text copy karke yahan paste kar sakte hain.");
          }
        } catch (innerErr) {
          console.error("PDF internal error:", innerErr);
          setTextInput("");
          alert("Error parsing PDF. Please paste text directly.");
        } finally {
          setExtracting(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error("File Reader Error:", err);
      setExtracting(false);
      alert("Could not read file.");
    }
  };

  const handleSummarize = async () => {
    if (!textInput.trim() || textInput.startsWith("Reading PDF") || extracting) {
      alert("Pehle valid text ya PDF upload karein!");
      return;
    }

    setLoading(true);
    setSummary("");

    const prompt = `Summarize these study notes clearly into structured bullet points:\n\n${textInput.substring(0, 4000)}`;
    const res = await askGemini(prompt);
    setSummary(res);
    setLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    alert("Summary copied!");
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([summary], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "Summary.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div style={{ background: "#fff", padding: "20px", borderRadius: "15px", border: "1px solid #ffe4e1" }}>
      <h2 style={{ color: "#d81b60", marginBottom: "15px" }}>📝 Summarize Notes</h2>

      {/* PDF Upload */}
      <div style={{ marginBottom: "15px", background: "#fff5f8", padding: "12px", borderRadius: "10px", border: "1px dashed #ec407a" }}>
        <label style={{ fontWeight: "bold", color: "#d81b60", display: "block", marginBottom: "5px" }}>
          📄 Select PDF File:
        </label>
        <input 
          type="file" 
          accept="application/pdf" 
          onChange={handleFileUpload}
          style={{ cursor: "pointer" }}
        />
        {fileName && <span style={{ marginLeft: "10px", color: "#4caf50", fontWeight: "bold" }}>✓ {fileName}</span>}
      </div>

      {/* Text Area */}
      <textarea
        value={textInput}
        onChange={(e) => setTextInput(e.target.value)}
        placeholder="PDF ka text yahan aayega, ya aap direct text paste kar sakte hain..."
        rows={7}
        style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #f8bbd0", resize: "vertical", marginBottom: "15px" }}
      />

      <button
        onClick={handleSummarize}
        disabled={loading || extracting}
        style={{ 
          background: (loading || extracting) ? "#ccc" : "#ec407a", 
          color: "#fff", 
          border: "none", 
          padding: "12px 24px", 
          borderRadius: "8px", 
          cursor: (loading || extracting) ? "not-allowed" : "pointer", 
          fontWeight: "bold", 
          width: "100%" 
        }}
      >
        {extracting ? "Reading PDF..." : loading ? "Summarizing..." : "Summarize Now"}
      </button>

      {/* Output */}
      {summary && (
        <div style={{ marginTop: "20px", padding: "15px", background: "#fff5f8", borderRadius: "10px", border: "1px solid #f8bbd0" }}>
          <h3 style={{ color: "#d81b60", marginTop: 0 }}>📋 Summary Result:</h3>
          <div style={{ whiteSpace: "pre-wrap", color: "#333", lineHeight: "1.6" }}>{summary}</div>
          
          <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
            <button
              onClick={handleCopy}
              style={{ background: "#ec407a", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
            >
              📋 Copy Summary
            </button>
            <button
              onClick={handleDownload}
              style={{ background: "#d81b60", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
            >
              📥 Download Notes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}