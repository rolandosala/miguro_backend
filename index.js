// backend/server.js
import fs from "fs";
import express from "express";
import axios from "axios";
import admin from "firebase-admin";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const serviceKey =
  process.env.NODE_ENV === "production"
    ? "/etc/secrets/serviceAccountKey.json"
    : "./serviceAccountKey.json";

const serviceAccount = JSON.parse(
  fs.readFileSync(serviceKey, "utf-8")
);


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const app = express();
app.use(express.json());
const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? "https://miguro-v2.vercel.app"
    : "http://localhost:3000";
app.use(cors({
  origin: allowedOrigins,   // allow your Vue app
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.post('/uploadNewKanjiCharacter', async (req, res) => {
  try {
    const characters = req.body
    const docRef = db.collection("kanji_list").doc(characters.kanji); // doc ID = item name
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      await docRef.set(characters, { merge: true });
      console.log(`🔄 Updated existing character: ${characters.kanji}`);
      return res.status(200).send('Character updated successfully');
    }
    await docRef.set(characters);
    res.status(200).send('Character uploaded successfully');
  } catch (err) {
    console.error("❌ Error uploading menu:", err);
  }
});
app.get("/fetchKanjiList", async (req, res) => {
  try {
    const snapshot = await db.collection("kanji_list").get();
    const menu = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(menu);
  } catch (error) {
    res.status(500).send(error.message);
  }
});
app.get("/searchDictionary", async (req, res) => {
  const { query } = req.query;
  try {
    const url = `https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(query)}`;
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
      },
    });
    res.json(data);
  } catch (err) {
    console.error("Error fetching:", err.message);
    res.status(500).json({ error: "Failed to fetch search results" });
  }
});

app.listen(process.env.PORT || 3001, () => console.log("Server running...."));
