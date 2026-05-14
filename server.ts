import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: AI Game Genie Chat (safe execution of Gemini)
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(200).json({ 
          text: "👾 *System Broadcast:* It looks like your `GEMINI_API_KEY` is not linked yet! You can link a free key under **Settings > Secrets** in the top-right of AI Studio. For now, I'm running in offline emulation mode! Ask me anything about gaming, or tell me to play a custom mini-game!" 
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const systemInstruction = 
        "You are Nebula, the cute, energetic, holographic AI Game Genie and arcade mascot of the ArcadeNebula portal. " +
        "You speak with ultimate retro-gaming enthusiast vibes, using cool emojis (🕹️, 👽, 👾, ⚡, 🚀, 🔓, ✨) and clever gamified expressions. " +
        "You are extremely helpful! You can give cheat codes, game history, game walkthroughs, or act as an interactive game master for a retro Text RPG (Text Adventure). " +
        "If the user wants a recommendation, guide them with humor! Keep answers compact, organized, and punchy. " +
        "Provide your responses format in rich Markdown with nice headers, list points, and code styling when appropriate.";

      const contents = [];
      if (history && Array.isArray(history)) {
        for (const msg of history) {
          contents.push({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
          });
        }
      }
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents,
        config: {
          systemInstruction,
          temperature: 0.85,
        }
      });

      res.json({ text: response.text });
    } catch (err: any) {
      console.error("Gemini API Error in /api/chat:", err);
      res.status(500).json({ error: err.message || "Failed to communicate with Arcade Genie." });
    }
  });

  // API Route: AI Game Curation (Structured JSON format)
  app.post("/api/recommend", async (req, res) => {
    try {
      const { mood, genre } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        // Fallback mock recommendations for offline mode
        const offlineData = [
          {
            title: `Pixel Strike (${genre || 'Action'})`,
            description: `An intense pixelated combat experience perfect for a ${mood || 'excited'} mood.`,
            type: "arcade",
            difficulty: "Medium",
            achievement: "🏆 Galaxy Overlord"
          },
          {
            title: `Cosmic Mindscape`,
            description: `A relaxing puzzle of mirrors and lasers matching your chill vibe.`,
            type: "puzzle",
            difficulty: "Easy",
            achievement: "🔮 Zen Master"
          },
          {
            title: `Hyperspace Dodge`,
            description: `Dodge laser walls at high speeds while listening to retro synthwave.`,
            type: "retro",
            difficulty: "Hard",
            achievement: "⚡ Light Speed Survivor"
          }
        ];
        return res.json(offlineData);
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const prompt = `Give me 3 tailored, highly creative retro/browser game recommendations (both real famous classics or extremely fun mock game concepts) matching:
- Player Mood: ${mood || 'Energetic / Playful'}
- Theme/Genre: ${genre || 'Arcade'}

Format your entire output response strictly as a JSON array keeping exactly this structure with no markdown wrapper (do not wrap in \`\`\`json):
[
  {
    "title": "Game Title",
    "description": "Short catchy high-energy description (approx. 15-20 words)",
    "type": "arcade/puzzle/retro/action",
    "difficulty": "Easy/Medium/Hard",
    "achievement": "A humorous, clever achievement badge name with a fitting emoji"
  }
]`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.9,
        }
      });

      res.setHeader('Content-Type', 'application/json');
      res.send(response.text);
    } catch (err: any) {
      console.error(" Curation Error in /api/recommend:", err);
      res.status(500).json({ error: "Curator offline. Please check your Gemini Secrets." });
    }
  });

  // Serve static assets or mount Vite handler
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[ArcadeNebula Server] Launched on port ${PORT}`);
  });
}

startServer();
