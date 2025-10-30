// backend/server.js
import fs from "fs";
import express from "express";
import axios from "axios";
import admin from "firebase-admin";
import cors from "cors";
import dotenv from "dotenv";
import { stringify } from "querystring";

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
  allowedHeaders: ["Content-Type", "Authorization", "Cache-Control"]
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
    const url = `https://jlpt-vocab-api.vercel.app/api/words?word=${query}`;
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
app.post("/chatBot", async (req, res) => {
  const HF_TOKEN = process.env.HK_TOKEN;
  const MODEL_URL = "https://api-inference.huggingface.co/models/rinna/japanese-gpt-neox-3.6b-instruction-sft";
  const { message, history = [] } = req.body;
  const prompt =
    `あなたは日本語を教えるフレンドリーな先生です。` +
    `生徒と日本語で自然に会話し、文法の間違いを優しく直してください。\n\n` +
    history.map(h => `生徒: ${h.user}\n先生: ${h.bot}`).join("\n") +
    `\n生徒: ${message}\n先生:`;
  try {
    const response = await fetch(MODEL_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        options: { wait_for_model: true }
      }),
    });

    const data = await response.json();
    const output = data[0]?.generated_text || "（返答がありませんでした）";
    const reply = output.split("先生:").pop().trim();

    res.json({ reply });
  } catch (err) {
    console.log(err)
  }
});

const practiceQuestions = [
  { word: 'カメラ', romaji: 'kamera', meaning: 'a camera' },
  { word: 'ネクタイ', romaji: 'nekutai', meaning: 'a necktie' },
  { word: 'アイスクリーム', romaji: 'aisu kuriimu', meaning: 'an ice cream' },
  { word: 'ケーキ', romaji: 'keeki', meaning: 'a cake' },
  { word: 'アメリカ', romaji: 'amerika', meaning: 'America' },
  { word: 'テレビ', romaji: 'terebi', meaning: 'a television' },
  { word: 'コンピューター', romaji: 'konpyuutaa', meaning: 'a computer' },
  { word: 'パン', romaji: 'pan', meaning: 'bread' },
  { word: 'コーヒー', romaji: 'koohii', meaning: 'coffee' },
  { word: 'ジュース', romaji: 'juusu', meaning: 'juice' },
  { word: 'レストラン', romaji: 'resutoran', meaning: 'a restaurant' },
  { word: 'ホテル', romaji: 'hoteru', meaning: 'a hotel' },
  { word: 'タクシー', romaji: 'takushii', meaning: 'a taxi' },
  { word: 'バス', romaji: 'basu', meaning: 'a bus' },
  { word: 'スーパー', romaji: 'suupaa', meaning: 'a supermarket' },
  { word: 'ゲーム', romaji: 'geemu', meaning: 'a game' },
  { word: 'ピザ', romaji: 'piza', meaning: 'a pizza' },
  { word: 'サンドイッチ', romaji: 'sandoicchi', meaning: 'a sandwich' },
  { word: 'トイレ', romaji: 'toire', meaning: 'a toilet' },
  { word: 'デパート', romaji: 'depaato', meaning: 'a department store' },
]
app.post("/uploadQuiz", async (req, res) => {
  try {
    await db.collection("quizzes").doc("quiz_2").set({
      questions: practiceQuestions
    });
    res.status(200).send({ message: "Uploaded successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Failed to upload data" });
  }
});

app.get("/fetchQuiz", async (req, res) => {
  try {
    const { id } = req.query;
    console.log(id)
    const snapshot = await db.collection("quizzes").doc(`quiz_${id}`).get();
    res.json({ id: snapshot.id, ...snapshot.data() });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.listen(process.env.PORT || 3001, () => console.log("Server running...."));
