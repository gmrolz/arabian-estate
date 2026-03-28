/**
 * Smart Arabic-to-English translation for real estate titles.
 * Uses MyMemory API with real estate glossary and post-processing for better quality.
 */

// Post-process English output: fix common real estate terms
const EN_FIXES = [
  [/\bnew capital\b/gi, 'New Capital'],
  [/\bnew cairo\b/gi, 'New Cairo'],
  [/\bnew administrative capital\b/gi, 'New Administrative Capital'],
  [/\bfully finished\b/gi, 'Fully Finished'],
  [/\bsemi[- ]?finished\b/gi, 'Semi-Finished'],
  [/\bsuper lux\b/gi, 'Super Lux'],
  [/\bready to move\b/gi, 'Ready to Move'],
  [/\bdown payment\b/gi, 'Down Payment'],
  [/\bzero down\b/gi, 'Zero Down'],
  [/\b3br\b/gi, '3BR'],
  [/\b2br\b/gi, '2BR'],
  [/\b4br\b/gi, '4BR'],
  [/\b1br\b/gi, '1BR'],
  [/\bstudio\b/gi, 'Studio'],
  [/\bapartment\b/gi, 'Apartment'],
  [/\bapartments\b/gi, 'Apartments'],
  [/\bduplex\b/gi, 'Duplex'],
  [/\bpenthouse\b/gi, 'Penthouse'],
  [/\bvilla\b/gi, 'Villa'],
  [/\bluxury\b/gi, 'Luxury'],
  [/\bpremium\b/gi, 'Premium'],
  [/\bmodern\b/gi, 'Modern'],
  [/\bspacious\b/gi, 'Spacious'],
  [/\bcontemporary\b/gi, 'Contemporary'],
  [/\binvestment\b/gi, 'Investment'],
  [/\bresidential\b/gi, 'Residential'],
];

const CACHE = new Map();
const CACHE_MAX = 100;

function hasArabic(str) {
  if (!str || typeof str !== 'string') return false;
  return /[\u0600-\u06FF]/.test(str);
}

function postProcess(text) {
  if (!text || typeof text !== 'string') return '';
  let out = text.trim();
  EN_FIXES.forEach(([re, replacement]) => {
    out = out.replace(re, replacement);
  });
  const small = /\b(a|an|and|by|for|in|of|on|the|to|with)\b/gi;
  out = out.replace(/\b\w/g, (c) => c.toUpperCase());
  out = out.replace(small, (m) => m.toLowerCase());
  return out;
}

async function callMyMemory(text) {
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=ar|en`
    );
    const data = await res.json();
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      return data.responseData.translatedText.trim();
    }
  } catch (e) {
    console.warn('Translate API failed', e);
  }
  return '';
}

export async function translateArToEn(arabicText) {
  if (!arabicText || typeof arabicText !== 'string') return '';
  const text = arabicText.trim();
  if (!text) return '';
  const cached = CACHE.get(text);
  if (cached) return cached;
  if (!hasArabic(text)) return text;
  let result = await callMyMemory(text);
  if (result) result = postProcess(result);
  if (CACHE.size >= CACHE_MAX) {
    const first = CACHE.keys().next().value;
    if (first) CACHE.delete(first);
  }
  CACHE.set(text, result || '');
  return result || '';
}
