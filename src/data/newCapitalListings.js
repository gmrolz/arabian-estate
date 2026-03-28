// Arabian Estate — New Capital Inventory
// Images from public/projects/ (Google Projects folders)

const img = (folder, ...files) =>
  files.map((f) => `/projects/${encodeURIComponent(folder)}/${encodeURIComponent(f)}`);

const PROJECT_IMAGES = {
  'HPC': img('HPC (Hyde Park Central)', 'Screenshot 2025-12-05 015704.png', 'Screenshot 2025-12-05 015717.png', 'Screenshot 2025-12-05 015739.png', 'Screenshot 2025-12-05 015806.png', 'Screenshot 2025-12-05 015822.png', 'Screenshot 2025-12-05 015844.png'),
  'Patio Vida': img('Patio Vida', 'Screenshot 2025-01-30 212656_1400x900.jpg', 'Screenshot 2025-01-30 212726_1400x900.jpg', 'Screenshot 2025-01-30 212743_1400x900.jpg', 'Screenshot 2025-01-30 212802_1400x900.jpg', 'Screenshot 2025-01-30 212818_1400x900.jpg', 'Screenshot 2025-01-30 212833_1400x900.jpg'),
  'Mayan': img('Mayan', '1.jpeg', '2.jpeg', '3.jpeg', '4.jpeg', '5.jpeg', 'WhatsApp Image 2026-03-12 at 1.02.25 PM.jpeg'),
  'Lifewise': img('Lifewise', 'Screenshot 2025-11-21 024019.png', 'Screenshot 2025-11-21 024053.png', 'Screenshot 2025-11-21 024113.png', 'Screenshot 2025-11-21 024135.png', 'Screenshot 2025-11-21 024153.png', 'Screenshot 2025-11-21 024214.png'),
  'Telal East': img('Telal East', 'Screenshot 2026-03-12 132036.png', 'Screenshot 2026-03-12 132056.png', 'Screenshot 2026-03-12 132112.png', 'Screenshot 2026-03-12 132133.png', 'Screenshot 2026-03-12 132154.png', 'Screenshot 2026-03-12 132221.png'),
  'Tierra': img('Tierra', 'Screenshot 2025-10-25 030408.png', 'Screenshot 2025-10-25 030428.png', 'Screenshot 2025-10-25 030441.png', 'Screenshot 2025-10-25 030456.png', 'Screenshot 2025-10-25 030509.png', 'Screenshot 2025-10-25 030521.png'),
  'Rewaq': img('Rewaq', 'Screenshot 2025-10-29 003930.png', 'Screenshot 2025-10-29 003947.png', 'Screenshot 2025-10-29 004014.png', 'Screenshot 2025-10-29 004030.png', 'Screenshot 2025-10-29 004046.png', 'Screenshot 2025-10-29 004104.png'),
  'Cavali': img('Cavali', 'Screenshot 2025-12-11 184701.png', 'Screenshot 2025-12-11 184727.png', 'Screenshot 2025-12-11 184738.png', 'Screenshot 2025-12-11 184754.png', 'Screenshot 2025-12-11 184819.png', 'Screenshot 2025-12-11 184835.png'),
  'New Garden City': img('New Garden City', 'WhatsApp Image 2025-11-17 at 13.23.45_d03fa1be.jpg', 'WhatsApp Image 2025-11-17 at 13.23.46_572fdbfe.jpg', 'WhatsApp Image 2025-11-17 at 13.23.46_7c3a529c.jpg', 'WhatsApp Image 2025-11-17 at 13.23.46_adbd0b38.jpg', 'WhatsApp Image 2025-11-17 at 13.23.47_854677cc.jpg', 'WhatsApp Image 2025-11-17 at 13.23.47_9610b147.jpg'),
  'Il bosco': img('il Bosco', '01246fe0-004c-41b4-bdf0-731524ec4f89.jpg', '0e8a8bdb-30ff-4d1c-9067-72899757b99c.jpg', '19425970-913a-4b6c-bf61-43a4bfd610c3.jpg', '1f0a5e58-c428-4c25-9358-a9583f74d720.jpg', '250a890c-d9df-4373-b4f7-132bcb89d8f7.jpg', '67d9a13c-6c6a-4a6f-a824-7dcb590588a2.jpg'),
  'Hava': img('Hava', '597854460_1533514717957617_6767207248418649636_n.jpg', '597855241_1533514754624280_5968355236603147940_n.jpg', '597857318_1533514667957622_7998081615149674981_n.jpg', '597859888_10239415473262818_9087824395281657241_n.jpg', '597957049_10239415460622502_8644282244792221882_n.jpg', '598769506_1533514681290954_8859701705737099427_n.jpg'),
  'Dejoya': img('Dejoya', '0726da06-4677-4b07-8651-4587caeaf91c.jpg', '580df7d0-04a4-4f15-a025-2e592f437259.jpg', 'e0994327-db87-44b5-9511-1e4cced124b5.jpg', 'IMG-20250524-WA0190.jpg', 'Type F-24.jpg', 'TYPE G-images-22.jpg'),
  'MV Icity': img('Mv icity', 'WhatsApp Image 2025-01-16 at 16.40.58_a0c714dd.jpg', 'WhatsApp Image 2025-01-16 at 16.41.00_1a1739b5.jpg', 'WhatsApp Image 2025-01-16 at 16.41.00_69914b0b.jpg', 'WhatsApp Image 2025-01-16 at 16.41.01_0c4f9d47.jpg', 'WhatsApp Image 2025-01-16 at 16.41.01_c6e67a27.jpg', 'WhatsApp Image 2025-01-16 at 16.41.02_af18cd7f.jpg'),
  'Talala': img('Talala', '577069845_122175284330442039_7279557411495880802_n.jpg', 'Screenshot 2025-11-06 193039.png', 'Screenshot 2025-11-06 193100.png', 'Screenshot 2025-11-06 193109.png', 'Screenshot 2025-11-06 193130.png', 'Screenshot 2025-11-06 193148.png'),
  'Lagoons': img('Lagoons', 'Screenshot 2026-03-12 135837.png', 'Screenshot 2026-03-12 135855.png', 'Screenshot 2026-03-12 135916.png', 'Screenshot 2026-03-12 135937.png', 'Screenshot 2026-03-12 140036.png', 'Screenshot 2026-03-12 140049.png'),
  'The Island': img('The island', 'Screenshot 2024-10-28 164434_1400x900.jpg', 'WhatsApp Image 2024-12-04 at 19.38.56_6208ad5e.jpg', 'WhatsApp Image 2024-12-04 at 19.40.11_465836e9.jpg', 'WhatsApp Image 2024-12-04 at 19.40.11_aeb92536.jpg', 'WhatsApp Image 2024-12-04 at 19.40.12_c8263685.jpg', 'WhatsApp Image 2024-12-04 at 19.40.13_081c1eb1.jpg'),
  'Winter Park': img('Winter Park', '1.jpeg', 'WhatsApp Image 2025-11-29 at 11.54.38 PM.jpeg', 'WhatsApp Image 2025-11-29 at 11.54.39 PM.jpeg', 'WhatsApp Image 2025-11-30 at 2.44.22 PM.jpeg', 'WhatsApp Image 2025-11-30 at 4.20.56 PM.jpeg'),
  'Sarai': img('Sarai', '574909552_1355495342826066_5745878850698112805_n.jpg', '575120582_122270921072223588_4433443828868328731_n.jpg', '576732204_799813496392238_5706916149471033236_n.jpg', '577130342_2473137419747998_5122178708714516543_n.jpg', 'WhatsApp Image 2025-01-28 at 14.07.48_e9fd8cb1.jpg', 'WhatsApp Image 2025-01-28 at 14.08.08_24b35f67.jpg'),
  'Canyon 8': img('Canyon 8', 'Screenshot 2025-11-22 173535.png', 'Screenshot 2025-11-22 173546.png', 'Screenshot 2025-11-22 173601.png', 'Screenshot 2025-11-22 173615.png', 'Screenshot 2025-11-22 173630.png', 'Screenshot 2025-11-22 173641.png'),
  'La Reva': img('La Reva', 'Screenshot 2026-03-12 144129.png', 'Screenshot 2026-03-12 144146.png', 'Screenshot 2026-03-12 144201.png', 'Screenshot 2026-03-12 144217.png', 'Screenshot 2026-03-12 144237.png', 'Screenshot 2026-03-12 144301.png'),
  'Midtown Condo': img('Midtown Condo', 'WhatsApp Image 2023-08-14 at 8.45.13 PM (1).jpeg', 'WhatsApp Image 2023-08-14 at 8.45.13 PM.jpeg', 'WhatsApp Image 2023-08-14 at 8.45.14 PM (1).jpeg', 'WhatsApp Image 2023-08-14 at 8.45.14 PM (2).jpeg', 'WhatsApp Image 2023-08-14 at 8.45.14 PM.jpeg', 'WhatsApp Image 2023-08-14 at 8.45.15 PM (1).jpeg'),
  'The Icon': img('The Icon', 'WhatsApp Image 2024-04-01 at 1.43.41 PM (1).jpeg', 'WhatsApp Image 2024-04-01 at 1.43.42 PM (2).jpeg', 'WhatsApp Image 2024-04-01 at 1.43.42 PM.jpeg', 'WhatsApp Image 2024-04-01 at 1.43.43 PM.jpeg', 'WhatsApp Image 2024-04-01 at 1.43.44 PM (1).jpeg', 'WhatsApp Image 2024-04-01 at 1.43.44 PM (2).jpeg'),
  'Noll': img('Noll', '218fbdf9-8ee8-4453-a81b-682ccd969298.jpg', 'aff00aa2-4411-4dbe-93a8-f5d092c27686.jpg', 'WhatsApp Image 2025-03-06 at 11.31.55_d840180e.jpg', 'WhatsApp Image 2025-03-10 at 21.02.30_c9aa8e45.jpg', 'WhatsApp Image 2025-03-13 at 21.39.10_3a4703f3.jpg', 'WhatsApp Image 2025-03-13 at 21.39.10_ad756f2c.jpg'),
  'Defaf': img('Defaf', 'Screenshot 2025-12-20 191935.png', 'Screenshot 2025-12-20 191945.png', 'Screenshot 2025-12-20 191956.png', 'Screenshot 2025-12-20 192008.png', 'Screenshot 2025-12-20 192027.png', 'Screenshot 2025-12-20 192038.png'),
  'Yardin': img('Yardin', '591866016_2990009844722161_961484743512776438_n.jpg', 'Screenshot 2025-12-05 011136.png', 'Screenshot 2025-12-05 011152.png', 'Screenshot 2025-12-05 011218.png', 'Screenshot 2025-12-05 011232.png', 'Screenshot 2025-12-05 011301.png'),
};

