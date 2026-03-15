import type { Express } from "express";
import type { Server } from "http";
import { api } from "@shared/routes";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";
import { generateImageFromText } from "./huggingface";

// Use direct Gemini API with your own API key from .env
const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post(api.posts.generate.path, async (req, res) => {
    try {
      const input = api.posts.generate.input.parse(req.body);

      const prompt = `You are an expert LinkedIn post creator. Create a highly engaging LinkedIn post based on the following topic or rough idea: "${input.topic}".
The tone of the post should be: ${input.tone}.
The output should just be the post content itself, without any extra conversation.
Make sure to include a good hook, engaging body, clear message, and a call to action. You can include optional hashtags at the end.`;

      const variations: string[] = [];
      for (let i = 0; i < 3; i++) {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        });
        variations.push(response.text || "");
      }

      // Try to generate one illustrative image with no text, based on the topic and tone
      let image: string | undefined;
      try {
        const imagePrompt = `Illustration for a LinkedIn post about: "${input.topic}". Tone: ${input.tone}. No text, no words, no letters in the image. Simple, clean, visually appealing.`;
        image = await generateImageFromText(imagePrompt);
      } catch (imageError) {
        console.error("Image generation failed:", imageError);
      }

      res
        .status(201)
        .json({ variations, tone: input.tone, originalPrompt: input.topic, image });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.posts.refine.path, async (req, res) => {
    try {
      const input = api.posts.refine.input.parse(req.body);

      const prompt = `You are an expert LinkedIn post editor. Please improve the following draft for a LinkedIn post and create multiple polished variants.
Draft:
"""
${input.draft}
"""

Please provide the output in the following JSON format:
{
  "improvedVersion": "the best full improved post text here",
  "suggestions": "a short summary of the improvements made",
  "variations": [
    "alternative improved version 1",
    "alternative improved version 2",
    "alternative improved version 3"
  ]
}
Output only valid JSON.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      let responseText = response.text || "{}";
      responseText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();

      let parsed: {
        improvedVersion?: string;
        suggestions?: string;
        variations?: string[];
      } = {};
      try {
        parsed = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse refinement response:", responseText);
      }

      const content = parsed.improvedVersion || responseText;
      const suggestions = parsed.suggestions;
      const variations = Array.isArray(parsed.variations) ? parsed.variations : [];

      // Try to generate one illustrative image with no text, based on the improved content
      let image: string | undefined;
      try {
        const imagePrompt = `Illustration for this LinkedIn post. No text, no words, no letters in the image. Simple, clean, visually appealing.\n\nPost:\n${content}`;
        image = await generateImageFromText(imagePrompt);
      } catch (imageError) {
        console.error("Image generation failed (refine):", imageError);
      }

      res.status(201).json({
        content,
        suggestions,
        variations,
        image,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}
