import React, { useState } from "react";
import { askGemini } from "../gemini";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export default function GenerateMCQs() {
  const [textInput, setTextInput] = useState("");
  const [mcqCount, setMcqCount] = useState(5); // Default 5 MCQs
  const [mcqsData, setMcqsData] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [showResults, setShowResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [fileName, setFileName] = useState("");

  // PDF Text Extraction
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setExtracting(true);
    setTextInput("Reading PDF contents for MCQs...");

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
            setTextInput("");
            alert("No text found in PDF. Please paste text manually.");
          }
        } catch (innerErr) {
          console.error("PDF internal error:", innerErr);
          setTextInput("");
          alert("Error parsing PDF.");
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

  // Generate MCQs based on selected count
  const handleGenerateMCQs = async () => {
    if (!textInput.trim() || extracting) {
      alert("Please upload a PDF or paste text first!");
      return;
    }

    setLoading(true);
    setMcqsData([]);
    setUserAnswers({});
    setShowResults({});

    const prompt = `Based on the following notes, generate exactly ${mcqCount} multiple-choice questions (MCQs). 
You MUST reply strictly in valid JSON format as an array of objects without any markdown code block formatting like \`\`\`json or backticks.
Each object must have these exact keys:
- "question": string
- "options": array of 4 strings
- "correct": exact string matching the correct option from options
- "explanation": string explaining why the answer is correct in English.

Content:
${textInput.substring(0, 5000)}`;

    try {
      const res = await askGemini(prompt);
      let cleanRes = res.trim();
      if (cleanRes.startsWith("```json")) cleanRes = cleanRes.replace(/^```json/, "");
      if (cleanRes.startsWith("```")) cleanRes = cleanRes.replace(/^```/, "");
      if (cleanRes.endsWith("```")) cleanRes = cleanRes.slice(0, -3);

      const parsedMCQs = JSON.parse(cleanRes.trim());
      setMcqsData(parsedMCQs);
    } catch (err) {
      console.error("MCQ Parsing Error:", err);
      alert("Error generating MCQs. Please try again!");
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (qIndex, option) => {
    setUserAnswers({ ...userAnswers, [qIndex]: option });
    setShowResults({ ...showResults, [qIndex]: true });
  };

  // Calculate final score
  const correctCount = Object.keys(userAnswers).filter(
    (qIndex) => userAnswers[qIndex] === mcqsData[qIndex]?.correct
  ).length;

  const isAllAnswered = mcqsData.length > 0 && Object.keys(userAnswers).length === mcqsData.length;

  return (
    <div style={{ background: "#fff", padding: "20px", borderRadius: "15px", border: "1px solid #ffe4e1" }}>
      <h2 style={{ color: "#d81b60", marginBottom: "15px" }}>❓ Generate MCQs Quiz</h2>

      {/* PDF Upload Section */}
      <div style={{ marginBottom: "15px", background: "#fff5f8", padding: "12px", borderRadius: "10px", border: "1px dashed #ec407a" }}>
        <label style={{ fontWeight: "bold", color: "#d81b60", display: "block", marginBottom: "5px" }}>
          📄 Select PDF File or Paste Notes:
        </label>
        <input 
          type="file" 
          accept="application/pdf" 
          onChange={handleFileUpload}
          style={{ cursor: "pointer" }}
        />
        {fileName && <span style={{ marginLeft: "10px", color: "#4caf50", fontWeight: "bold" }}>✓ {fileName}</span>}
      </div>

      {/* MCQ Count Selector */}
      <div style={{ marginBottom: "15px", display: "flex", alignItems: "center", gap: "10px" }}>
        <label style={{ fontWeight: "bold", color: "#d81b60" }}>Number of MCQs:</label>
        <select 
          value={mcqCount} 
          onChange={(e) => setMcqCount(Number(e.target.value))}
          style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #f8bbd0", fontWeight: "bold", cursor: "pointer" }}
        >
          <option value={5}>5 MCQs</option>
          <option value={10}>10 MCQs</option>
          <option value={15}>15 MCQs</option>
          <option value={20}>20 MCQs</option>
          <option value={30}>30 MCQs</option>
        </select>
      </div>

      {/* Text Area */}
      <textarea
        value={textInput}
        onChange={(e) => setTextInput(e.target.value)}
        placeholder="PDF text will appear here, or you can paste notes directly..."
        rows={5}
        style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #f8bbd0", resize: "vertical", marginBottom: "15px" }}
      />

      <button
        onClick={handleGenerateMCQs}
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
        {extracting ? "Reading PDF..." : loading ? "Generating Quiz..." : "Generate MCQs Now"}
      </button>

      {/* MCQ Quiz Display */}
      {mcqsData.length > 0 && (
        <div style={{ marginTop: "25px" }}>
          <h3 style={{ color: "#d81b60" }}>🎯 Practice Quiz:</h3>
          {mcqsData.map((mcq, qIndex) => {
            const isAnswered = showResults[qIndex];
            const selectedOpt = userAnswers[qIndex];
            const isCorrect = selectedOpt === mcq.correct;

            return (
              <div key={qIndex} style={{ marginBottom: "20px", padding: "15px", background: "#fff5f8", borderRadius: "10px", border: "1px solid #f8bbd0" }}>
                <p style={{ fontWeight: "bold", color: "#333", fontSize: "16px" }}>
                  Q{qIndex + 1}: {mcq.question}
                </p>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px" }}>
                  {mcq.options.map((opt, oIndex) => {
                    let optBg = "#fff";
                    let optBorder = "1px solid #f8bbd0";
                    
                    if (isAnswered) {
                      if (opt === mcq.correct) {
                        optBg = "#d4edda";
                        optBorder = "1px solid #c3e6cb";
                      } else if (opt === selectedOpt) {
                        optBg = "#f8d7da";
                        optBorder = "1px solid #f5c6cb";
                      }
                    }

                    return (
                      <button
                        key={oIndex}
                        disabled={isAnswered}
                        onClick={() => handleOptionSelect(qIndex, opt)}
                        style={{
                          background: optBg,
                          border: optBorder,
                          padding: "10px 14px",
                          borderRadius: "6px",
                          textAlign: "left",
                          cursor: isAnswered ? "default" : "pointer",
                          fontWeight: "500",
                          color: "#333"
                        }}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation Box in English */}
                {isAnswered && (
                  <div style={{ marginTop: "12px", padding: "10px", borderRadius: "6px", background: isCorrect ? "#e8f5e9" : "#ffebee", border: isCorrect ? "1px solid #a5d6a7" : "1px solid #ffcdd2" }}>
                    <p style={{ margin: "0 0 5px 0", fontWeight: "bold", color: isCorrect ? "#2e7d32" : "#c62828" }}>
                      {isCorrect ? "✅ Correct Answer!" : "❌ Wrong Answer!"}
                    </p>
                    <p style={{ margin: 0, fontSize: "14px", color: "#444" }}>
                      <strong>Explanation:</strong> {mcq.explanation}
                    </p>
                  </div>
                )}
              </div>
            );
          })}

          {/* Final Score Card */}
          {isAllAnswered && (
            <div style={{ marginTop: "30px", padding: "20px", background: "#e8f5e9", borderRadius: "10px", border: "2px solid #4caf50", textAlign: "center" }}>
              <h2 style={{ color: "#2e7d32", margin: "0 0 10px 0" }}>🏆 Quiz Completed!</h2>
              <p style={{ fontSize: "18px", fontWeight: "bold", color: "#333", margin: 0 }}>
                Your Score: {correctCount} / {mcqsData.length}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}