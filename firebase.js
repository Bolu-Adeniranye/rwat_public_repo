// firebase.js
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  serverTimestamp
} from "firebase/firestore";

// Firebase config (from Firebase code snippet)
const firebaseConfig = {
  apiKey: "AIzaSyADIomxPDbtJ7g-IwI-mJoQXq7-EDoP4Ec",
  authDomain: "rwat-ca2-memory-game.firebaseapp.com",
  projectId: "rwat-ca2-memory-game",
  storageBucket: "rwat-ca2-memory-game.firebasestorage.app",
  messagingSenderId: "450606996342",
  appId: "1:450606996342:web:e9f5dc13239a49553f3857",
  measurementId: "G-YFHNP0F0J9"
};

// Initialise Firebase
const app = initializeApp(firebaseConfig);

// Initialise Firestore
const db = getFirestore(app);

// Reference to my collection
const resultsCollection = collection(db, "gameResults");

// Save a game result
export async function saveGameResult(clicks) {
  await addDoc(resultsCollection, {
    clicks: clicks,
    createdAt: serverTimestamp()
  });
}

// Get the average number of clicks
export async function getAverageClicks() {
  const snapshot = await getDocs(resultsCollection);

  if (snapshot.empty) return null;

  let total = 0;
  let count = 0;

  snapshot.forEach(doc => {
    const data = doc.data();
    if (typeof data.clicks === "number") {
      total += data.clicks;
      count++;
    }
  });

  if (count === 0) return null;

  return total / count;
}
