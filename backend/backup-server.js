const express = require("express");
const cors = require("cors");
const { YoutubeTranscript } = require("youtube-transcript");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/transcript", async (req, res) => {
    const { videoId } = req.query;

    if (!videoId) {
        return res.status(400).json({ error: "Video ID is required" });
    }

    try {
        console.log(`Fetching transcript for Video ID: ${videoId}`);

        // Fetch transcript from YouTube
        const transcript = await YoutubeTranscript.fetchTranscript(videoId);

        if (!transcript || transcript.length === 0) {
            console.log("Transcript may be auto-generated or unavailable.");
            return res.status(404).json({ error: "Transcript not available. It may be auto-generated or restricted by YouTube." });
        }

        res.json(transcript);
    } catch (error) {
        console.error("Error fetching transcript:", error.message);

        if (error.message.includes("404")) {
            return res.status(404).json({ error: "Transcript not found. It may be auto-generated or restricted by YouTube." });
        } else if (error.message.includes("403")) {
            return res.status(403).json({ error: "YouTube API denied access. Video may have restrictions." });
        } else {
            return res.status(500).json({ error: "Could not fetch transcript. Possible API limit reached." });
        }
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
