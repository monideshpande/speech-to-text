import mongoose from "mongoose";

const TranscriptionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }, // Ensure timestamps are stored
});

export default mongoose.model("Transcription", TranscriptionSchema);
