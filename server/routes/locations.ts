import { Router } from 'express';
import { getDb } from '../db';
import { locations } from '../../drizzle/schema';
import { eq, like, and, or } from 'drizzle-orm';

const router = Router();

/**
 * GET /api/locations
 * Get all governorates (level 1)
 */
router.get('/', async (req, res) => {
  try {
    const db = await getDb();

    if (!db) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const governorates = await db
      .select()
      .from(locations)
      .where(eq(locations.level, 1));

    res.json(governorates);
  } catch (error) {
    console.error('[Locations] Get governorates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/locations/search?q=cairo&level=1
 * Search locations by name (bilingual) with optional level filter
 */
router.get('/search', async (req, res) => {
  try {
    const { q, level } = req.query;
    const db = await getDb();

    if (!db) {
      return res.status(503).json({ error: 'Database not available' });
    }

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const query = `%${q}%`;
    let results;

    if (level && !isNaN(Number(level))) {
      const levelNum = Number(level);
      results = await db
        .select()
        .from(locations)
        .where(
          and(
            or(
              like(locations.nameEn, query),
              like(locations.nameAr, query)
            ),
            eq(locations.level, levelNum)
          )
        )
        .limit(20);
    } else {
      results = await db
        .select()
        .from(locations)
        .where(
          or(
            like(locations.nameEn, query),
            like(locations.nameAr, query)
          )
        )
        .limit(20);
    }

    res.json(results);
  } catch (error) {
    console.error('[Locations] Search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/locations/by-slug/:slug
 * Get location by slug
 */
router.get('/by-slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const db = await getDb();

    if (!db) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const location = await db
      .select()
      .from(locations)
      .where(eq(locations.slug, slug))
      .limit(1);

    if (location.length === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }

    res.json(location[0]);
  } catch (error) {
    console.error('[Locations] Get by slug error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/locations/all
 * Get all locations (all levels) — used by admin for building the location map
 */
router.get('/all', async (req, res) => {
  try {
    const db = await getDb();
    if (!db) return res.status(503).json({ error: 'Database not available' });
    const all = await db.select().from(locations);
    res.json(all);
  } catch (error) {
    console.error('[Locations] Get all error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/locations/level/:level
 * Get all locations at a specific level
 */
router.get('/level/:level', async (req, res) => {
  try {
    const { level } = req.params;
    const db = await getDb();

    if (!db) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const levelNum = Number(level);
    if (isNaN(levelNum) || levelNum < 1 || levelNum > 5) {
      return res.status(400).json({ error: 'Invalid level (must be 1-5)' });
    }

    const results = await db
      .select()
      .from(locations)
      .where(eq(locations.level, levelNum));

    res.json(results);
  } catch (error) {
    console.error('[Locations] Get by level error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/locations/by-path?slugs=cairo,east-cairo,area-new-capital
 * Resolve a chain of slugs to location objects (for breadcrumbs)
 */
router.get('/by-path', async (req, res) => {
  try {
    const { slugs } = req.query as { slugs?: string };
    if (!slugs) return res.json([]);
    const db = await getDb();
    if (!db) return res.status(503).json({ error: 'Database not available' });
    const slugList = slugs.split(',').map((s: string) => s.trim()).filter(Boolean);
    const results: any[] = [];
    for (const slug of slugList) {
      const found = await db.select().from(locations).where(eq(locations.slug, slug)).limit(1);
      results.push(found[0] || null);
    }
    res.json(results);
  } catch (error) {
    console.error('[Locations] By-path error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/locations/:id/children
 * Get all children of a location
 */
router.get('/:id/children', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();

    if (!db) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const parentId = Number(id);
    if (isNaN(parentId)) {
      return res.status(400).json({ error: 'Invalid parent ID' });
    }

    const children = await db
      .select()
      .from(locations)
      .where(eq(locations.parentId, parentId));

    res.json(children);
  } catch (error) {
    console.error('[Locations] Get children error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/locations
 * Create a new location
 */
router.post('/', async (req, res) => {
  try {
    const { nameEn, nameAr, slug, level, parentId } = req.body;
    const db = await getDb();

    if (!db) {
      return res.status(503).json({ error: 'Database not available' });
    }

    if (!nameEn || !nameAr || !slug || !level) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (level < 1 || level > 5) {
      return res.status(400).json({ error: 'Invalid level (must be 1-5)' });
    }

    // Check if slug already exists
    const existing = await db
      .select()
      .from(locations)
      .where(eq(locations.slug, slug))
      .limit(1);

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Slug already exists' });
    }

    // Validate parent if not root level
    if (level > 1 && parentId) {
      const parent = await db
        .select()
        .from(locations)
        .where(eq(locations.id, parentId))
        .limit(1);

      if (parent.length === 0 || parent[0].level !== level - 1) {
        return res.status(400).json({ error: 'Invalid parent location' });
      }
    }

    await db
      .insert(locations)
      .values({
        nameEn,
        nameAr,
        slug,
        level,
        parentId: level > 1 ? parentId : null,
      });

    // Fetch the created location
    const created = await db
      .select()
      .from(locations)
      .where(eq(locations.slug, slug))
      .limit(1);

    res.status(201).json(created[0]);
  } catch (error) {
    console.error('[Locations] Create error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/locations/:id
 * Update a location
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nameEn, nameAr, slug } = req.body;
    const db = await getDb();

    if (!db) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const locationId = Number(id);
    if (isNaN(locationId)) {
      return res.status(400).json({ error: 'Invalid location ID' });
    }

    const location = await db
      .select()
      .from(locations)
      .where(eq(locations.id, locationId))
      .limit(1);

    if (location.length === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }

    const updateData: any = {};
    if (nameEn) updateData.nameEn = nameEn;
    if (nameAr) updateData.nameAr = nameAr;
    if (slug) updateData.slug = slug;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const result = await db
      .update(locations)
      .set(updateData)
      .where(eq(locations.id, locationId));

    res.json(location[0]);
  } catch (error) {
    console.error('[Locations] Update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/locations/:id
 * Delete a location (only if no children or listings)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();

    if (!db) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const locationId = Number(id);
    if (isNaN(locationId)) {
      return res.status(400).json({ error: 'Invalid location ID' });
    }

    const location = await db
      .select()
      .from(locations)
      .where(eq(locations.id, locationId))
      .limit(1);

    if (location.length === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }

    // Check for children
    const children = await db
      .select()
      .from(locations)
      .where(eq(locations.parentId, locationId));

    if (children.length > 0) {
      return res.status(400).json({ error: 'Cannot delete location with children' });
    }

    // Check for listings
    if (location[0].listingCount && location[0].listingCount > 0) {
      return res.status(400).json({ error: 'Cannot delete location with listings' });
    }

    await db.delete(locations).where(eq(locations.id, locationId));

    res.json({ success: true });
  } catch (error) {
    console.error('[Locations] Delete error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/locations/:id
 * Get a single location by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();

    if (!db) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const locationId = Number(id);
    if (isNaN(locationId)) {
      return res.status(400).json({ error: 'Invalid location ID' });
    }

    const location = await db
      .select()
      .from(locations)
      .where(eq(locations.id, locationId))
      .limit(1);

    if (location.length === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }

    res.json(location[0]);
  } catch (error) {
    console.error('[Locations] Get error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