const imgs = (project) => PROJECT_IMAGES[project] || [];

const fin = (v) => {
  const t = (v || '').toUpperCase();
  if (t.includes('FF') || t.includes('F.F')) return 'Fully Finished';
  if (t.includes('SF')) return 'Semi Finished';
  if (t.includes('AC')) return 'Fully Finished + AC';
  if (t.includes('CORE') || t.includes('SHELL')) return 'Core and Shell';
  return v || '';
};

const del = (v) => {
  const t = (v || '').toUpperCase();
  if (t === 'RTM') return 'Ready to Move';
  return v || '';
};

export const newCapitalListings = [
  { id: 1, unitCode: '1', title_ar: 'مقدم 450الف امتلك شقة بالتقسيط ع 10سنين ف هايد بارك', title_en: '2BR Apt — HPC Hyde Park, 10yr installments', developer: 'Hyde Park', project: 'HPC', location: '6th Settlement', unitType: 'Apartment', area: 115, rooms: 2, toilets: 2, downpayment: '450,000', monthlyInst: '72,000', price: '9,100,000', finishing: fin('SF'), delivery: del('4 Years'), featured: true, area_slug: 'new-cairo', images: imgs('HPC') },
  { id: 2, unitCode: '2', title_ar: 'مقدم مليون100 بالنتقسيط ع 10 سنين فيلا فيو مفتوح ع جاردن', title_en: '4BR Villa — HPC Hyde Park, garden view', developer: 'Hyde Park', project: 'HPC', location: '6th Settlement', unitType: 'Villa', area: 220, rooms: 4, toilets: 4, downpayment: '1,100,000', monthlyInst: '174,000', price: '22,000,000', finishing: fin('SF'), delivery: del('4 Years'), featured: true, area_slug: 'new-cairo', images: imgs('HPC') },
  { id: 3, unitCode: '3', title_ar: 'امتلك شقة متشطبة بالتقسيط علي 10 سنين 3 غرف بمقدم 570الف', title_en: '3BR FF Apt — Patio Vida, 10yr installments', developer: 'La Vista', project: 'Patio Vida', location: 'New Cairo', unitType: 'Apartment', area: 160, rooms: 3, toilets: 3, downpayment: '570,000', monthlyInst: '90,000', price: '11,550,000', finishing: fin('FF'), delivery: del('3 Years'), featured: true, area_slug: 'new-cairo', images: imgs('Patio Vida') },
  { id: 4, unitCode: '4', title_ar: 'استلم فوري شقة متشطبة 3 غرف علي طريق السويس دايركت وجوار الرحاب بقسط 10 سنين', title_en: '3BR FF Apt — Mayan, Suez Road, ready to move', developer: 'STM', project: 'Mayan', location: 'Suez Road', unitType: 'Apartment', area: 130, rooms: 3, toilets: 3, downpayment: '1,080,000', monthlyInst: '80,000', price: '10,800,000', finishing: fin('FF'), delivery: del('RTM'), featured: false, area_slug: 'new-cairo', images: imgs('Mayan') },
  { id: 5, unitCode: '5', title_ar: 'بمقدم 600الف وقسط شهرى 45الف شقة 3 غرف بجوار الرحاب', title_en: '3BR Apt — Lifewise, near Rehab', developer: 'Eons', project: 'Lifewise', location: 'Near Rehab', unitType: 'Apartment', area: 160, rooms: 3, toilets: 3, downpayment: '300,000', monthlyInst: '45,000', price: '6,000,000', finishing: fin('SF'), delivery: del('4 Years'), featured: false, area_slug: 'new-cairo', images: imgs('Lifewise') },
  { id: 6, unitCode: '6', title_ar: 'ادفع مقدم300الف وقسط 12سنة شقة متشطبة بالتكيفات بجوار ماونتن فيو', title_en: '3BR FF Apt — Telal East, near Mountain View', developer: 'Roya-PRE', project: 'Telal East', location: 'Near Mountain View', unitType: 'Apartment', area: 130, rooms: 3, toilets: 3, downpayment: '300,000', monthlyInst: '70,000', price: '9,900,000', finishing: "Fully Finished + AC's", delivery: del('3 Years'), featured: false, area_slug: 'new-cairo', images: imgs('Telal East') },
  { id: 7, unitCode: '7', title_ar: 'فيلا بمقدم 735الف بقسط 12سنة متشطبة بالتكيفات بجوار ماونتن فيو', title_en: '4BR Townhouse — Telal East, near Mountain View', developer: 'Roya-PRE', project: 'Telal East', location: 'Near Mountain View', unitType: 'Townhouse', area: 220, rooms: 4, toilets: 4, downpayment: '1,225,000', monthlyInst: '150,000', price: '24,500,000', finishing: "Fully Finished + AC's", delivery: del('3 Years'), featured: false, area_slug: 'new-cairo', images: imgs('Telal East') },
  { id: 8, unitCode: '8', title_ar: 'بدون مقدم وتقسيط على 10سنين شقة 3 غرف فى قلب التجمع السادس', title_en: '3BR Apt — Tierra, 6th Settlement, 10yr installments', developer: 'SED', project: 'Tierra', location: '6th Settlement', unitType: 'Apartment', area: 150, rooms: 3, toilets: 3, downpayment: '220,000', monthlyInst: '75,000', price: '8,800,000', finishing: fin('SF'), delivery: del('4 Years'), featured: false, area_slug: 'new-cairo', images: imgs('Tierra') },
  { id: 9, unitCode: '9', title_ar: 'خصم10% وقسط شهري 50الف امتلك شقة 160م بقسط يصل 10 سنين', title_en: '3BR Apt — Rewaq, 10% discount', developer: 'Arabian Mark', project: 'Rewaq', location: 'New Cairo', unitType: 'Apartment', area: 160, rooms: 3, toilets: 3, downpayment: '400,000', monthlyInst: '50,000', price: '6,700,000', finishing: fin('SF'), delivery: del('4 Years'), featured: false, area_slug: 'new-cairo', images: imgs('Rewaq') },
  { id: 10, unitCode: '10', title_ar: 'بخصم 10% ومقدم 345الف امتلك شقة بجوار النادي الاهلى بقسط 10سنوات', title_en: '3BR Apt — Cavali, near Al Ahly Club', developer: 'Al Basiony', project: 'Cavali', location: '6th Settlement', unitType: 'Apartment', area: 140, rooms: 3, toilets: 3, downpayment: '345,000', monthlyInst: '55,000', price: '6,880,000', finishing: fin('SF'), delivery: del('4 Years'), featured: false, area_slug: 'new-cairo', images: imgs('Cavali') },
  { id: 11, unitCode: '11', title_ar: 'استلم فورى شقة متشطبة بالتكيفات بقسط يصل الي 15سنة', title_en: '2BR FF Apt — New Garden City, ready to move', developer: 'City Edge', project: 'New Garden City', location: '6th Settlement', unitType: 'Apartment', area: 140, rooms: 2, toilets: 2, downpayment: '320,000', monthlyInst: '80,000', price: '6,350,000', finishing: "Fully Finished + AC's", delivery: del('RTM'), featured: false, area_slug: 'new-cairo', images: imgs('New Garden City') },
  { id: 12, unitCode: '12', title_ar: 'استلم فوري بقسط 10 سنين و مقدم 245الف شقة 3 غرف فيو مميز', title_en: '3BR Apt — Il Bosco, New Capital, ready to move', developer: 'Misr Italia', project: 'Il bosco', location: 'New Capital', unitType: 'Apartment', area: 145, rooms: 3, toilets: 3, downpayment: '245,000', monthlyInst: '80,000', price: '9,800,000', finishing: fin('SF'), delivery: del('RTM'), featured: false, area_slug: 'new-capital', images: imgs('Il bosco') },
  { id: 13, unitCode: '13', title_ar: 'بخصم 10% وقسط 35الف ف شهر امتلك شقة 3 غرف بقسط يصل 12سنة', title_en: '3BR Apt — Hava, 10% discount', developer: 'QURTUBA', project: 'Hava', location: 'New Cairo', unitType: 'Apartment', area: 150, rooms: 3, toilets: 3, downpayment: '450,000', monthlyInst: '35,000', price: '4,500,000', finishing: fin('SF'), delivery: del('3 Years'), featured: false, area_slug: 'new-cairo', images: imgs('Hava') },
  { id: 14, unitCode: '14', title_ar: 'قسط على 15 سنة بدون دفعات بمقدم 345الف شقة 3 غرف نوم', title_en: '3BR Apt — Dejoya, 15yr installments', developer: 'Taj Misr', project: 'Dejoya', location: 'New Cairo', unitType: 'Apartment', area: 146, rooms: 3, toilets: 3, downpayment: '350,000', monthlyInst: '36,000', price: '6,900,000', finishing: fin('sf'), delivery: del('3 years'), featured: false, area_slug: 'new-cairo', images: imgs('Dejoya') },
  { id: 15, unitCode: '15', title_ar: 'فرصة بماونتن فيو اى سيتى بمقدم 100الف وقسط 10 سنين', title_en: '3BR Apt — MV iCity, Mountain View', developer: 'Mountain View', project: 'MV Icity', location: 'Mountain View', unitType: 'Apartment', area: 150, rooms: 3, toilets: 3, downpayment: '100,000', monthlyInst: '', price: '11,000,000', finishing: fin('sf'), delivery: del('3 years'), featured: false, area_slug: 'new-cairo', images: imgs('MV Icity') },
  { id: 16, unitCode: '16', title_ar: 'بمقدم560الف وقسط 70الف شقة 3غرف متشطبة بقسط12 سنة', title_en: '3BR FF Apt — Talala, New Capital', developer: 'MNHD', project: 'Talala', location: 'New Capital', unitType: 'Apartment', area: 150, rooms: 3, toilets: 3, downpayment: '560,000', monthlyInst: '70,000', price: '11,270,000', finishing: fin('F.F'), delivery: del('3 Years'), featured: false, area_slug: 'new-capital', images: imgs('Talala') },
  { id: 17, unitCode: '17', title_ar: 'ادفع 485الف وامتلك شقه 150متر علي لاجون بقسط 10 سنين', title_en: '3BR Apt — Lagoons, New Capital', developer: 'Modon', project: 'Lagoons', location: 'New Capital', unitType: 'Apartment', area: 150, rooms: 3, toilets: 3, downpayment: '485,000', monthlyInst: '36,400', price: '4,850,000', finishing: fin('SF'), delivery: del('3 Years'), featured: false, area_slug: 'new-capital', images: imgs('Lagoons') },
  { id: 18, unitCode: '18', title_ar: 'مقدم325الف وقسط 12سنة شقة 150م علي لاجون', title_en: '3BR Apt — The Island, New Capital', developer: 'Egy Gab', project: 'The Island', location: 'New Capital', unitType: 'Apartment', area: 150, rooms: 3, toilets: 3, downpayment: '325,000', monthlyInst: '43,000', price: '6,500,000', finishing: fin('SF'), delivery: del('3 Years'), featured: false, area_slug: 'new-capital', images: imgs('The Island') },
  { id: 19, unitCode: '19', title_ar: 'امتلك شقة بقسط شهرى 30الف وقسط 10 سنين ف قلب العاصمه', title_en: '2BR Apt — Winter Park, New Capital', developer: 'Dominar', project: 'Winter Park', location: 'New Capital', unitType: 'Apartment', area: 115, rooms: 2, toilets: 2, downpayment: '400,000', monthlyInst: '30,000', price: '3,990,000', finishing: fin('SF'), delivery: del('4 Years'), featured: false, area_slug: 'new-capital', images: imgs('Winter Park') },
  { id: 20, unitCode: '20', title_ar: 'فرصة فيلا باقل سعر بمقدم 850الف وقسط 12 سنة', title_en: '3BR Villa — Sarai, New Capital', developer: 'MNHD', project: 'Sarai', location: 'New Capital', unitType: 'Villa', area: 206, rooms: 3, toilets: 4, downpayment: '850,000', monthlyInst: '110,000', price: '17,000,000', finishing: fin('SF'), delivery: del('4 Years'), featured: false, area_slug: 'new-capital', images: imgs('Sarai') },
  { id: 21, unitCode: '21', title_ar: 'فرصة امتلك شقة 3 غرف بقسط 12 سنة و قسط شهري 40الف ف اميز لوكشن', title_en: '3BR Apt — Canyon 8, New Capital', developer: 'Home Town', project: 'Canyon 8', location: 'New Capital', unitType: 'Apartment', area: 150, rooms: 3, toilets: 3, downpayment: '177,000', monthlyInst: '40,000', price: '5,900,000', finishing: fin('SF'), delivery: del('3 Years'), featured: false, area_slug: 'new-capital', images: imgs('Canyon 8') },
  { id: 22, unitCode: '22', title_ar: 'ادفع 480الف وامتلك شقة 160م بقسط شهرى 36الف ع 10سنين', title_en: '3BR Apt — La Reva, New Capital', developer: 'MAG', project: 'La Reva', location: 'New Capital', unitType: 'Apartment', area: 160, rooms: 3, toilets: 3, downpayment: '480,000', monthlyInst: '36,000', price: '4,800,000', finishing: fin('SF'), delivery: del('4 Years'), featured: false, area_slug: 'new-capital', images: imgs('La Reva') },
  { id: 23, unitCode: '23', title_ar: 'استلم فورى شقة 210م بالتقسيط ع 8 سنين ف قلب الR7', title_en: '3BR Apt — Midtown Condo, R7, ready to move', developer: 'Better Home', project: 'Midtown Condo', location: 'R7', unitType: 'Apartment', area: 210, rooms: 3, toilets: 3, downpayment: '860,000', monthlyInst: '80,500', price: '8,590,000', finishing: fin('SF'), delivery: del('RTM'), featured: false, area_slug: 'new-capital', images: imgs('Midtown Condo') },
  { id: 24, unitCode: '24', title_ar: 'فرصة بخصم 15% امتلك شقة امام هايد بارك بقسط يصل 10 سنين', title_en: '3BR Apt — The Icon, front of Hyde Park', developer: 'Style Home', project: 'The Icon', location: '6th Settlement', unitType: 'Apartment', area: 160, rooms: 3, toilets: 3, downpayment: '1,050,000', monthlyInst: '', price: '5,000,000', finishing: fin('SF'), delivery: del('3 Years'), featured: false, area_slug: 'new-cairo', images: imgs('The Icon') },
  { id: 25, unitCode: '25', title_ar: 'خصم25% وقسط يصل 12سنة شقة متشطبة بجوار زيد ايست', title_en: '3BR FF Apt — Noll, near Zayed East', developer: 'Kleek', project: 'Noll', location: '6th Settlement', unitType: 'Apartment', area: 120, rooms: 3, toilets: 3, downpayment: '555,000', monthlyInst: '70,000', price: '5,500,000', finishing: fin('FF'), delivery: del('3 Years'), featured: false, area_slug: 'new-cairo', images: imgs('Noll') },
  { id: 26, unitCode: '26', title_ar: 'فرصة بخصم 15%وقسط شهرى 17الف شقة 3 غرف علي 15سنة', title_en: '3BR Apt — Defaf, 15% discount', developer: 'DIG', project: 'Defaf', location: 'New Capital', unitType: 'Apartment', area: 150, rooms: 3, toilets: 3, downpayment: '660,000', monthlyInst: '17,165', price: '4,400,000', finishing: fin('SF'), delivery: del('4 Years'), featured: false, area_slug: 'new-capital', images: imgs('Defaf') },
  { id: 27, unitCode: '27', title_ar: 'اقل مقدم 155الف شقة 3 غرف امام هايد بارك بقسط 10 سنوات', title_en: '3BR Apt — Yardin, front of Hyde Park', developer: 'Mass', project: 'Yardin', location: '6th Settlement', unitType: 'Apartment', area: 140, rooms: 3, toilets: 3, downpayment: '155,000', monthlyInst: '', price: '6,000,000', finishing: fin('SF'), delivery: del('3 Years'), featured: false, area_slug: 'new-cairo', images: imgs('Yardin') },
];

