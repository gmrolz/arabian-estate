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

// Extract budget from user message (supports both English and Arabic)
function extractBudget(message: string): number | null {
  const budgetPatterns = [
    /budget[\s:]*(?:of\s+)?(?:egp\s+)?([0-9,]+)\s*(?:million|m)?/i,
    /([0-9,]+)\s*(?:million|m)\s*(?:egp)?/i,
    /under\s+([0-9,]+)/i,
    /less than\s+([0-9,]+)/i,
    /ميزانية\s+([0-9,]+)/,
    /أقل من\s+([0-9,]+)/,
  ];

  for (const pattern of budgetPatterns) {
    const match = message.match(pattern);
    if (match) {
      const numStr = match[1].replace(/,/g, '');
      let budget = parseInt(numStr);
      // If number looks like millions (e.g., 5 instead of 5000000), multiply
      if (budget < 1000) budget *= 1000000;
      return budget;
    }
  }
  return null;
}

// Get live listing data for context (returns both context string and full listings)
async function getLiveListingData(): Promise<{ context: string; listings: any[] }> {
  try {
    const db = await getDb();
    if (!db) {
      return { context: 'Database connection unavailable.', listings: [] };
    }
    const allListings = await db.select().from(listings).limit(127);

    if (!allListings || allListings.length === 0) {
      return { context: 'No listings available at this time.', listings: [] };
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

    // Create detailed listing database for budget filtering
    const listingDatabase = allListings.map((l: any) => ({
      id: l.id,
      titleEn: l.titleEn,
      titleAr: l.titleAr,
      price: parseInt(l.price?.toString().replace(/,/g, '') || '0'),
      location: l.location,
      rooms: l.rooms,
      area: l.area,
      type: l.unitType,
      finishing: l.finishing,
      delivery: l.delivery,
    }));

    const contextString = `
CURRENT INVENTORY (${allListings.length} properties):
- Price Range: EGP ${minPrice.toLocaleString()} - EGP ${maxPrice.toLocaleString()}
- Locations: ${Array.from(areas).filter(Boolean).join(', ')}
- Property Types: ${Array.from(types).join(', ')}
- Finishing Options: ${Array.from(finishing).join(', ')}
- Delivery Times: ${Array.from(delivery).filter(Boolean).join(', ')}

Sample Properties:
${sampleListings.map((l: any) => `- ${l.title} | EGP ${l.price} | ${l.location} | ${l.rooms}BR | ${l.area}m²`).join('\n')}

FULL LISTING DATABASE:
${JSON.stringify(listingDatabase)}
    `.trim();

    return { context: contextString, listings: allListings };
  } catch (error) {
    console.error('Error fetching listing context:', error);
    return { context: 'Unable to fetch current inventory at this time.', listings: [] };
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

    // Detect language
    const isArabic = /[\u0600-\u06FF]/.test(message);

    // Extract budget from user message
    const userBudget = extractBudget(message);

    // Get live listing data
    const { context: listingContext, listings: allListings } = await getLiveListingData();

    // Build system instruction with live data
    const systemInstruction = `You are the AI assistant for Arabian Estate (arabianestate.com), Egypt's premium real estate platform. Your goal is to help visitors find their perfect property and connect them with our sales team.

PERSONALITY:
- Professional, warm, and knowledgeable like a real estate friend
- Speak naturally like chatting on WhatsApp — short, friendly, helpful
- Keep responses SHORT (2-3 sentences max). No walls of text.
- Support both Arabic and English (respond in the language the user writes in)
- Always be helpful and suggest alternatives if exact match not available
- Use simple language, avoid corporate jargon

${listingContext}

BUDGET-AWARE RESPONSES:
${userBudget ? `- User's stated budget: EGP ${userBudget.toLocaleString()}` : '- Ask about budget naturally if not provided'}
- If a property is outside user's budget, suggest similar properties within their budget
- Be honest: "This one is a bit above your budget, but I have great options around your range"
- Suggest 2-3 alternatives from our inventory

CONVERSATIONAL LEAD COLLECTION:
DO NOT use forms. Instead, collect information naturally through conversation:
- Ask ONE question at a time, never multiple questions in one message
- Flow example:
  1. First understand what they're looking for (location, type)
  2. Then ask about budget: "What's your budget range?" / "ايه الميزانية اللي مريحاك؟"
  3. Then bedrooms: "How many bedrooms do you need?" / "محتاج كام غرفة؟"
  4. Then ask for name: "By the way, what's your name so I can help you better?" / "بالمناسبة، اسمك ايه عشان أقدر أساعدك أحسن؟"
  5. Then phone: "Can I get your number? Our team will reach out with the best deals" / "ممكن رقمك؟ فريقنا هيتواصل معاك بأحسن العروض"
- Make it feel like a natural conversation, NOT an interrogation
- If they share their name, use it in responses to build rapport

CONVERSION RULES:
- After understanding their needs, naturally suggest WhatsApp
- Say things like: "Want me to send you the details on WhatsApp?" or "هتحب أبعتلك التفاصيل على الواتساب؟"
- If they ask for specific pricing, say: "Let me connect you with our team for the latest pricing" or "خليني أوصلك بفريقنا عشان آخر الأسعار"
- Never say "I don't know" — say "Let me check with our team and get back to you"
- Be persistent but not pushy about collecting contact info

RESPOND IN THE USER'S LANGUAGE:
${isArabic ? '- User is writing in Arabic, respond in Arabic (use Egyptian dialect when possible)' : '- User is writing in English, respond in English'}`;

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

    // Extract property suggestions from AI response or database
    const suggestedListings = (allListings || []).slice(0, 3).map((l: any) => {
      let images = [];
      try {
        images = typeof l.images === 'string' ? JSON.parse(l.images) : (l.images || []);
      } catch (e) {
        images = [];
      }
      return {
        id: l.id,
        titleEn: l.titleEn,
        titleAr: l.titleAr,
        projectEn: l.projectEn,
        projectAr: l.projectAr,
        location: l.location,
        price: l.price,
        area: l.area,
        rooms: l.rooms,
        toilets: l.toilets,
        finishing: l.finishing,
        delivery: l.delivery,
        images: images,
      };
    });

    res.json({ 
      response: aiResponse,
      cards: suggestedListings,
      cardType: 'properties'
    });
  } catch (error: any) {
    console.error('Gemini API error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error?.message || 'Unknown error',
      response: 'I apologize for the technical difficulty. Please try again or contact us via WhatsApp.',
      cards: [],
    });
  }
});

export default router;
