import Replicate from "replicate";

// Initialize Replicate client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

// Main function to generate a mockup
export const generateSingleMockup = async (
  base64Image: string,
  prompt: string
): Promise<string> => {
  try {
    // Clean base64 input
    const cleanedImage = base64Image.replace(
      /^data:image\/(png|jpeg|jpg|webp);base64,/,
      ""
    );

    // Stable Diffusion prompt (keeps product realistic)
    const fullPrompt = `
Ultra-realistic product mockup.
Keep the product exactly the same: shape, color, label, geometry.
Scene: ${prompt}
Studio lighting, soft shadows, 50mm lens, commercial quality, no distortion.
`;

    // Call Stable Diffusion (Flux Pro)
    const output = await replicate.run(
      "black-forest-labs/flux-1.1-pro",
      {
        input: {
          prompt: fullPrompt,
          image: cleanedImage,
          strength: 0.55,
          guidance: 7,
          num_inference_steps: 28,
        },
      }
    );

    // Output is array of images
    return output[0];

  } catch (error) {
    console.error("Mockup generation failed:", error);
    throw new Error("Failed to generate mockup");
  }
};
