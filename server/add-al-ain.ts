import { getDb } from './db';
import { locations } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

async function addAlAlmain() {
  try {
    const db = await getDb();
    if (!db) {
      console.error('Database connection failed');
      process.exit(1);
    }
    
    // Check if Al Almain already exists
    const alAlmainExists = await db
      .select()
      .from(locations)
      .where(eq(locations.nameEn, 'Al Almain'))
      .limit(1);
    
    if (alAlmainExists.length > 0) {
      console.log('Al Almain already exists in database (ID: ' + alAlmainExists[0].id + ')');
      return;
    }
    
    // Check if Egypt governorate exists
    let egyptId: number;
    const egyptGov = await db
      .select()
      .from(locations)
      .where(eq(locations.nameEn, 'Egypt'))
      .limit(1);
    
    if (egyptGov.length === 0) {
      // Create Egypt governorate
      const result = await db.insert(locations).values({
        nameAr: 'مصر',
        nameEn: 'Egypt',
        slug: 'egypt',
        level: 1,
        parentId: null,
        listingCount: 0,
      });
      egyptId = (result as any).insertId;
      console.log('Created Egypt governorate (ID: ' + egyptId + ')');
    } else {
      egyptId = egyptGov[0].id;
    }
    
    // Add Al Almain as a city (level 2)
    const result = await db.insert(locations).values({
      nameAr: 'الالمين',
      nameEn: 'Al Almain',
      slug: 'al-almain',
      level: 2,
      parentId: egyptId,
      listingCount: 0,
    });
    
    console.log('Added Al Almain city (ID: ' + (result as any).insertId + ', Parent: ' + egyptId + ')');
  } catch (err) {
    console.error('Error:', (err as any).message);
    process.exit(1);
  }
}

addAlAlmain();
