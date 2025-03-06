import React, { useState, useEffect } from "react";
import axios from "axios";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import { Button, TextField, Select, MenuItem, Typography, Box, Paper, Switch, FormControl, InputLabel } from "@mui/material";

// Dynamically set backend URL for both local & live
const BASE_URL = "http://localhost:5000";

// Function to Start and Stop Speech
const speakText = (text) => {
  const speech = new SpeechSynthesisUtterance(text);
  window.speechSynthesis.speak(speech);
};

// Function to Stop Speech
const stopTextToSpeech = () => {
  window.speechSynthesis.cancel();
};

function App() {
  const [videoId, setVideoId] = useState("");
  const [transcript, setTranscript] = useState([]);
  const [error, setError] = useState("");
  const [language, setLanguage] = useState("en");
  const [darkMode, setDarkMode] = useState(false);
  const [history, setHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Load history from localStorage
  useEffect(() => {
    const storedHistory = JSON.parse(localStorage.getItem("transcriptHistory")) || [];
    setHistory(storedHistory);
  }, []);

  // Fetch transcript from backend
  const fetchTranscript = async () => {
    console.log("videoId")
    setError("");
    setTranscript([]);

    if (!videoId) {
      setError("Please enter a YouTube Video ID.");
      return;
    }
    console.log(videoId)

    try {
      const response = await axios.get(`/transcript?videoUrl=${videoId}`);
      setTranscript(response.data.transcript);

      // Save to history
      const newEntry = { videoId, transcript: response.data.transcript };
      const updatedHistory = [newEntry, ...history].slice(0, 5); // Keep last 5
      setHistory(updatedHistory);
      localStorage.setItem("transcriptHistory", JSON.stringify(updatedHistory));
    } catch (err) {
      setError("Failed to fetch transcript. Please check the video ID and try again.");
    }
  };

  // Download transcript as TXT
  const downloadTXT = () => {
    if (transcript.length === 0) {
      setError("No transcript available to download.");
      return;
    }
    console.log(transcript);

    const textContent = Array.isArray(transcript)
      ? transcript.join(" ")  // Join transcript if it's an array
      : transcript.toString(); // Convert to string if it's not

    // Create a Blob and trigger the download
    const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
    saveAs(blob, "transcript.txt");
  };

  const downloadPDF = () => {
    if (!transcript || transcript.length === 0) {
      setError("No transcript available to download.");
      return;
    }

    console.log("Transcript Data:", transcript);

    // Convert transcript into a readable format
    const textContent = Array.isArray(transcript)
      ? transcript.join(" ")  // Join transcript if it's an array
      : transcript.toString(); // Convert to string if it's not

    // Initialize jsPDF
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("YouTube Transcript", 10, 10);

    let y = 20; // Start position for text
    const margin = 10; // Left margin
    const maxWidth = 180; // Max text width before wrapping

    // Split long text into multiple lines
    const lines = doc.splitTextToSize(textContent, maxWidth);

    lines.forEach((line, index) => {
      if (y > 270) { // If text reaches the bottom, add a new page
        doc.addPage();
        y = 20;
      }
      doc.text(line, margin, y);
      y += 7; // Adjust line spacing
    });

    // Save the PDF
    doc.save("transcript.pdf");
  };

  return (
    <Box sx={{ backgroundColor: darkMode ? "#121212" : "#f5f5f5", minHeight: "100vh", padding: "20px", color: darkMode ? "#ffffff" : "#000000" }}>
      <Paper sx={{ padding: "20px", maxWidth: "600px", margin: "auto", textAlign: "center" }}>
        <Typography variant="h4">YouTube Transcript Fetcher</Typography>

        <TextField label="YouTube Video ID" variant="outlined" fullWidth margin="normal" value={videoId} onChange={(e) => setVideoId(e.target.value)} />

        <FormControl fullWidth margin="normal">
          <InputLabel>Select Language</InputLabel>
          <Select value={language} onChange={(e) => setLanguage(e.target.value)}>
            <MenuItem value="en">English</MenuItem>
            <MenuItem value="es">Spanish</MenuItem>
            <MenuItem value="fr">French</MenuItem>
            <MenuItem value="de">German</MenuItem>
            <MenuItem value="hi">Hindi</MenuItem>
            <MenuItem value="ja">Japanese</MenuItem>
          </Select>
        </FormControl>

        <Button variant="contained" color="primary" onClick={fetchTranscript} sx={{ margin: "10px" }}>
          Get Transcript
        </Button>
        <Button variant="contained" color="secondary" onClick={downloadTXT} sx={{ margin: "10px" }}>
          Download TXT
        </Button>
        <Button variant="contained" color="success" onClick={downloadPDF} sx={{ margin: "10px" }}>
          Download PDF
        </Button>

        <Box display="flex" justifyContent="center" alignItems="center" marginTop={2}>
          <Typography>Dark Mode</Typography>
          <Switch checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
        </Box>

        {error && <Typography color="error">{error}</Typography>}

        {/* Search Box */}
        <TextField
          label="Search Transcript"
          variant="outlined"
          fullWidth
          margin="normal"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <Box sx={{
          maxHeight: "300px",
          overflowY: "auto",
          textAlign: "left",
          padding: "10px",
          backgroundColor: darkMode ? "#333" : "#fff",
          color: darkMode ? "#fff" : "#000",  /* Text color changes dynamically */
          borderRadius: "5px"
        }}>
          {/* {transcript
            .filter((line) => line.text.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((line, index) => (
              <Typography key={index} sx={{ color: darkMode ? "#ffffff" : "#000000" }}>
                {line.text}
              </Typography>
            ))} */}
        </Box>

        {/* <Button variant="contained" color="info" onClick={() => speakText(transcript.map((line) => line.text).join(" "))} sx={{ margin: "10px" }}>
          Play Transcript
        </Button> */}

        <Button variant="contained" color="error" onClick={stopTextToSpeech} sx={{ margin: "10px" }}>
          Stop Transcript
        </Button>

        {/* Display Transcript History */}
        <Typography variant="h6" marginTop={2}>
          Transcript History
        </Typography>
        {history.map((item, idx) => (
          <Typography key={idx} sx={{ fontSize: "14px", color: "#666" }}>
            {item.videoId}
          </Typography>
        ))}
      </Paper>
    </Box>
  );
}

export default App;
