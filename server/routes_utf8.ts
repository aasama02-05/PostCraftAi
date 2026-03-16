import type { Express } from "express";
import type { Server } from "http";
import { api } from "@shared/routes";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";
import { generateImageFromText } from "./infip";

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

      // Array to store variations with their respective providers
      const variations: { content: string, provider: string }[] = [];

      // Helper function to safely fetch from a provider and add to variations
      const tryGenerate = async (providerName: string, generationPromise: Promise<string>) => {
        try {
          const result = await generationPromise;
          if (result && result.trim() !== "") {
            variations.push({ content: result.trim(), provider: providerName });
            return true;
          }
        } catch (err) {
          console.warn(`[Silent Failover] ${providerName} failed to generate content. Error logic caught.`);
        }
        return false;
      };

      // Define our available generation tasks
      const geminiTask = () => ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
      }).then(res => res.text || "");
      
      const groqTask = () => fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{role: 'user', content: prompt}]
          })
      }).then(res => {
          if (!res.ok) throw new Error("Groq API Error");
          return res.json();
      }).then(data => data.choices[0].message.content);

      const nvidiaTask = () => fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'qwen/qwen3-next-80b-a3b-instruct',
            messages: [{role: 'user', content: prompt}],
            temperature: 0.6,
            top_p: 0.7,
            max_tokens: 4096,
          })
      }).then(res => {
          if (!res.ok) throw new Error("NVIDIA API Error");
          return res.json();
      }).then(data => data.choices[0].message.content);

      // Execute primary batch
      await Promise.allSettled([
        tryGenerate("gemini", geminiTask()),
        tryGenerate("groq", groqTask()),
        tryGenerate("nvidia", nvidiaTask())
      ]);

      // If we don't have exactly 3 variations due to quota limits, keep retrying the ones we do have
      // until we hit exactly 3 objects.
      let retries = 0;
      const fallbackQueue = [
        { name: "groq", task: groqTask },
        { name: "nvidia", task: nvidiaTask },
        { name: "gemini", task: geminiTask }
      ];

      while (variations.length < 3 && retries < 4) {
        for (const provider of fallbackQueue) {
          if (variations.length >= 3) break;
          // Attempt a backup retry
          await tryGenerate(provider.name, provider.task());
        }
        retries++;
      }

      // Try to generate illustrative images with no text, based on the topic and tone
      let images: string[] = [];
      try {
        const imagePrompt = `Illustration for a LinkedIn post about: "${input.topic}". Tone: ${input.tone}. No text, no words, no letters in the image. Simple, clean, visually appealing.`;
        images = await generateImageFromText(imagePrompt);
      } catch (imageError) {
        console.error("Image generation failed:", imageError);
      }

      res
        .status(201)
        .json({ variations, tone: input.tone, originalPrompt: input.topic, images });
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

      const parseJsonSafely = (text: string) => {
        try {
          let cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
          const parsed = JSON.parse(cleaned);
          const result = parsed.improvedVersion || parsed.variations?.[0] || text;
          return typeof result === 'string' ? result : JSON.stringify(result, null, 2);
        } catch {
          return text;
        }
      };

      const variations: { content: string, provider: string }[] = [];

      const tryRefine = async (providerName: string, refinePromise: Promise<string>) => {
        try {
          const result = await refinePromise;
          if (result && result.trim() !== "") {
            const parsedContent = parseJsonSafely(result.trim());
            // Skip if the AI just returned the original draft exactly
            if (parsedContent.trim() === input.draft.trim()) {
              console.log(`[Silent Failover] AI returned exact draft copy for ${providerName}. Skipping.`);
              return false;
            }
            variations.push({ content: parsedContent, provider: providerName });
            return true;
          }
        } catch (err) {
          console.warn(`[Silent Failover] ${providerName} failed to refine draft. Error logic caught.`);
        }
        return false;
      };

      const geminiTask = () => ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
      }).then(res => res.text || "");

      const groqTask = () => fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{role: 'user', content: prompt}],
            response_format: { type: "json_object" }
          })
      }).then(res => {
          if (!res.ok) throw new Error("Groq API Error");
          return res.json();
      }).then(data => data.choices[0].message.content);

      const nvidiaTask = () => fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'qwen/qwen3-next-80b-a3b-instruct',
            messages: [{role: 'user', content: prompt}],
            temperature: 0.6,
            top_p: 0.7,
            max_tokens: 4096,
          })
      }).then(res => {
          if (!res.ok) throw new Error("NVIDIA API Error");
          return res.json();
      }).then(data => data.choices[0].message.content);


      // Primary Execution
      await Promise.allSettled([
        tryRefine("gemini", geminiTask()),
        tryRefine("groq", groqTask()),
        tryRefine("nvidia", nvidiaTask())
      ]);

      // Fallback Engine
      let retries = 0;
      const fallbackQueue = [
        { name: "groq", task: groqTask },
        { name: "nvidia", task: nvidiaTask },
        { name: "gemini", task: geminiTask }
      ];

      while (variations.length < 3 && retries < 4) {
        for (const provider of fallbackQueue) {
          if (variations.length >= 3) break;
          await tryRefine(provider.name, provider.task());
        }
        retries++;
      }

      const images: string[] = []; 

      res.status(201).json({
        content: variations[0]?.content || "Failed to refine.", // Provide the first *refined* post as default Polished view
        suggestions: "PROVE_CODE_VERSION_1",
        variations,
        images,
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

  app.post(api.posts.images.path, async (req, res) => {
    try {
      const input = api.posts.images.input.parse(req.body);
      let images: string[] = [];
      try {
        const imagePrompt = `Illustration for a LinkedIn post about: "${input.topic}". No text, no words, no letters in the image. Simple, clean, visually appealing.`;
        images = await generateImageFromText(imagePrompt);
      } catch (imageError) {
        console.error("Image generation retry failed:", imageError);
      }
      res.status(201).json({ images });
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

  app.post(api.posts.edit.path, async (req, res) => {
    try {
      const input = api.posts.edit.input.parse(req.body);

      const prompt = `You are an expert LinkedIn post editor. Here is a post:
"""
${input.originalContent}
"""

The user requested these specific changes:
"""
${input.instructions}
"""

Modify the post exactly as requested and output only the new post text. Do not include any conversational filler. Keep the same tone and format unless explicitly told to change it.`;

      let finalContent = "";
      console.log(`[Targeted Edit] Routing modification specifically to: ${input.provider}`);

      // Helper logic
      const runGroq = () => fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{role: 'user', content: prompt}] })
      }).then(res => res.ok ? res.json() : Promise.reject()).then(data => data.choices[0].message.content);

      const runNvidia = () => fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'qwen/qwen3-next-80b-a3b-instruct', messages: [{role: 'user', content: prompt}] })
      }).then(res => res.ok ? res.json() : Promise.reject()).then(data => data.choices[0].message.content);

      const runGemini = () => ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt }).then(res => res.text || "");

      try {
        // Step 1. Try hitting the exact AI provider the user explicitly made this output with
        if (input.provider === "groq") finalContent = await runGroq();
        else if (input.provider === "nvidia") finalContent = await runNvidia();
        else if (input.provider === "gemini") finalContent = await runGemini();
        else {
          // Fallback if 'original-draft' edited, defaults to Groq as it is fastest
          finalContent = await runGroq(); 
        }
      } catch (targetedError) {
        console.warn(`[Targeted Edit] Targeted provider ${input.provider} failed! Bouncing to Fallback loop...`);
        // Step 2. If their specific provider quota limits, default to the cascading safety loop we built
        try { finalContent = await runGroq(); } catch(e1) {
          try { finalContent = await runNvidia(); } catch (e2) {
            try { finalContent = await runGemini(); } catch(e3) {
               console.error("ALL Providers exhausted during edit fallback.");
            }
          }
        }
      }

      res.status(201).json({
        content: finalContent || "Failed to generate edited content from any provider."
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