export const getFeaturedListings = () =>
  newCapitalListings.filter((l) => l.featured).slice(0, 3);

export const getUniqueValues = (key) =>
  [...new Set(newCapitalListings.map((l) => l[key]))].sort();

export const EGYPT_REGIONS = [
  { slug: 'cairo', label: 'Cairo', hasAreas: true },
  { slug: 'north-coast', label: 'North Coast', hasAreas: false },
  { slug: 'sokhna', label: 'Sokhna', hasAreas: false },
  { slug: 'galala', label: 'Galala', hasAreas: false },
  { slug: 'hurghada', label: 'Hurghada', hasAreas: false },
];

export const CAIRO_AREAS = [
  { slug: 'new-capital', label: 'New Capital' },
  { slug: 'new-cairo', label: 'New Cairo' },
  { slug: 'mostakbal-city', label: 'Mostakbal City' },
];

export function getAreaFromListing(listing) {
  if (listing.area_slug) return listing.area_slug;
  const title = listing.title || listing.title_en || listing.title_ar || '';
  const t = title.toLowerCase();
  if (t.includes('new cairo')) return 'new-cairo';
  if (t.includes('mostakbal')) return 'mostakbal-city';
  return 'new-capital';
}

export const getListingsByRegion = (areaSlug) => {
  if (!areaSlug) return [];
  return newCapitalListings.filter((l) => getAreaFromListing(l) === areaSlug);
};

