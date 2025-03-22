import React, { useEffect, useState, useMemo } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import TranscripationRecording from "./components/TranscripationRecording";

function App() {
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true); // New loading state

  useEffect(() => {
    // Ensure localStorage is accessible
    if (typeof window !== "undefined") {
      let storedUserId = localStorage.getItem("userId");
      if (!storedUserId) {
        storedUserId = `user_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem("userId", storedUserId);
      }
      setUserId(storedUserId);
    }
    setLoading(false); // Update loading state after setting userId
  }, []);

  // Memoize userId to prevent unnecessary re-renders
  const memoizedUserId = useMemo(() => userId, [userId]);

  return (
    <Router>
      <div className="bg-gray-100 min-h-screen p-6">
        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : (
          <Routes>
            <Route path="/" element={<TranscripationRecording userId={memoizedUserId} />} />
          </Routes>
        )}
      </div>
    </Router>
  );
}

export default App;
