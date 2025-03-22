import { useState, useRef } from "react";
import axios from "axios";

const TranscripationRecording = ({ userId }) => {
  const [transcription, setTranscription] = useState("");
  const [savedTranscriptions, setSavedTranscriptions] = useState([]);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Save Transcription manually
  const handleSaveTranscription = async () => {
    if (!transcription.trim() || !userId) return;
    try {
      const response = await axios.post("/transcriptions", {
        userId,
        text: transcription,
      });
      setSavedTranscriptions((prev) => [response.data, ...prev]);
      alert("Transcription saved successfully!");
    } catch (error) {
      console.error("Error saving transcription:", error);
    }
  };

  // Retrieve past transcriptions manually
  const handleRetrieveTranscriptions = async () => {
    if (!userId) return;
    try {
      const response = await axios.get(`/transcriptions/${userId}`);
      setSavedTranscriptions(response.data);
    } catch (error) {
      console.error("Error fetching transcriptions:", error);
    }
  };

  // Handle File Upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("audio", file);

    try {
      const response = await axios.post("/transcribe", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setTranscription(response.data.transcription);
    } catch (error) {
      console.error("Error transcribing file:", error);
      setTranscription("Error transcribing file.");
    }
  };

  // Start Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        const formData = new FormData();
        formData.append("audio", audioBlob, "recorded_audio.wav");

        try {
          const response = await axios.post("/transcribe", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          setTranscription(response.data.transcription);
        } catch (error) {
          console.error("Error transcribing recording:", error);
          setTranscription("Error transcribing recording.");
        }
      };

      mediaRecorderRef.current.start();
      setRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  // Stop Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-md mx-auto mt-10">
      <h2 className="text-lg font-semibold text-black mb-4 text-center">
        Speech To Text Transcription
      </h2>

      {/* File Upload Button */}
      <label
        className="cursor-pointer bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-800 transition 
  text-sm sm:text-base md:text-lg w-full sm:w-auto block sm:inline text-center sm:ml-19"
      >
        Upload Audio
        <input
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={handleFileUpload}
        />
      </label>

      {/* Record Button */}
      <button
        onClick={recording ? stopRecording : startRecording}
        className={`mt-3 sm:mt-0 ml-0 sm:ml-4 py-2 px-4  text-white rounded-lg transition 
  text-sm sm:text-base md:text-lg w-full sm:w-auto block sm:inline text-center ${
    recording
      ? "bg-red-500 hover:bg-red-800"
      : "bg-green-500 hover:bg-green-800"
  }`}
      >
        {recording ? "Stop Recording" : "Record"}
      </button>

      {/* Transcription Display */}
      <div className="mt-4 p-3 bg-gray-100 rounded-lg text-sm text-gray-600 min-h-[50px]">
        {transcription || " Transcripation is Loading..."}
      </div>

      {/* Save Transcription Button */}
      <button
        onClick={handleSaveTranscription}
        className="mt-3 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-800 transition w-full cursor-pointer"
      >
        Save Transcription
      </button>

      {/* Retrieve Transcriptions Button */}
      <button
        onClick={handleRetrieveTranscriptions}
        className="mt-3 py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-800 transition w-full cursor-pointer"
      >
        Retrieve Past Transcriptions
      </button>

      {/* Display Saved Transcriptions */}
      <h2 className="text-lg font-semibold text-black mt-6">
        Saved Transcriptions
      </h2>
      {savedTranscriptions.length === 0 ? (
        <p className="text-gray-500 mt-3">No past transcriptions found.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 mt-3">
          {savedTranscriptions.map((item) => (
            <div key={item._id} className="bg-gray-200 p-3 rounded-lg shadow">
              <p className="text-gray-800">{item.text}</p>
              <p className="text-sm text-gray-500 mt-1">
                {item.createdAt
                  ? new Date(item.createdAt).toLocaleString()
                  : "Unknown Date"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TranscripationRecording;
