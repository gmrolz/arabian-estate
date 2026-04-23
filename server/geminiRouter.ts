import express, { Router } from 'express';
import { getDb } from './db';
import { listings } from '../drizzle/schema';

const router: Router = express.Router();

// Rate limiting: simple in-memory store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimitStore.get(ip);

  if (!limit || now > limit.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + 60000 }); // 60 second window
    return true;
  }

  if (limit.count >= 20) {
    return false; // Max 20 requests per minute
  }

  limit.count++;
  return true;
}

// Get live listing data for context
async function getLiveListingContext(): Promise<string> {
  try {
    const db = await getDb();
    if (!db) {
      return 'Database connection unavailable.';
    }
    const allListings = await db.select().from(listings).limit(127);

    if (!allListings || allListings.length === 0) {
      return 'No listings available at this time.';
    }

    // Extract key data
    const prices = allListings
      .map((l: any) => {
        const price = l.price?.toString().replace(/,/g, '');
        return parseInt(price) || 0;
      })
      .filter((p: number) => p > 0);

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    const areas = new Set(
      allListings.map((l: any) => {
        const loc = l.location?.split(',')[1]?.trim() || '';
        return loc;
      })
    );

    const types = new Set(allListings.map((l: any) => l.unitType || 'Apartment'));
    const finishing = new Set(allListings.map((l: any) => l.finishing || 'Semi Finished'));
    const delivery = new Set(allListings.map((l: any) => l.delivery || ''));

    // Sample listings for context
    const sampleListings = allListings.slice(0, 5).map((l: any) => ({
      title: l.titleEn,
      price: l.price,
      location: l.location,
      rooms: l.rooms,
      area: l.area,
      type: l.unitType,
    }));

    return `
CURRENT INVENTORY (${allListings.length} properties):
- Price Range: EGP ${minPrice.toLocaleString()} - EGP ${maxPrice.toLocaleString()}
- Locations: ${Array.from(areas).filter(Boolean).join(', ')}
- Property Types: ${Array.from(types).join(', ')}
- Finishing Options: ${Array.from(finishing).join(', ')}
- Delivery Times: ${Array.from(delivery).filter(Boolean).join(', ')}

Sample Properties:
${sampleListings.map((l: any) => `- ${l.title} | ${l.price} | ${l.location} | ${l.rooms}BR | ${l.area}m²`).join('\n')}
    `.trim();
  } catch (error) {
    console.error('Error fetching listing context:', error);
    return 'Unable to fetch current inventory at this time.';
  }
}

// POST /api/gemini/chat
router.post('/chat', async (req: any, res: any) => {
  try {
    // Check rate limit
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    if (!checkRateLimit(clientIp)) {
      return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
    }

    const { message, conversationHistory } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required and must be a string' });
    }

    if (message.length > 500) {
      return res.status(400).json({ error: 'Message is too long (max 500 characters)' });
    }

    // Get live listing context
    const listingContext = await getLiveListingContext();

    // Build system instruction with live data
    const systemInstruction = `You are the AI assistant for Arabian Estate (arabianestate.com), Egypt's premium real estate platform. Your goal is to help visitors find their perfect property and connect them with our sales team.

PERSONALITY:
- Professional, warm, and knowledgeable
- Speak like a luxury real estate consultant
- Be concise (max 3-4 sentences per response)
- Support both Arabic and English (respond in the language the user writes in)

${listingContext}

LEAD QUALIFICATION:
When a user asks about properties, ask about:
1. Preferred location
2. Budget range
3. Number of bedrooms
4. Preferred delivery time

CONVERSION RULES:
- After 2-3 exchanges, ALWAYS suggest contacting via WhatsApp
- Include a clear CTA: "Would you like me to connect you with our team on WhatsApp?"
- If the user asks for specific pricing or availability, say: "For the latest pricing and availability, our team can help you directly on WhatsApp"
- Never say "I don't know" — instead say "Our team can provide detailed information about that. Shall I connect you via WhatsApp?"

WEBSITE LINKS:
- All properties: /listings
- New Administrative Capital: /listings/cairo/new-administrative-capital-collection
- New Cairo: /listings/cairo/new-cairo-collection
- North Coast: /listings/cairo/north-coast-collection
- Red Sea: /listings/cairo/red-sea-collection`;

    // Build conversation contents
    const contents: any[] = [];

    // Add conversation history if provided
    if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      conversationHistory.forEach((msg: any) => {
        if (msg.sender === 'user') {
          contents.push({
            role: 'user',
            parts: [{ text: msg.text }],
          });
        } else if (msg.sender === 'ai') {
          contents.push({
            role: 'model',
            parts: [{ text: msg.text }],
          });
        }
      });
    }

    // Add current user message
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    // Call Gemini API with correct model and endpoint
    const apiKey = process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      console.error('VITE_GEMINI_API_KEY not set');
      return res.status(500).json({ error: 'API configuration error' });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemInstruction }],
          },
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error:', errorData);
      return res.status(response.status).json({
        error: 'Failed to generate response from AI',
        details: errorData?.error?.message || 'Unknown error',
      });
    }

    const data = await response.json();

    // Extract response text
    const aiResponse =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      'I apologize, I could not process your request. Please contact us via WhatsApp for assistance.';

    res.json({ response: aiResponse });
  } catch (error: any) {
    console.error('Gemini API error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error?.message || 'Unknown error',
    });
  }
});

export default router;
