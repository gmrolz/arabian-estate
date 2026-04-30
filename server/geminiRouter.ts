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
    /([0-9,]+)\s*(?:جنيه|مليون)/,
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

// Extract bedrooms from message
function extractBedrooms(message: string): number | null {
  const patterns = [
    /(\d+)\s*(?:bed(?:room)?s?|br|غرف|غرفة)/i,
    /(?:bed(?:room)?s?|br|غرف|غرفة)\s*(\d+)/i,
  ];
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) return parseInt(match[1]);
  }
  return null;
}

// Extract location preferences from message
function extractLocation(message: string): string | null {
  const locationMap: Record<string, string[]> = {
    'new-capital': ['new capital', 'capital', 'عاصمة', 'العاصمة', 'nac', 'العاصمه'],
    'new-cairo': ['new cairo', 'cairo', 'القاهرة الجديدة', 'التجمع', 'tagamoa'],
    'mostakbal-city': ['mostakbal', 'مستقبل', 'المستقبل'],
    'north-coast': ['north coast', 'sahel', 'ساحل', 'الساحل'],
    'red-sea': ['red sea', 'البحر الأحمر', 'hurghada', 'الغردقة'],
    'sokhna': ['sokhna', 'سخنة', 'العين السخنة', 'ain sokhna'],
    'galala': ['galala', 'جلالة', 'الجلالة'],
    '6-october': ['october', 'أكتوبر', '6 october'],
    'sheikh-zayed': ['zayed', 'زايد', 'الشيخ زايد'],
  };

  const lowerMsg = message.toLowerCase();
  for (const [slug, keywords] of Object.entries(locationMap)) {
    for (const keyword of keywords) {
      if (lowerMsg.includes(keyword)) return slug;
    }
  }
  return null;
}

// Extract property type from message
function extractPropertyType(message: string): string | null {
  const typeMap: Record<string, string[]> = {
    'Apartment': ['apartment', 'apt', 'شقة', 'شقه'],
    'Villa': ['villa', 'فيلا', 'فيلات'],
    'Townhouse': ['townhouse', 'town house', 'تاون هاوس', 'تاون'],
    'Duplex': ['duplex', 'دوبلكس', 'دوبلكس'],
    'Penthouse': ['penthouse', 'بنتهاوس'],
    'Studio': ['studio', 'ستوديو', 'استوديو'],
    'Twin House': ['twin house', 'twin', 'توين هاوس'],
    'Chalet': ['chalet', 'شاليه'],
  };

  const lowerMsg = message.toLowerCase();
  for (const [type, keywords] of Object.entries(typeMap)) {
    for (const keyword of keywords) {
      if (lowerMsg.includes(keyword)) return type;
    }
  }
  return null;
}

// Extract developer from message
function extractDeveloper(message: string): string | null {
  const lowerMsg = message.toLowerCase();
  const developers = [
    'misr italia', 'la vista', 'stm', 'palm hills', 'emaar', 'sodic',
    'tatweer misr', 'hyde park', 'mountain view', 'ora', 'cred',
    'city edge', 'inertia', 'مصر ايطاليا', 'لافيستا', 'بالم هيلز',
  ];
  for (const dev of developers) {
    if (lowerMsg.includes(dev)) return dev;
  }
  return null;
}

// Extract all filters from the full conversation (not just last message)
function extractFiltersFromConversation(
  message: string,
  conversationHistory: any[] = []
): {
  budget: number | null;
  bedrooms: number | null;
  location: string | null;
  propertyType: string | null;
  developer: string | null;
} {
  // Combine all user messages for context
  const allUserMessages = [
    ...(conversationHistory || [])
      .filter((m: any) => m.sender === 'user')
      .map((m: any) => m.text),
    message,
  ].join(' ');

  return {
    budget: extractBudget(allUserMessages),
    bedrooms: extractBedrooms(allUserMessages),
    location: extractLocation(allUserMessages),
    propertyType: extractPropertyType(allUserMessages),
    developer: extractDeveloper(allUserMessages),
  };
}

// Filter and rank listings based on conversation context
function filterRelevantListings(
  allListings: any[],
  filters: {
    budget: number | null;
    bedrooms: number | null;
    location: string | null;
    propertyType: string | null;
    developer: string | null;
  }
): any[] {
  const hasAnyFilter = filters.budget || filters.bedrooms || filters.location || filters.propertyType || filters.developer;

  // If no filters detected, return featured listings
  if (!hasAnyFilter) {
    const featured = allListings.filter((l: any) => l.featured === 1 || l.featured === true);
    if (featured.length > 0) return featured.slice(0, 6);
    return allListings.slice(0, 6);
  }

  // Score each listing based on how well it matches the filters
  const scored = allListings.map((l: any) => {
    let score = 0;
    let matches = 0;

    // Budget match
    if (filters.budget) {
      const listingPrice = parseInt(l.price?.toString().replace(/,/g, '') || '0');
      if (listingPrice > 0) {
        const budgetRange = filters.budget * 0.3; // 30% tolerance
        if (listingPrice <= filters.budget + budgetRange && listingPrice >= filters.budget - budgetRange) {
          score += 30;
          matches++;
        } else if (listingPrice <= filters.budget) {
          score += 20;
          matches++;
        } else if (listingPrice <= filters.budget * 1.5) {
          score += 5; // slightly over budget
        }
      }
    }

    // Bedrooms match
    if (filters.bedrooms) {
      if (l.rooms === filters.bedrooms) {
        score += 25;
        matches++;
      } else if (Math.abs(l.rooms - filters.bedrooms) === 1) {
        score += 10; // close match
      }
    }

    // Location match
    if (filters.location) {
      const listingSlug = l.areaSlug || l.area_slug || '';
      const listingLocation = (l.location || '').toLowerCase();
      if (listingSlug === filters.location || listingLocation.includes(filters.location)) {
        score += 25;
        matches++;
      }
    }

    // Property type match
    if (filters.propertyType) {
      const listingType = (l.unitType || l.unit_type || '').toLowerCase();
      if (listingType === filters.propertyType.toLowerCase()) {
        score += 20;
        matches++;
      }
    }

    // Developer match
    if (filters.developer) {
      const devEn = (l.developerEn || l.developer_en || '').toLowerCase();
      const devAr = (l.developerAr || l.developer_ar || '').toLowerCase();
      if (devEn.includes(filters.developer) || devAr.includes(filters.developer)) {
        score += 20;
        matches++;
      }
    }

    // Bonus for featured listings
    if (l.featured === 1 || l.featured === true) {
      score += 5;
    }

    return { listing: l, score, matches };
  });

  // Filter out zero-score listings and sort by score
  const relevant = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  // Return up to 10 relevant listings
  if (relevant.length > 0) {
    return relevant.slice(0, 10).map((s) => s.listing);
  }

  // Fallback: if no matches, return featured
  const featured = allListings.filter((l: any) => l.featured === 1 || l.featured === true);
  if (featured.length > 0) return featured.slice(0, 6);
  return allListings.slice(0, 6);
}

