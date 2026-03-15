import { InferenceClient } from "@huggingface/inference";

const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;

const DEFAULT_MODEL = "stabilityai/stable-diffusion-xl-base-1.0";

const client = new InferenceClient(HF_API_KEY ?? "");

export async function generateImageFromText(prompt: string): Promise<string> {
  if (!HF_API_KEY) {
    throw new Error("HUGGINGFACE_API_KEY is not set");
  }

  const image = await client.textToImage({
    provider: "nscale",
    model: DEFAULT_MODEL,
    inputs: prompt,
    parameters: { num_inference_steps: 5 },
  });

  const buffer = Buffer.from(await image.arrayBuffer());
  const base64 = buffer.toString("base64");
  const dataUrl = `data:image/png;base64,${base64}`;

  return dataUrl;
}

export async function generateMultipleImagesFromText(
  prompt: string,
  count: number,
): Promise<string[]> {
  const images: string[] = [];
  for (let i = 0; i < count; i++) {
    // Slightly vary the prompt so the model has a reason to diversify
    const variantPrompt = `${prompt} (variation ${i + 1}, different visual angle)`;
    const image = await generateImageFromText(variantPrompt);
    images.push(image);
  }
  return images;
}