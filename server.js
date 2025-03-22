import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import axios from "axios";
import fs from "fs";
import cors from "cors";
import dotenv from "dotenv";
import Transcripations from "./models/Transcripations.js";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config(); // Load API Key from .env file

//resolving dirname for ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;
const upload = multer({ dest: "uploads/" }); // Store files in 'uploads/' folder

const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;
if (!ASSEMBLYAI_API_KEY) {
  console.error("AssemblyAI API Key is missing!");
}

// const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;
app.use(cors());
app.use(express.json());

// use client app
app.use(express.static(path.join(__dirname, "/client/dist")));
app.get("*", (req, res) =>
  res.sendFile(path.join(__dirname, "/client/dist/index.html"))
);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((error) => console.error("❌ MongoDB Connection Error:", error));

// API to save transcription
app.post("/transcriptions", async (req, res) => {
  try {
    const { userId, text } = req.body;
    const transcription = new Transcripations({ userId, text });
    await transcription.save();
    res.status(201).json(transcription);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error saving transcription" });
  }
});

// API to get user transcriptions
app.get("/transcriptions/:userId", async (req, res) => {
  try {
    const transcriptions = await Transcripations.find({
      userId: req.params.userId,
    }).sort({ createdAt: -1 });
    res.json(transcriptions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching transcriptions" });
  }
});

// Upload audio file and transcribe
app.post("/transcribe", upload.single("audio"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  try {
    // Step 1: Upload File to AssemblyAI
    const audioFile = fs.createReadStream(req.file.path);
    const uploadResponse = await axios.post(
      "https://api.assemblyai.com/v2/upload",
      audioFile,
      {
        headers: { authorization: ASSEMBLYAI_API_KEY },
      }
    );

    // Step 2: Request Transcription
    const transcriptResponse = await axios.post(
      "https://api.assemblyai.com/v2/transcript",
      { audio_url: uploadResponse.data.upload_url },
      {
        headers: {
          authorization: ASSEMBLYAI_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    const transcriptId = transcriptResponse.data.id;

    // Step 3: Poll for Transcript Completion
    let transcriptResult;
    while (true) {
      const transcript = await axios.get(
        `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
        {
          headers: { authorization: ASSEMBLYAI_API_KEY },
        }
      );

      if (transcript.data.status === "completed") {
        transcriptResult = transcript.data.text;
        break;
      } else if (transcript.data.status === "failed") {
        return res.status(500).json({ error: "Transcription failed" });
      }

      await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait before retrying
    }

    // Return Transcription
    res.json({ transcription: transcriptResult });

    // Delete the uploaded file from server
    fs.unlinkSync(req.file.path);
  } catch (error) {
    console.error("Error transcribing audio:", error);
    res.status(500).json({ error: "Error processing request" });
  }
});

// Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
