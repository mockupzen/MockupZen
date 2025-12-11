
import { GoogleGenAI } from "@google/genai";
import { MockupScene } from "../types";

// The API key is injected via the environment.
const API_KEY = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey: API_KEY });

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Generates a single mockup image for a specific scene using Gemini 2.5 Flash Image.
 * Includes automatic retry logic for rate limits.
 */
export const generateSingleMockup = async (
  base64Image: string,
  scene: MockupScene,
  removeBackground: boolean = true
): Promise<string> => {
  if (!API_KEY) {
    console.error("API Key is missing in environment variables.");
    throw new Error("Service configuration error: API Key missing.");
  }

  // 1. Clean and validate Base64 data
  const base64Data = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
  const mimeType = base64Image.match(/^data:(image\/[a-zA-Z]+);base64,/)?.[1] || 'image/png';

  // 2. Construct the Advanced System Prompt
  const promptText = `
    ROLE: Senior Commercial Product Photographer & Art Director for Global Brands.
    
    TASK: Generate an ultra-realistic product mockup by compositing the INPUT PRODUCT into the SCENE described below.

    INPUT DATA:
    - Image: User provided product photo.
    - Target Scene Context: "${scene.prompt}"
    
    ====================================================
    1. PRODUCT PRESERVATION (CRITICAL)
    ====================================================
    The uploaded product must remain 100% unchanged:
    - No altering or redrawing of shape, geometry, colors, logo, labels, or textures.
    - No warping, melting, stretching, repainting, or reinterpretation.
    - Only remove the background cleanly with perfect edge preservation.
    
    The product in the output must be IDENTICAL to the uploaded image.

    ====================================================
    2. SCENE & CONTEXT HANDLING
    ====================================================
    INSTRUCTION: If the "Target Scene Context" above is a specific user description (e.g. "Christmas theme", "Neon city"), strictly follow that theme/mood.
    If it is a generic preset or category description, use INTELLIGENT PRODUCT-AWARE SELECTION:
    
    - Tech → premium studio, modern desk, neon edges, minimal clean setups
    - Cosmetics → marble counter, bathroom shelf, pastel soft-light backgrounds
    - Supplements → gym shelf, clean white studio, lifestyle health settings
    - Food/drink → kitchen surface, wooden table, bright daylight
    - Home decor → interior lifestyle scenes, soft sunlight, warm tones
    - Fashion/accessories → minimal lifestyle, gradient backgrounds, faceless model torsos

    Never place the product in an unrelated environment.

    ====================================================
    3. ANGLE & COMPOSITION
    ====================================================
    The prompt may include specific camera angle instructions (e.g., "Front view", "Top down"). 
    - ADHERE to these angle instructions strictly to create variety across the batch.
    - Ensure the composition follows professional photography standards (Rule of Thirds, Balance).

    ====================================================
    4. REAL PHOTOGRAPHY REQUIREMENTS
    ====================================================
    All outputs must look like REAL camera photographs using:
    - Sony A7R IV / Canon EOS R5 look  
    - 50mm or 85mm commercial lenses  
    - Soft diffused studio lighting  
    - Perfect color accuracy  
    - Natural shadows under the product  
    - Subtle realistic reflections  
    - Correct perspective and geometry  
    - High-resolution, noise-free, crisp images  

    Avoid: AI artifacts, Warped logos, Unrealistic reflections, Over/under-exposure.

    ====================================================
    5. NO FACES, NO PEOPLE, NO CELEBRITIES
    ====================================================
    Strictly prohibit: Human faces, Identifiable individuals, Celebrity likeness.
    Allowed: Faceless mannequins, Hands-only holding the product, Torso silhouettes without identity.

    OUTPUT: A single, high-resolution, photorealistic JPEG/PNG representation.
  `;

  let attempt = 0;
  const maxAttempts = 5;

  while (attempt < maxAttempts) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data
              }
            },
            {
              text: promptText
            }
          ]
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1"
          }
        }
      });

      const candidates = response.candidates;
      if (candidates && candidates.length > 0) {
        const parts = candidates[0].content?.parts;
        if (parts) {
          for (const part of parts) {
            if (part.inlineData && part.inlineData.data) {
              return `data:image/png;base64,${part.inlineData.data}`;
            }
          }
        }
      }
      
      throw new Error("The AI generation completed but returned no image data.");

    } catch (error: any) {
      const isRateLimit = error.message?.includes('429') || error.status === 429 || error.code === 429 || error.message?.includes('quota');
      
      if (isRateLimit && attempt < maxAttempts - 1) {
        attempt++;
        const delay = Math.pow(2, attempt) * 4000; 
        console.warn(`Hit rate limit for scene [${scene.name}]. Retrying in ${delay}ms... (Attempt ${attempt}/${maxAttempts})`);
        await wait(delay);
        continue;
      }
      
      console.error(`Gemini API Error for scene [${scene.name}]:`, error);
      throw new Error(error.message || "Failed to generate mockup.");
    }
  }

  throw new Error("Failed to generate after multiple retries.");
};
