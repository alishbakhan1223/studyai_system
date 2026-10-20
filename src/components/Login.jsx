import React, { useState } from "react";

export default function Login({ onLoginSuccess, onSwitchToSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    setErrorMessage("");

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!email.trim() || !emailRegex.test(email)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setErrorMessage("Please enter your password.");
      return;
    }

    // Fetch registered users from localStorage
    const existingUsers = JSON.parse(localStorage.getItem("studyai_users")) || [];
    
    // Find user by email
    const foundUser = existingUsers.find((u) => u.email === email);

    if (!foundUser) {
      setErrorMessage("Email does not exist! Please create an account first.");
      return;
    }

    // Check if password matches
    if (foundUser.password !== password) {
      setErrorMessage("Incorrect password! Please try again.");
      return;
    }

    // Login Success
    alert("Login successful!");
    if (onLoginSuccess) {
      onLoginSuccess({ email });
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
      <div style={{ background: "#fff", padding: "30px", borderRadius: "15px", border: "1px solid #ffe4e1", width: "100%", maxWidth: "400px", textAlign: "center", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
        <div style={{ fontSize: "40px", marginBottom: "10px" }}>🎓</div>
        <h2 style={{ color: "#d81b60", margin: "0 0 5px 0" }}>StudyAI</h2>
        <p style={{ color: "#777", fontSize: "14px", marginBottom: "20px" }}>Log in to your account</p>

        {errorMessage && (
          <div style={{ background: "#ffebee", color: "#c62828", padding: "10px", borderRadius: "8px", border: "1px solid #ffcdd2", fontSize: "13px", marginBottom: "15px", textAlign: "left" }}>
            ⚠️ {errorMessage}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <div style={{ textAlign: "left" }}>
            <label style={{ color: "#d81b60", fontWeight: "bold", fontSize: "13px", display: "block", marginBottom: "5px" }}>Email Address</label>
            <input
              type="email"
              placeholder="user@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #f8bbd0", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ textAlign: "left" }}>
            <label style={{ color: "#d81b60", fontWeight: "bold", fontSize: "13px", display: "block", marginBottom: "5px" }}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #f8bbd0", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          <button type="submit" style={{ background: "#ec407a", color: "#fff", border: "none", padding: "12px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "16px", marginTop: "10px" }}>
            Login
          </button>
        </form>

        <p style={{ color: "#666", fontSize: "13px", marginTop: "20px" }}>
          Don't have an account?{" "}
          <span onClick={onSwitchToSignup} style={{ color: "#d81b60", fontWeight: "bold", cursor: "pointer", textDecoration: "underline" }}>
            Create Account
          </span>
        </p>
      </div>
    </div>
  );
}