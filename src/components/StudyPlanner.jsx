import React, { useState } from "react";
import { askGemini } from "../gemini";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export default function StudyPlanner() {
  const [textInput, setTextInput] = useState("");
  const [timeValue, setTimeValue] = useState(7);
  const [timeUnit, setTimeUnit] = useState("Days");
  const [scheduleList, setScheduleList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [fileName, setFileName] = useState("");

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setExtracting(true);
    setTextInput("Reading PDF contents for study plan...");

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
            alert("No text found in PDF. Please paste notes manually.");
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

  const handleGeneratePlan = async () => {
    if (!textInput.trim() || extracting) {
      alert("Please upload a PDF or paste notes first!");
      return;
    }

    setLoading(true);
    setScheduleList([]);

    const prompt = `Create a structured study plan based on the following notes/PDF content for a total time period of ${timeValue} ${timeUnit}.
You MUST reply strictly in valid JSON format as an array of objects without any markdown code blocks, backticks, or extra text.
Each object in the array must represent a study phase/block and contain these exact keys:
- "timeBlock": string (e.g. "Day 1", "00:00 - 05:00", or "Week 1")
- "duration": string (e.g. "1 Day", "5 mins", or "2 Weeks")
- "title": string (Name of the module/phase)
- "topics": array of strings (Specific topics/tasks to complete)

Content:
${textInput.substring(0, 4500)}`;

    try {
      const res = await askGemini(prompt, "english");
      let cleanRes = res.trim();
      if (cleanRes.startsWith("```json")) cleanRes = cleanRes.replace(/^```json/, "");
      if (cleanRes.startsWith("```")) cleanRes = cleanRes.replace(/^```/, "");
      if (cleanRes.endsWith("```")) cleanRes = cleanRes.slice(0, -3);

      const parsedData = JSON.parse(cleanRes.trim());
      setScheduleList(parsedData);
    } catch (err) {
      console.error("Study Planner Parsing Error:", err);
      alert("Error generating plan chart. Please try again!");
    } finally {
      setLoading(false);
    }
  };

  const cardColors = [
    { bg: "#fff0f5", border: "#f8bbd0", tagBg: "#ec407a" },
    { bg: "#f0f4fe", border: "#bbdefb", tagBg: "#2196f3" },
    { bg: "#f3e5f5", border: "#e1bee7", tagBg: "#ab47bc" },
    { bg: "#e8f5e9", border: "#c8e6c9", tagBg: "#66bb6a" },
    { bg: "#fffde7", border: "#fff59d", tagBg: "#fbc02d" },
  ];

  return (
    <div style={{ background: "#fff", padding: "20px", borderRadius: "15px", border: "1px solid #ffe4e1" }}>
      <h2 style={{ color: "#d81b60", marginBottom: "15px" }}>📅 Dynamic Study Planner Chart</h2>

      {/* PDF Upload */}
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

      {/* Time Controls */}
      <div style={{ display: "flex", gap: "15px", marginBottom: "15px" }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontWeight: "bold", color: "#d81b60", display: "block", marginBottom: "5px" }}>Duration Value:</label>
          <input 
            type="number" 
            min="1" 
            value={timeValue} 
            onChange={(e) => setTimeValue(e.target.value)}
            style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #f8bbd0", fontWeight: "bold" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontWeight: "bold", color: "#d81b60", display: "block", marginBottom: "5px" }}>Time Unit:</label>
          <select 
            value={timeUnit} 
            onChange={(e) => setTimeUnit(e.target.value)}
            style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #f8bbd0", fontWeight: "bold", cursor: "pointer" }}
          >
            <option value="Hours">Hours</option>
            <option value="Days">Days</option>
            <option value="Months">Months</option>
            <option value="Years">Years</option>
          </select>
        </div>
      </div>

      {/* Textarea */}
      <textarea
        value={textInput}
        onChange={(e) => setTextInput(e.target.value)}
        placeholder="PDF text will appear here, or you can paste notes directly..."
        rows={5}
        style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #f8bbd0", resize: "vertical", marginBottom: "15px" }}
      />

      <button
        onClick={handleGeneratePlan}
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
        {extracting ? "Reading PDF..." : loading ? "Generating Chart..." : "Generate Study Plan"}
      </button>

      {/* Colorful Cards UI Display */}
      {scheduleList.length > 0 && (
        <div style={{ marginTop: "25px" }}>
          <h3 style={{ color: "#d81b60", marginBottom: "15px" }}>📊 Customized Timeline Chart</h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            {scheduleList.map((item, index) => {
              const colorTheme = cardColors[index % cardColors.length];

              return (
                <div 
                  key={index} 
                  style={{ 
                    background: colorTheme.bg, 
                    border: `1.5px solid ${colorTheme.border}`, 
                    padding: "16px", 
                    borderRadius: "12px",
                    boxShadow: "0 2px 5px rgba(0,0,0,0.03)" 
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <span style={{ background: colorTheme.tagBg, color: "#fff", padding: "4px 12px", borderRadius: "20px", fontWeight: "bold", fontSize: "13px" }}>
                      ⏰ {item.timeBlock} ({item.duration})
                    </span>
                  </div>

                  <h4 style={{ margin: "0 0 10px 0", color: "#222", fontSize: "17px" }}>
                    📌 {item.title}
                  </h4>

                  <ul style={{ margin: 0, paddingLeft: "20px", color: "#444", lineHeight: "1.5" }}>
                    {item.topics && item.topics.map((tp, tpIndex) => (
                      <li key={tpIndex} style={{ marginBottom: "4px" }}>{tp}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}