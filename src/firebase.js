// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDMyF-ziL7WdsA7kKAkuPyLoTVohEZ4bQM",
  authDomain: "studyai-c5cd5.firebaseapp.com",
  projectId: "studyai-c5cd5",
  storageBucket: "studyai-c5cd5.appspot.com",
  messagingSenderId: "841899550596",
  appId: "1:841899550596:web:c55d2ee7477b9638b11fd1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);