import React, { useState } from "react";
import { auth } from "./firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from "firebase/auth";

export default function Auth({ user, setUser }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        setUser(userCredential.user);
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        setUser(userCredential.user);
      }
    } catch (err) {
      // Firebase error codes ko human-friendly custom messages mein convert kar rahe hain
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found") {
        setError("Is email se account nahi bana hua! Pehle neeche 'Create Account' par click karke Sign Up karein.");
      } else if (err.code === "auth/email-already-in-use") {
        setError("Yeh email pehle se registered hai. Direct Login karein!");
      } else if (err.code === "auth/wrong-password") {
        setError("Ghalat password! Dobara koshish karein.");
      } else if (err.code === "auth/weak-password") {
        setError("Password kam az kam 6 characters ka hona chahiye!");
      } else {
        setError(err.message);
      }
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <span style={{ fontSize: "40px" }}>🎓</span>
          <h2 style={styles.title}>StudyAI</h2>
          <p style={styles.subtitle}>
            {isSignUp ? "Naya Account Banayein" : "Apne Account Mein Login Karein"}
          </p>
        </div>

        {error && <div style={styles.errorMessage}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <input 
              type="email" 
              placeholder="example@gmail.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              style={styles.input}
            />
          </div>

          <button type="submit" style={styles.button}>
            {isSignUp ? "Create Account (Sign Up)" : "Login"}
          </button>
        </form>

        <div style={styles.footer}>
          <span>{isSignUp ? "Pehle se account hai?" : "Account nahi bana hua?"}</span>
          <button 
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError("");
            }} 
            style={styles.toggleBtn}
          >
            {isSignUp ? "Login karein" : "Pehle Create Account karein"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Pink & White Theme Styles
const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "Center",
    alignItems: "center",
    backgroundColor: "#fff0f5", // Soft Pink background
    fontFamily: "'Poppins', sans-serif",
    padding: "20px"
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "20px",
    boxShadow: "0 10px 25px rgba(255, 105, 180, 0.2)",
    width: "100%",
    maxWidth: "400px",
    padding: "35px 30px",
    border: "2px solid #ffe4e1"
  },
  header: {
    textAlign: "center",
    marginBottom: "25px"
  },
  title: {
    margin: "10px 0 5px",
    color: "#d81b60", // Dark Pink
    fontSize: "28px",
    fontWeight: "700"
  },
  subtitle: {
    color: "#888",
    fontSize: "14px",
    margin: 0
  },
  errorMessage: {
    backgroundColor: "#ffe6e6",
    color: "#d8000c",
    padding: "12px",
    borderRadius: "10px",
    fontSize: "13px",
    marginBottom: "20px",
    textAlign: "center",
    border: "1px solid #ffb3b3",
    lineHeight: "1.4"
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "18px"
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px"
  },
  label: {
    fontSize: "13px",
    color: "#d81b60",
    fontWeight: "600"
  },
  input: {
    padding: "12px 15px",
    borderRadius: "10px",
    border: "1.5px solid #f8bbd0",
    outline: "none",
    fontSize: "14px",
    backgroundColor: "#fffafc",
    color: "#333"
  },
  button: {
    backgroundColor: "#ec407a", // Vibrant Pink
    color: "#fff",
    border: "none",
    padding: "14px",
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "10px",
    boxShadow: "0 4px 12px rgba(236, 64, 122, 0.3)"
  },
  footer: {
    marginTop: "25px",
    textAlign: "center",
    fontSize: "13px",
    color: "#666",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    alignItems: "center"
  },
  toggleBtn: {
    background: "none",
    border: "none",
    color: "#d81b60",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "14px",
    textDecoration: "underline"
  }
};