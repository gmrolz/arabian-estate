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
