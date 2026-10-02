interface Env {
  GEMINI_API_KEY: string;
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

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;
    const apiKey = env.GEMINI_API_KEY || "";

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY environment variable is not configured." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const body: any = await request.json();
    const { message, history } = body;

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message is required." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Format history and latest message into standard Gemini API content structure
    // Must start with user role
    const contents: any[] = [];
    if (history && Array.isArray(history)) {
      const firstUserIndex = history.findIndex((h: any) => h.role === "user");
      if (firstUserIndex !== -1) {
        for (const turn of history.slice(firstUserIndex)) {
          contents.push({
            role: turn.role === "user" ? "user" : "model",
            parts: [{ text: turn.parts?.[0]?.text || "" }]
          });
        }
      }
    }
    // Append current user message
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: contents,
        systemInstruction: {
          parts: [{ text: SYSTEM_INSTRUCTION }]
        }
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      return new Response(
        JSON.stringify({ error: `Gemini API response error: ${errorText}` }),
        { status: geminiResponse.status, headers: { "Content-Type": "application/json" } }
      );
    }

    const result: any = await geminiResponse.json();
    const replyText = result.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return new Response(
      JSON.stringify({ text: replyText }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "An unexpected error occurred." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