export const getFeaturedByRegion = (areaSlug, limit = 3) =>
  getListingsByRegion(areaSlug).filter((l) => l.featured).slice(0, limit);

export function getListingsCountByEgyptRegion(regionSlug) {
  if (regionSlug === 'cairo') {
    return getListingsByRegion('new-capital').length + getListingsByRegion('new-cairo').length + getListingsByRegion('mostakbal-city').length;
  }
  return 0;
}

export const LOCATION_HIERARCHY = {
  country: 'Egypt',
  regions: EGYPT_REGIONS,
  cairoAreas: CAIRO_AREAS,
};

export function slugifyProject(name) {
  if (!name) return '';
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export function getCompoundsByRegion(regionSlug) {
  const listings = getListingsByRegion(regionSlug);
  const byProject = {};
  listings.forEach((l) => {
    const key = l.project || '';
    if (!key) return;
    if (!byProject[key]) byProject[key] = { project: key, slug: slugifyProject(key), count: 0 };
    byProject[key].count += 1;
  });
  return Object.values(byProject).sort((a, b) => a.project.localeCompare(b.project));
}

export function getListingsByCompound(regionSlug, compoundSlug) {
  const listings = getListingsByRegion(regionSlug);
  return listings.filter((l) => slugifyProject(l.project) === compoundSlug);
}

export function getProjectBySlug(regionSlug, compoundSlug) {
  const compounds = getCompoundsByRegion(regionSlug);
  const found = compounds.find((c) => c.slug === compoundSlug);
  return found ? found.project : null;
}