// Get live listing data for context (returns both context string and full listings)
async function getLiveListingData(): Promise<{ context: string; listings: any[] }> {
  try {
    const db = await getDb();
    if (!db) {
      return { context: 'Database connection unavailable.', listings: [] };
    }
    const allListings = await db.select().from(listings).limit(500);

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
    const developers = new Set(allListings.map((l: any) => l.developerEn || '').filter(Boolean));

    // Create detailed listing database for AI context
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
      developer: l.developerEn,
      compound: l.compoundName,
    }));

    const contextString = `
CURRENT INVENTORY (${allListings.length} properties):
- Price Range: EGP ${minPrice.toLocaleString()} - EGP ${maxPrice.toLocaleString()}
- Locations: ${Array.from(areas).filter(Boolean).join(', ')}
- Property Types: ${Array.from(types).join(', ')}
- Finishing Options: ${Array.from(finishing).join(', ')}
- Delivery Times: ${Array.from(delivery).filter(Boolean).join(', ')}
- Developers: ${Array.from(developers).join(', ')}

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

    // Extract all filters from the full conversation
    const filters = extractFiltersFromConversation(message, conversationHistory);

    // Get live listing data
    const { context: listingContext, listings: allListings } = await getLiveListingData();

    // Build filter summary for AI context
    const filterSummary = [];
    if (filters.budget) filterSummary.push(`Budget: EGP ${filters.budget.toLocaleString()}`);
    if (filters.bedrooms) filterSummary.push(`Bedrooms: ${filters.bedrooms}`);
    if (filters.location) filterSummary.push(`Location: ${filters.location}`);
    if (filters.propertyType) filterSummary.push(`Type: ${filters.propertyType}`);
    if (filters.developer) filterSummary.push(`Developer: ${filters.developer}`);

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

DETECTED USER PREFERENCES:
${filterSummary.length > 0 ? filterSummary.join('\n') : 'No specific preferences detected yet — ask about their needs'}

IMPORTANT: The system will automatically show property cards below your response based on the user's preferences. You do NOT need to list property details in your text response. Instead:
- Acknowledge their preferences
- Give a brief helpful comment about the options
- Ask a follow-up question to narrow down or collect lead info
- Example: "Great taste! I found some amazing options in New Capital within your budget. Which one catches your eye?" or "عندي اختيارات حلوة في العاصمة في ميزانيتك. أي واحدة عجبتك؟"

BUDGET-AWARE RESPONSES:
${filters.budget ? `- User's stated budget: EGP ${filters.budget.toLocaleString()}` : '- Ask about budget naturally if not provided'}
- If a property is outside user's budget, suggest similar properties within their budget
- Be honest: "This one is a bit above your budget, but I have great options around your range"

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

    // Filter relevant listings based on conversation context
    const relevantListings = filterRelevantListings(allListings, filters);

    // Format listings for frontend cards
    const suggestedListings = relevantListings.map((l: any) => {
      let images: any[] = [];
      try {
        images = typeof l.images === 'string' ? JSON.parse(l.images) : (l.images || []);
      } catch (e) {
        images = [];
      }
      return {
        id: l.id,
        titleEn: l.titleEn,
        titleAr: l.titleAr,
        developerEn: l.developerEn,
        developerAr: l.developerAr,
        projectEn: l.projectEn,
        projectAr: l.projectAr,
        compoundName: l.compoundName,
        location: l.location,
        areaSlug: l.areaSlug,
        price: l.price,
        downpayment: l.downpayment,
        monthlyInst: l.monthlyInst,
        area: l.area,
        rooms: l.rooms,
        toilets: l.toilets,
        finishing: l.finishing,
        delivery: l.delivery,
        unitType: l.unitType,
        paymentYears: l.paymentYears,
        images: images,
        featured: l.featured,
      };
    });

    res.json({ 
      response: aiResponse,
      cards: suggestedListings,
      cardType: 'properties',
      filters: {
        budget: filters.budget,
        bedrooms: filters.bedrooms,
        location: filters.location,
        propertyType: filters.propertyType,
        developer: filters.developer,
        matchCount: suggestedListings.length,
      },
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
