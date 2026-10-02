import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { apiRouter } from "./server/routes";
import { errorHandler } from "./server/middleware/errorHandler";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Production E-Commerce API Routes
app.use("/api", apiRouter);

// API Key verification helper
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is required");
  }
  return new GoogleGenAI({ apiKey });
}

const SYSTEM_INSTRUCTION = `You are the "KrishiMart Agronomy & Farming Assistant" for an organic farm inputs, heirloom seeds, and bio-nutrients e-commerce platform.
Your goal is to provide exceptional, polite, and knowledgeable customer support for farmers, agriculturalists, and organic gardeners.

Tone: Knowledgeable, practical, supportive, eco-friendly, and polite.
Context:
- We specialize in organic bio-nutrients, botanical fungicides, native heirloom seeds, tissue culture plantlets, foliar seaweed fertilizers, and drip irrigation kits.
- We emphasize sustainable agriculture, Cauvery Delta soil enrichment, chemical-free pest control, and native high-yield crops.

Available Inventory Summary:
- Cauvery Bio-Gold Organic NPK Concentrate: Enriched microbial soil revitalizer packed with nitrogen fixers and humic extracts from Cauvery Delta. Price: ₹1,250
- NeemShield Botanical Bio-Fungicide: 100% cold-pressed neem oil & Trichoderma bio-fungicide protecting against leaf rust and soil pathogens. Price: ₹850
- Native Heirloom Paddy Seeds (Mapillai Samba): Drought-resistant, high-nutrition heirloom rice seeds certified organic. Price: ₹1,800
- Banana Tissue Culture Plantlets (Grand Naine): High-yield disease-free laboratory plantlets for accelerated growth and maximum yield. Price: ₹3,200
- Bio-Power Natural Seaweed Liquid Fertilizer: Cold-extracted Ascophyllum Nodosum foliar spray rich in cytokinins and micro-nutrients. Price: ₹950
- Drip Irrigation Micro-Sprinkler Hardware Kit: UV-stabilized precision agricultural water-saving irrigation set with emitters and tubing. Price: ₹2,400
- Organic Neem Seed Cake Bio-Insecticide: Cold-pressed neem cake pellets eradicating root pests and nematodes with slow-release nitrogen. Price: ₹1,100

Guidelines:
1. Recommend specific products based on the farmer's crop, acreage, pest problem, or nutrient deficiencies.
2. Provide organic farming tips (e.g. bio-fertilizer application timings, seed treatment, drip hydration).
3. If asked about shipping, we deliver directly to farm gate across India within 3-5 business days.
4. Keep answers concise, clear, and easy to read.`;

// API routes FIRST
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Gemini chat history requires alternating user/model turns starting with 'user'
    let sanitizedHistory: any[] = [];
    if (Array.isArray(history)) {
      const firstUserIndex = history.findIndex((h: any) => h.role === "user");
      if (firstUserIndex !== -1) {
        sanitizedHistory = history.slice(firstUserIndex).map((h: any) => ({
          role: h.role,
          parts: Array.isArray(h.parts) ? h.parts : [{ text: String(h.parts || "") }],
        }));
      }
    }

    const ai = getGeminiClient();
    const candidateModels = ["gemini-3.8-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
    let replyText = "";
    let lastError: any = null;

    for (const model of candidateModels) {
      try {
        const chat = ai.chats.create({
          model,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
          },
          history: sanitizedHistory,
        });

        const result = await chat.sendMessage({ message });
        replyText = result.text || "";
        lastError = null;
        break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${model} failed, trying next candidate...`, err.message || err);
      }
    }

    if (lastError && !replyText) {
      throw lastError;
    }

    res.json({ text: replyText });
  } catch (error: any) {
    console.error("Server-side Gemini Error:", error);
    res.status(500).json({ 
      error: error.message || "An error occurred while communicating with the KrishiMart Assistant." 
    });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Centralized RFC 7807 Error Handler Middleware
app.use(errorHandler);

// Setup Vite or static serving
async function initializeServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        // The v0 preview proxies HTTP but does not support Vite's HMR WebSocket.
        hmr: false,
        ws: false,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

initializeServer().catch((err) => {
  console.error("Failed to start server:", err);
});
