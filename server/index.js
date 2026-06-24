const express = require("express");
const Groq = require("groq-sdk");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// gpt-oss-20b is fast and free-tier friendly.
// Swap to "openai/gpt-oss-120b" if you want higher-quality answers
// and don't mind slightly slower (still very fast) responses.
const MODEL = "openai/gpt-oss-20b";

const SYSTEM_PROMPT = `You are an expert code assistant helping developers
understand, debug, and improve their code. Be concise, practical, and
specific. When showing code examples, use proper formatting.`;

app.use(cors());
app.use(express.json());

// Regular (non-streaming) chat endpoint
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: message },
      ],
    });

    res.json({ response: completion.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Streaming endpoint using Server-Sent Events
app.post("/api/chat/stream", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const stream = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: message },
      ],
      stream: true,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content;
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});