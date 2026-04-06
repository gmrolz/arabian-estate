/**
 * Location routing utilities for Pattern A URLs
 * Pattern: /[lang]/[intent]/[governorate]/[property-type]-[intent][-area-slug].html
 * 
 * Examples:
 * - /en/buy/cairo/apartment-buy-new-cairo.html
 * - /ar/rent/giza/villa-rent-sheikh-zayed.html
 * - /en/buy/alexandria/studio-buy.html
 */

import { Location } from '../../drizzle/schema';

export interface LocationBreadcrumb {
  level: number;
  name: string;
  slug: string;
  url: string;
}

export interface LocationPath {
  governorate: Location;
  city?: Location;
  district?: Location;
  subArea?: Location;
  compound?: Location;
}

/**
 * Generate Pattern A URL for a listing
 */
export function generateListingUrl(
  lang: 'en' | 'ar',
  intent: 'buy' | 'rent',
  propertyType: string,
  governorateSlug: string,
  areaSlug?: string
): string {
  const parts = [lang, intent, governorateSlug, `${propertyType}-${intent}`];

  if (areaSlug && areaSlug !== governorateSlug) {
    parts.push(areaSlug);
  }

  return `/${parts.join('/')}.html`;
}

/**
 * Parse Pattern A URL to extract components
 */
export function parseListingUrl(url: string): {
  lang: 'en' | 'ar';
  intent: 'buy' | 'rent';
  governorate: string;
  propertyType: string;
  areaSlug?: string;
} | null {
  // Remove .html and split by /
  const cleanUrl = url.replace(/\.html$/, '').split('/').filter(Boolean);

  if (cleanUrl.length < 4) return null;

  const [lang, intent, governorate, propertyIntentPart] = cleanUrl;

  if (!['en', 'ar'].includes(lang) || !['buy', 'rent'].includes(intent)) {
    return null;
  }

  // Extract property type from "apartment-buy" format
  const [propertyType] = propertyIntentPart.split('-');

  // Area slug is optional (everything after the 4th part)
  const areaSlug = cleanUrl[4];

  return {
    lang: lang as 'en' | 'ar',
    intent: intent as 'buy' | 'rent',
    governorate,
    propertyType,
    areaSlug,
  };
}

/**
 * Generate breadcrumbs for a location path
 */
export function generateBreadcrumbs(
  lang: 'en' | 'ar',
  intent: 'buy' | 'rent',
  locationPath: LocationPath,
  propertyType: string = 'apartment'
): LocationBreadcrumb[] {
  const breadcrumbs: LocationBreadcrumb[] = [];

  // Governorate
  breadcrumbs.push({
    level: 1,
    name: lang === 'en' ? locationPath.governorate.nameEn : locationPath.governorate.nameAr,
    slug: locationPath.governorate.slug,
    url: generateListingUrl(lang, intent, propertyType, locationPath.governorate.slug),
  });

  // City
  if (locationPath.city) {
    breadcrumbs.push({
      level: 2,
      name: lang === 'en' ? locationPath.city.nameEn : locationPath.city.nameAr,
      slug: locationPath.city.slug,
      url: generateListingUrl(lang, intent, propertyType, locationPath.governorate.slug, locationPath.city.slug),
    });
  }

  // District
  if (locationPath.district) {
    breadcrumbs.push({
      level: 3,
      name: lang === 'en' ? locationPath.district.nameEn : locationPath.district.nameAr,
      slug: locationPath.district.slug,
      url: generateListingUrl(lang, intent, propertyType, locationPath.governorate.slug, locationPath.district.slug),
    });
  }

  // Sub-area
  if (locationPath.subArea) {
    breadcrumbs.push({
      level: 4,
      name: lang === 'en' ? locationPath.subArea.nameEn : locationPath.subArea.nameAr,
      slug: locationPath.subArea.slug,
      url: generateListingUrl(lang, intent, propertyType, locationPath.governorate.slug, locationPath.subArea.slug),
    });
  }

  // Compound
  if (locationPath.compound) {
    breadcrumbs.push({
      level: 5,
      name: lang === 'en' ? locationPath.compound.nameEn : locationPath.compound.nameAr,
      slug: locationPath.compound.slug,
      url: generateListingUrl(lang, intent, propertyType, locationPath.governorate.slug, locationPath.compound.slug),
    });
  }

  return breadcrumbs;
}

/**
 * Get all locations at a specific level
 */
export function filterLocationsByLevel(locations: Location[], level: number): Location[] {
  return locations.filter((loc) => loc.level === level);
}

/**
 * Get children of a location
 */
export function getLocationChildren(locations: Location[], parentId: number): Location[] {
  return locations.filter((loc) => loc.parentId === parentId);
}

/**
 * Get full path from a location to root
 */
export function getLocationPath(locations: Location[], locationId: number): Location[] {
  const path: Location[] = [];
  let currentId: number | null = locationId;

  while (currentId !== null) {
    const location = locations.find((loc) => loc.id === currentId);
    if (!location) break;

    path.unshift(location);
    currentId = location.parentId;
  }

  return path;
}
