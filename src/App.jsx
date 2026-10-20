import React, { useState, useEffect } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Auth from "./Auth";
import AIChat from "./components/AIChat";
import SummarizeNotes from "./components/SummarizeNotes";
import GenerateMCQs from "./components/GenerateMCQs";
import StudyPlanner from "./components/StudyPlanner";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState("Home");

  const features = [
    { icon: "💬", title: "AI Chat", desc: "Ask questions and learn easily." },
    { icon: "📝", title: "Summarize Notes", desc: "Turn long notes into short summaries." },
    { icon: "❓", title: "Generate MCQs", desc: "Practice questions for your exams." },
    { icon: "📅", title: "Study Planner", desc: "Organize your daily study goals." },
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    signOut(auth);
  };

  if (loading) {
    return (
      <div style={{ color: "#d81b60", textAlign: "center", marginTop: "30vh", fontFamily: "'Poppins', sans-serif" }}>
        <h2>Loading StudyAI... 🌸</h2>
      </div>
    );
  }

  if (!user) {
    return <Auth user={user} setUser={setUser} />;
  }

  const getCleanName = (email) => {
    if (!email) return "Student";
    let namePart = email.split('@')[0];
    namePart = namePart.replace(/[0-9]/g, '');
    return namePart.charAt(0).toUpperCase() + namePart.slice(1);
  };

  const displayName = getCleanName(user.email);

  return (
    <div className="app">
      <aside className="sidebar">
        <h2>🎓 StudyAI</h2>
        <p className="tagline">Learn Smarter, Not Harder</p>

        {["Home", "AI Chat", "Summarize Notes", "Generate MCQs", "Study Planner"].map(
          (item) => (
            <button
              key={item}
              className={active === item ? "nav active" : "nav"}
              onClick={() => setActive(item)}
            >
              {item}
            </button>
          )
        )}
      </aside>

      <main className="main">
        <header className="topbar">
          <span>My Learning Space</span>
          <div className="user-profile">
            <span>👩‍🎓 {displayName}</span>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </header>

        <section className="hero">
          <p>YOUR PERSONAL AI LEARNING PARTNER</p>
          <h1>Hello, {displayName}!</h1>
          <h2>What would you like to learn today?</h2>
          <p>Learn new concepts, revise notes and prepare for exams.</p>
        </section>

        <h2 className="section-title">Explore your tools</h2>

        <section className="features">
          {features.map((feature) => (
            <button
              className="feature"
              key={feature.title}
              onClick={() => setActive(feature.title)}
            >
              <span className="feature-icon">{feature.icon}</span>
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
              <span className="arrow">Explore →</span>
            </button>
          ))}
        </section>

        <section className="welcome">
          {active === "Home" && (
            <p style={{ color: "#888", fontSize: "15px" }}>
              Your learning journey starts here. Choose a tool above or from the sidebar to begin!
            </p>
          )}
          {active === "AI Chat" && <AIChat />}
          {active === "Summarize Notes" && <SummarizeNotes />}
          {active === "Generate MCQs" && <GenerateMCQs />}
          {active === "Study Planner" && <StudyPlanner />}
        </section>
      </main>
    </div>
  );
}

export default App;