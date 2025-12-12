import { GoogleGenAI } from "@google/genai";

export const config = {
  runtime: "edge",
};

export default async function handler(req: Request) {
  try {
    const body = await req.json();
    const { base64, prompt } = body;

    const apiKey = process.env.VITE_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "API Key missing on server." }),
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [
        {
          inlineData: {
            mimeType: "image/png",
            data: base64,
          },
        },
        {
          text: prompt,
        },
      ],
    });

    return new Response(JSON.stringify({ output: result }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
    });
  }
  }
