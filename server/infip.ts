export async function generateImageFromText(prompt: string): Promise<string[]> {
  const INFIP_API_KEY = process.env.INFIP_API_KEY || "infip-d95aa4a6";
  const url = "https://api.infip.pro/v1/images/generations";

  const payload = {
    model: "img4",
    prompt: `${prompt}. ABSOLUTELY NO TEXT, NO FONTS, NO LETTERS, NO ALPHABETS, NO TYPOGRAPHY, NO LABELS, NO SIGNAGE, NO WATERMARKS. The image must be 100% text-free and purely visual.`,
    n: 3,
    size: "1024x1024",
    response_format: "url"
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      "Authorization": `Bearer ${INFIP_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (response.ok && data.data && data.data.length > 0) {
    return data.data.map((img: any) => img.url);
  } else {
    throw new Error(`Failed to generate images via GhostAPI: ${JSON.stringify(data)}`);
  }
}

