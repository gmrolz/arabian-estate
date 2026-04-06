import mysql from 'mysql2/promise';

const locationHierarchy = [
  // Cairo Governorate
  {
    nameAr: 'القاهرة',
    nameEn: 'Cairo',
    slug: 'cairo',
    level: 1,
    parentId: null,
    children: [
      {
        nameAr: 'مدينة القاهرة الجديدة',
        nameEn: 'New Cairo',
        slug: 'new-cairo',
        level: 2,
        children: [
          {
            nameAr: 'التجمع الخامس',
            nameEn: '5th Settlement',
            slug: '5th-settlement',
            level: 3,
            children: [
              {
                nameAr: 'مركبات التجمع الخامس',
                nameEn: '5th Settlement Compounds',
                slug: '5th-settlement-compounds',
                level: 4,
                children: [
                  {
                    nameAr: 'بالم هيلز نيو كايرو',
                    nameEn: 'Palm Hills New Cairo',
                    slug: 'palm-hills-new-cairo',
                    level: 5,
                  },
                  {
                    nameAr: 'هايد بارك',
                    nameEn: 'Hyde Park',
                    slug: 'hyde-park',
                    level: 5,
                  },
                ],
              },
              {
                nameAr: 'البنفسج',
                nameEn: 'El Banafseg',
                slug: 'el-banafseg',
                level: 4,
              },
            ],
          },
          {
            nameAr: 'التجمع السادس',
            nameEn: '6th Settlement',
            slug: '6th-settlement',
            level: 3,
          },
          {
            nameAr: 'مدينة',
            nameEn: 'Madinaty',
            slug: 'madinaty',
            level: 3,
          },
          {
            nameAr: 'مدينة الرحاب',
            nameEn: 'Rehab City',
            slug: 'rehab-city',
            level: 3,
          },
          {
            nameAr: 'مدينة شروق',
            nameEn: 'Shorouk City',
            slug: 'shorouk-city',
            level: 3,
          },
        ],
      },
      {
        nameAr: 'مصر الجديدة',
        nameEn: 'Heliopolis',
        slug: 'heliopolis',
        level: 2,
        children: [
          {
            nameAr: 'مدينة نصر',
            nameEn: 'Nasr City',
            slug: 'nasr-city',
            level: 3,
          },
          {
            nameAr: 'الكربة',
            nameEn: 'El Korba',
            slug: 'el-korba',
            level: 3,
          },
        ],
      },
      {
        nameAr: 'القاهرة القديمة',
        nameEn: 'Old Cairo Districts',
        slug: 'old-cairo',
        level: 2,
        children: [
          {
            nameAr: 'المعادي',
            nameEn: 'Maadi',
            slug: 'maadi',
            level: 3,
          },
          {
            nameAr: 'الزمالك',
            nameEn: 'Zamalek',
            slug: 'zamalek',
            level: 3,
          },
        ],
      },
    ],
  },
  // Giza Governorate
  {
    nameAr: 'الجيزة',
    nameEn: 'Giza',
    slug: 'giza',
    level: 1,
    parentId: null,
    children: [
      {
        nameAr: 'الشيخ زايد',
        nameEn: 'Sheikh Zayed',
        slug: 'sheikh-zayed',
        level: 2,
      },
      {
        nameAr: 'مدينة 6 أكتوبر',
        nameEn: '6th October',
        slug: '6th-october',
        level: 2,
        children: [
          {
            nameAr: 'المهندسين',
            nameEn: 'Mohandessin',
            slug: 'mohandessin',
            level: 3,
          },
          {
            nameAr: 'الدقي',
            nameEn: 'Dokki',
            slug: 'dokki',
            level: 3,
          },
        ],
      },
      {
        nameAr: 'الجيزة الجديدة',
        nameEn: 'New Giza',
        slug: 'new-giza',
        level: 2,
      },
    ],
  },
  // Alexandria Governorate
  {
    nameAr: 'الاسكندرية',
    nameEn: 'Alexandria',
    slug: 'alexandria',
    level: 1,
    parentId: null,
    children: [
      {
        nameAr: 'حي الشرق',
        nameEn: 'Hay Shark',
        slug: 'hay-shark',
        level: 3,
      },
      {
        nameAr: 'المنتزه',
        nameEn: 'Montazah',
        slug: 'montazah',
        level: 3,
      },
      {
        nameAr: 'لوران',
        nameEn: 'Laurent',
        slug: 'laurent',
        level: 3,
      },
    ],
  },
  // North Coast Governorate
  {
    nameAr: 'الساحل الشمالي',
    nameEn: 'North Coast',
    slug: 'north-coast',
    level: 1,
    parentId: null,
    children: [
      {
        nameAr: 'العلمين',
        nameEn: 'El Alamein',
        slug: 'el-alamein',
        level: 2,
        children: [
          {
            nameAr: 'سيدي عبد الرحمن',
            nameEn: 'Sidi Abd El Rahman',
            slug: 'sidi-abd-el-rahman',
            level: 3,
          },
          {
            nameAr: 'رأس الحكمة',
            nameEn: 'Ras El Hekma',
            slug: 'ras-el-hekma',
            level: 3,
          },
        ],
      },
      {
        nameAr: 'العلمين الجديدة',
        nameEn: 'New Alamein',
        slug: 'new-alamein',
        level: 2,
      },
    ],
  },
  // Red Sea Governorate
  {
    nameAr: 'محافظة البحر الأحمر',
    nameEn: 'Red Sea',
    slug: 'red-sea',
    level: 1,
    parentId: null,
    children: [
      {
        nameAr: 'الغردقة',
        nameEn: 'Hurghada',
        slug: 'hurghada',
        level: 2,
        children: [
          {
            nameAr: 'ساحل حشيش',
            nameEn: 'Sahl Hasheesh',
            slug: 'sahl-hasheesh',
            level: 3,
          },
          {
            nameAr: 'مقدي',
            nameEn: 'Makadi',
            slug: 'makadi',
            level: 3,
          },
          {
            nameAr: 'الجونة',
            nameEn: 'El Gouna',
            slug: 'el-gouna',
            level: 3,
          },
        ],
      },
    ],
  },
];

async function insertNode(connection, node, parentId = null) {
  const { children, ...locationData } = node;

  const query = 'INSERT INTO locations (nameAr, nameEn, slug, level, parentId, listingCount) VALUES (?, ?, ?, ?, ?, 0)';
  const [result] = await connection.execute(query, [
    locationData.nameAr,
    locationData.nameEn,
    locationData.slug,
    locationData.level,
    parentId,
  ]);

  const insertedId = result.insertId;

  if (children && children.length > 0) {
    for (const child of children) {
      await insertNode(connection, child, insertedId);
    }
  }
}

async function seedLocations() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  // Parse DATABASE_URL (mysql://user:password@host:port/database)
  const url = new URL(process.env.DATABASE_URL);
  const connection = await mysql.createConnection({
    host: url.hostname,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    port: parseInt(url.port || '3306'),
    ssl: { rejectUnauthorized: false },
  });

  console.log('Seeding locations...');

  try {
    for (const governorate of locationHierarchy) {
      await insertNode(connection, governorate);
    }

    console.log('✅ Locations seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding locations:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seedLocations();
