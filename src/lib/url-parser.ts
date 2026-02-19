import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");

export interface ParsedEvent {
  title: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  location_name: string | null;
  location_address: string | null;
  is_online: boolean;
  online_url: string | null;
  categories: string[];
  image_url: string | null;
  organizer_name: string;
  organizer_title: string | null;
  organizer_company: string | null;
}

export async function parseEventFromURL(url: string, html: string): Promise<ParsedEvent> {
  const prompt = `Extract structured event information from this webpage content. The URL is: ${url}

Return a JSON object with these exact fields:
- title (string, required)
- description (string or null — a brief summary, max 500 chars)
- start_date (ISO 8601 datetime string or null)
- end_date (ISO 8601 datetime string or null)
- location_name (string or null — venue name)
- location_address (string or null — full address)
- is_online (boolean)
- online_url (string or null — link to join if online)
- categories (array of strings from: networking, product, startup, tech, career, community, education, other)
- image_url (string or null — event banner/cover image URL)
- organizer_name (string, required — who is hosting)
- organizer_title (string or null — their job title)
- organizer_company (string or null — their company)

If you can't determine a field, use null. For categories, pick the most relevant 1-2.
For organizer info, look for host names, presenter bios, "organized by", etc.

Return ONLY valid JSON, no markdown formatting, no explanation.

Webpage content:
${html.slice(0, 15000)}`;

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  const result = await model.generateContent(prompt);
  const text = result.response.text();

  // Extract JSON from response (handle potential markdown wrapping)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse event data from AI response");
  }

  return JSON.parse(jsonMatch[0]) as ParsedEvent;
}
