// backend/server.js
import fs from "fs";
import express from "express";
import admin from "firebase-admin";
import cors from "cors";

const serviceAccount = JSON.parse(
  fs.readFileSync("./serviceAccountKey.json", "utf-8")
);


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const app = express();
app.use(express.json());
app.use(cors({
  origin: "http://localhost:3000",   // allow your Vue app
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.post('/uploadNewKanjiCharacter', async (req, res) => {
  try {
    const characters = req.body
    const docRef = db.collection("kanji_list").doc(characters.kanji); // doc ID = item name
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      console.log(`⚠️ Skipped duplicate: ${characters.kanji}`);
      return; // skip if already exists
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

app.listen(process.env.PORT || 3001, () => console.log("Server running...."));
