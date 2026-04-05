import { PrismaClient, UserRole, ListingStatus, MedicineCondition, OrderStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function daysAgo(n: number) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

function daysFromNow(n: number) {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000);
}

async function main() {
  console.log("🌱 Seeding database...");

  // ── Categories ──────────────────────────────────────────────────────────────
  const [catOncology, catCardiology, catNeurology, catImmunology, catAntibiotics, catAnesthesiology,
         catGastroenterology, catHematology, catDermatology, catGynecology, catEndocrinology,
         catRheumatology, catRespiratory, catOphthalmology, catUrology] =
    await Promise.all([
      // existing
      prisma.category.upsert({ where: { slug: "oncology" },         update: {}, create: { name: "Oncology",         slug: "oncology",         icon: "🔬" } }),
      prisma.category.upsert({ where: { slug: "cardiology" },       update: {}, create: { name: "Cardiology",       slug: "cardiology",       icon: "❤️" } }),
      prisma.category.upsert({ where: { slug: "neurology" },        update: {}, create: { name: "Neurology",        slug: "neurology",        icon: "🧠" } }),
      prisma.category.upsert({ where: { slug: "immunology" },       update: {}, create: { name: "Immunology",       slug: "immunology",       icon: "🛡️" } }),
      prisma.category.upsert({ where: { slug: "antibiotics" },      update: {}, create: { name: "Antibiotics",      slug: "antibiotics",      icon: "💊" } }),
      prisma.category.upsert({ where: { slug: "anesthesiology" },   update: {}, create: { name: "Anesthesiology",   slug: "anesthesiology",   icon: "😴" } }),
      // new — full ATC first-level coverage
      prisma.category.upsert({ where: { slug: "gastroenterology" }, update: {}, create: { name: "Gastroenterology", slug: "gastroenterology", icon: "🫁" } }), // A
      prisma.category.upsert({ where: { slug: "hematology" },       update: {}, create: { name: "Hematology",       slug: "hematology",       icon: "🩸" } }), // B
      prisma.category.upsert({ where: { slug: "dermatology" },      update: {}, create: { name: "Dermatology",      slug: "dermatology",      icon: "🩹" } }), // D
      prisma.category.upsert({ where: { slug: "gynecology" },       update: {}, create: { name: "Gynecology",       slug: "gynecology",       icon: "🌸" } }), // G
      prisma.category.upsert({ where: { slug: "endocrinology" },    update: {}, create: { name: "Endocrinology",    slug: "endocrinology",    icon: "⚗️" } }), // H
      prisma.category.upsert({ where: { slug: "rheumatology" },     update: {}, create: { name: "Rheumatology",     slug: "rheumatology",     icon: "🦴" } }), // M
      prisma.category.upsert({ where: { slug: "respiratory" },      update: {}, create: { name: "Respiratory",      slug: "respiratory",      icon: "🫀" } }), // R
      prisma.category.upsert({ where: { slug: "ophthalmology" },    update: {}, create: { name: "Ophthalmology",    slug: "ophthalmology",    icon: "👁️" } }), // S
      prisma.category.upsert({ where: { slug: "urology" },          update: {}, create: { name: "Urology",          slug: "urology",          icon: "💧" } }), // G (urinary)
    ]);

  // ── Hospitals ────────────────────────────────────────────────────────────────
  const [hMilan, hRome, hGenoa, hPadova, hFlorence] = await Promise.all([
    prisma.hospital.upsert({
      where: { slug: "niguarda-milan" },
      update: { latitude: 45.5074, longitude: 9.1996 },
      create: { name: "Ospedale Niguarda", slug: "niguarda-milan", address: "Piazza Ospedale Maggiore 3", city: "Milan", country: "Italy", email: "info@niguarda.demo", verified: true, latitude: 45.5074, longitude: 9.1996 },
    }),
    prisma.hospital.upsert({
      where: { slug: "gemelli-rome" },
      update: { latitude: 41.9319, longitude: 12.4337 },
      create: { name: "Policlinico Gemelli", slug: "gemelli-rome", address: "Largo Agostino Gemelli 8", city: "Rome", country: "Italy", email: "info@gemelli.demo", verified: true, latitude: 41.9319, longitude: 12.4337 },
    }),
    prisma.hospital.upsert({
      where: { slug: "san-martino-genoa" },
      update: { latitude: 44.4056, longitude: 8.9463 },
      create: { name: "Ospedale San Martino", slug: "san-martino-genoa", address: "Largo Rosanna Benzi 10", city: "Genoa", country: "Italy", email: "info@sanmartino.demo", verified: true, latitude: 44.4056, longitude: 8.9463 },
    }),
    prisma.hospital.upsert({
      where: { slug: "aopd-padova" },
      update: { latitude: 45.4064, longitude: 11.8768 },
      create: { name: "Az. Ospedaliera di Padova", slug: "aopd-padova", address: "Via Giustiniani 2", city: "Padova", country: "Italy", email: "info@aopd.demo", verified: true, latitude: 45.4064, longitude: 11.8768 },
    }),
    prisma.hospital.upsert({
      where: { slug: "meyer-florence" },
      update: { latitude: 43.8009, longitude: 11.2008 },
      create: { name: "Ospedale Meyer", slug: "meyer-florence", address: "Viale Gaetano Pieraccini 24", city: "Florence", country: "Italy", email: "info@meyer.demo", verified: true, latitude: 43.8009, longitude: 11.2008 },
    }),
  ]);

  // ── Users ────────────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("password123", 12);

  const [uMilan, uRome, uGenoa, uPadova, uFlorence] = await Promise.all([
    prisma.user.upsert({ where: { email: "admin@niguarda.demo"   }, update: {}, create: { email: "admin@niguarda.demo",   name: "Marco Rossi",     passwordHash, role: UserRole.HOSPITAL_ADMIN, hospitalId: hMilan.id    } }),
    prisma.user.upsert({ where: { email: "admin@gemelli.demo"    }, update: {}, create: { email: "admin@gemelli.demo",    name: "Laura Bianchi",   passwordHash, role: UserRole.HOSPITAL_ADMIN, hospitalId: hRome.id     } }),
    prisma.user.upsert({ where: { email: "admin@sanmartino.demo" }, update: {}, create: { email: "admin@sanmartino.demo", name: "Giovanni Ferrari", passwordHash, role: UserRole.HOSPITAL_ADMIN, hospitalId: hGenoa.id    } }),
    prisma.user.upsert({ where: { email: "admin@aopd.demo"       }, update: {}, create: { email: "admin@aopd.demo",       name: "Chiara Conti",    passwordHash, role: UserRole.HOSPITAL_ADMIN, hospitalId: hPadova.id   } }),
    prisma.user.upsert({ where: { email: "admin@meyer.demo"      }, update: {}, create: { email: "admin@meyer.demo",      name: "Davide Marino",   passwordHash, role: UserRole.HOSPITAL_ADMIN, hospitalId: hFlorence.id } }),
  ]);

  // ── Listings — delete existing, then recreate with full field set ────────────
  // Orders must be deleted first (no cascade from Order → Listing in schema)
  await prisma.order.deleteMany({});
  await prisma.listing.deleteMany({});

  const listings = await Promise.all([
    // ── Milan — Niguarda ──────────────────────────────────────────────────────
    prisma.listing.create({ data: {
      id: "lst-milan-1",
      title: "Trastuzumab 440mg — 20 fiale",
      medicineName: "Trastuzumab", genericName: "Trastuzumab",
      aicCode: "033395012", atcCode: "L01FD01",
      manufacturer: "Roche", batchNumber: "BT-2026-001",
      expiryDate: daysFromNow(45),
      quantity: 20, remainingQuantity: 20, unit: "fiale",
      pricePerUnit: 850, totalValue: 20 * 850, currency: "EUR",
      storageCondition: "2–8°C",
      condition: MedicineCondition.SEALED, status: ListingStatus.ACTIVE,
      sellerId: uMilan.id, hospitalId: hMilan.id, categoryId: catOncology.id,
    }}),
    prisma.listing.create({ data: {
      id: "lst-milan-2",
      title: "Omeprazolo 40mg — 60 fiale",
      medicineName: "Omeprazolo", genericName: "Omeprazolo sodico",
      aicCode: "023904016", atcCode: "A02BC01",
      manufacturer: "AstraZeneca", batchNumber: "AZ-2026-088",
      expiryDate: daysFromNow(180),
      quantity: 60, remainingQuantity: 60, unit: "fiale",
      pricePerUnit: 8.50, totalValue: 60 * 8.50, currency: "EUR",
      storageCondition: "<25°C",
      condition: MedicineCondition.SEALED, status: ListingStatus.ACTIVE,
      sellerId: uMilan.id, hospitalId: hMilan.id, categoryId: catGastroenterology.id,
    }}),

    // ── Rome — Gemelli ────────────────────────────────────────────────────────
    prisma.listing.create({ data: {
      id: "lst-rome-1",
      title: "Rituximab 500mg — 15 fiale in scadenza",
      medicineName: "Rituximab", genericName: "Rituximab",
      aicCode: "034875046", atcCode: "L01FA01",
      manufacturer: "Roche", batchNumber: "RT-2026-055",
      expiryDate: daysFromNow(28),
      quantity: 15, remainingQuantity: 15, unit: "fiale",
      pricePerUnit: 920, totalValue: 15 * 920, currency: "EUR",
      storageCondition: "2–8°C",
      condition: MedicineCondition.SEALED, status: ListingStatus.ACTIVE,
      sellerId: uRome.id, hospitalId: hRome.id, categoryId: catOncology.id,
    }}),
    prisma.listing.create({ data: {
      id: "lst-rome-2",
      title: "Enoxaparina 4000 UI — 50 siringhe",
      medicineName: "Enoxaparina", genericName: "Enoxaparina sodica",
      aicCode: "026732078", atcCode: "B01AB05",
      manufacturer: "Sanofi", batchNumber: "SA-2026-309",
      expiryDate: daysFromNow(120),
      quantity: 50, remainingQuantity: 50, unit: "siringhe preriempite",
      pricePerUnit: 6.80, totalValue: 50 * 6.80, currency: "EUR",
      storageCondition: "<25°C",
      condition: MedicineCondition.SEALED, status: ListingStatus.ACTIVE,
      sellerId: uRome.id, hospitalId: hRome.id, categoryId: catHematology.id,
    }}),

    // ── Genoa — San Martino ───────────────────────────────────────────────────
    prisma.listing.create({ data: {
      id: "lst-genoa-1",
      title: "Vancomicina 500mg — 40 flaconi",
      medicineName: "Vancomicina", genericName: "Vancomicina cloridrato",
      aicCode: "024189016", atcCode: "J01XA01",
      manufacturer: "Hikma", batchNumber: "HK-2026-771",
      expiryDate: daysFromNow(60),
      quantity: 40, remainingQuantity: 40, unit: "flaconi",
      pricePerUnit: 22, totalValue: 40 * 22, currency: "EUR",
      storageCondition: "<25°C",
      condition: MedicineCondition.SEALED, status: ListingStatus.ACTIVE,
      sellerId: uGenoa.id, hospitalId: hGenoa.id, categoryId: catAntibiotics.id,
    }}),
    prisma.listing.create({ data: {
      id: "lst-genoa-2",
      title: "Salbutamolo 2.5mg — 100 fiale per nebulizzazione",
      medicineName: "Salbutamolo", genericName: "Salbutamolo solfato",
      aicCode: "023702038", atcCode: "R03AC02",
      manufacturer: "GlaxoSmithKline", batchNumber: "GS-2026-440",
      expiryDate: daysFromNow(200),
      quantity: 100, remainingQuantity: 100, unit: "fiale",
      pricePerUnit: 2.40, totalValue: 100 * 2.40, currency: "EUR",
      storageCondition: "<25°C",
      condition: MedicineCondition.SEALED, status: ListingStatus.ACTIVE,
      sellerId: uGenoa.id, hospitalId: hGenoa.id, categoryId: catRespiratory.id,
    }}),

    // ── Padova — AO Padova ────────────────────────────────────────────────────
    prisma.listing.create({ data: {
      id: "lst-padova-1",
      title: "Ciclosporina 100mg — 25 capsule",
      medicineName: "Ciclosporina", genericName: "Ciclosporina",
      aicCode: "028431034", atcCode: "L04AD01",
      manufacturer: "Novartis", batchNumber: "NV-2026-213",
      expiryDate: daysFromNow(200),
      quantity: 25, remainingQuantity: 25, unit: "capsule",
      pricePerUnit: 145, totalValue: 25 * 145, currency: "EUR",
      storageCondition: "<25°C",
      condition: MedicineCondition.SEALED, status: ListingStatus.ACTIVE,
      sellerId: uPadova.id, hospitalId: hPadova.id, categoryId: catImmunology.id,
    }}),
    prisma.listing.create({ data: {
      id: "lst-padova-2",
      title: "Levetiracetam 500mg — 100 compresse",
      medicineName: "Levetiracetam", genericName: "Levetiracetam",
      aicCode: "033665034", atcCode: "N03AX14",
      manufacturer: "UCB Pharma", batchNumber: "UC-2026-882",
      expiryDate: daysFromNow(270),
      quantity: 100, remainingQuantity: 100, unit: "compresse",
      pricePerUnit: 4.20, totalValue: 100 * 4.20, currency: "EUR",
      storageCondition: "<25°C",
      condition: MedicineCondition.SEALED, status: ListingStatus.ACTIVE,
      sellerId: uPadova.id, hospitalId: hPadova.id, categoryId: catNeurology.id,
    }}),

    // ── Florence — Meyer ──────────────────────────────────────────────────────
    prisma.listing.create({ data: {
      id: "lst-florence-1",
      title: "Bevacizumab 400mg — 12 fiale in scadenza",
      medicineName: "Bevacizumab", genericName: "Bevacizumab",
      aicCode: "034875065", atcCode: "L01FG01",
      manufacturer: "Roche", batchNumber: "BV-2026-099",
      expiryDate: daysFromNow(35),
      quantity: 12, remainingQuantity: 12, unit: "fiale",
      pricePerUnit: 1100, totalValue: 12 * 1100, currency: "EUR",
      storageCondition: "2–8°C",
      condition: MedicineCondition.SEALED, status: ListingStatus.ACTIVE,
      sellerId: uFlorence.id, hospitalId: hFlorence.id, categoryId: catOncology.id,
    }}),
    prisma.listing.create({ data: {
      id: "lst-florence-2",
      title: "Piperacillina/Tazobactam 4.5g — 80 flaconi",
      medicineName: "Piperacillina/Tazobactam", genericName: "Piperacillina / Tazobactam",
      aicCode: "029916019", atcCode: "J01CR05",
      manufacturer: "Pfizer", batchNumber: "PF-2026-501",
      expiryDate: daysFromNow(90),
      quantity: 80, remainingQuantity: 80, unit: "flaconi",
      pricePerUnit: 18.50, totalValue: 80 * 18.50, currency: "EUR",
      storageCondition: "<25°C",
      condition: MedicineCondition.SEALED, status: ListingStatus.ACTIVE,
      sellerId: uFlorence.id, hospitalId: hFlorence.id, categoryId: catAntibiotics.id,
    }}),
  ]);

  const [lMilan1, lMilan2, lRome1, lRome2, lGenoa1, lGenoa2, lPadova1, lPadova2, lFlorence1, lFlorence2] = listings;

  // ── Orders ────────────────────────────────────────────────────────────────────
  // Spread over ~6 months. Buyer/seller are always different hospitals.

  type OrderSeed = {
    listingId: string; buyerId: string; buyerHospitalId: string; sellerHospitalId: string;
    quantity: number; unitPrice: number; status: OrderStatus; createdAt: Date;
  };

  const orderSeeds: OrderSeed[] = [
    // ── Milan buys ──
    { listingId: lRome1.id,    buyerId: uMilan.id, buyerHospitalId: hMilan.id, sellerHospitalId: hRome.id,    quantity: 3, unitPrice: 920,   status: "DELIVERED", createdAt: daysAgo(165) },
    { listingId: lRome2.id,    buyerId: uMilan.id, buyerHospitalId: hMilan.id, sellerHospitalId: hRome.id,    quantity: 10, unitPrice: 38,   status: "DELIVERED", createdAt: daysAgo(148) },
    { listingId: lGenoa1.id,   buyerId: uMilan.id, buyerHospitalId: hMilan.id, sellerHospitalId: hGenoa.id,   quantity: 8, unitPrice: 22,   status: "DELIVERED", createdAt: daysAgo(130) },
    { listingId: lPadova1.id,  buyerId: uMilan.id, buyerHospitalId: hMilan.id, sellerHospitalId: hPadova.id,  quantity: 5, unitPrice: 145,  status: "DELIVERED", createdAt: daysAgo(110) },
    { listingId: lFlorence1.id,buyerId: uMilan.id, buyerHospitalId: hMilan.id, sellerHospitalId: hFlorence.id,quantity: 2, unitPrice: 1100, status: "SHIPPED",   createdAt: daysAgo(72)  },
    { listingId: lGenoa2.id,   buyerId: uMilan.id, buyerHospitalId: hMilan.id, sellerHospitalId: hGenoa.id,   quantity: 15, unitPrice: 8.80,status: "CONFIRMED", createdAt: daysAgo(45)  },
    { listingId: lFlorence2.id,buyerId: uMilan.id, buyerHospitalId: hMilan.id, sellerHospitalId: hFlorence.id,quantity: 20, unitPrice: 18.50,status: "PENDING",  createdAt: daysAgo(12)  },
    { listingId: lPadova2.id,  buyerId: uMilan.id, buyerHospitalId: hMilan.id, sellerHospitalId: hPadova.id,  quantity: 30, unitPrice: 4.20,status: "PENDING",   createdAt: daysAgo(4)   },

    // ── Rome buys ──
    { listingId: lMilan1.id,   buyerId: uRome.id, buyerHospitalId: hRome.id, sellerHospitalId: hMilan.id,    quantity: 4, unitPrice: 850,  status: "DELIVERED", createdAt: daysAgo(155) },
    { listingId: lMilan2.id,   buyerId: uRome.id, buyerHospitalId: hRome.id, sellerHospitalId: hMilan.id,    quantity: 20, unitPrice: 12.50,status: "DELIVERED",createdAt: daysAgo(140) },
    { listingId: lPadova1.id,  buyerId: uRome.id, buyerHospitalId: hRome.id, sellerHospitalId: hPadova.id,   quantity: 3, unitPrice: 145,  status: "DELIVERED", createdAt: daysAgo(95)  },
    { listingId: lGenoa1.id,   buyerId: uRome.id, buyerHospitalId: hRome.id, sellerHospitalId: hGenoa.id,    quantity: 6, unitPrice: 22,   status: "CONFIRMED", createdAt: daysAgo(50)  },
    { listingId: lFlorence2.id,buyerId: uRome.id, buyerHospitalId: hRome.id, sellerHospitalId: hFlorence.id, quantity: 15, unitPrice: 18.50,status: "PENDING",  createdAt: daysAgo(8)   },

    // ── Genoa buys ──
    { listingId: lPadova2.id,  buyerId: uGenoa.id, buyerHospitalId: hGenoa.id, sellerHospitalId: hPadova.id,  quantity: 40, unitPrice: 4.20, status: "DELIVERED", createdAt: daysAgo(160) },
    { listingId: lRome2.id,    buyerId: uGenoa.id, buyerHospitalId: hGenoa.id, sellerHospitalId: hRome.id,    quantity: 8, unitPrice: 38,   status: "DELIVERED", createdAt: daysAgo(120) },
    { listingId: lMilan1.id,   buyerId: uGenoa.id, buyerHospitalId: hGenoa.id, sellerHospitalId: hMilan.id,   quantity: 2, unitPrice: 850,  status: "SHIPPED",   createdAt: daysAgo(55)  },
    { listingId: lFlorence1.id,buyerId: uGenoa.id, buyerHospitalId: hGenoa.id, sellerHospitalId: hFlorence.id,quantity: 2, unitPrice: 1100, status: "CONFIRMED", createdAt: daysAgo(30)  },
    { listingId: lMilan2.id,   buyerId: uGenoa.id, buyerHospitalId: hGenoa.id, sellerHospitalId: hMilan.id,   quantity: 10, unitPrice: 12.50,status: "PENDING",  createdAt: daysAgo(6)   },

    // ── Padova buys ──
    { listingId: lMilan1.id,   buyerId: uPadova.id, buyerHospitalId: hPadova.id, sellerHospitalId: hMilan.id,    quantity: 3, unitPrice: 850,  status: "DELIVERED", createdAt: daysAgo(170) },
    { listingId: lFlorence2.id,buyerId: uPadova.id, buyerHospitalId: hPadova.id, sellerHospitalId: hFlorence.id, quantity: 25, unitPrice: 18.50,status: "DELIVERED",createdAt: daysAgo(135) },
    { listingId: lRome1.id,    buyerId: uPadova.id, buyerHospitalId: hPadova.id, sellerHospitalId: hRome.id,     quantity: 4, unitPrice: 920,  status: "SHIPPED",   createdAt: daysAgo(60)  },
    { listingId: lGenoa2.id,   buyerId: uPadova.id, buyerHospitalId: hPadova.id, sellerHospitalId: hGenoa.id,    quantity: 10, unitPrice: 8.80, status: "PENDING",  createdAt: daysAgo(10)  },

    // ── Florence buys ──
    { listingId: lMilan2.id,   buyerId: uFlorence.id, buyerHospitalId: hFlorence.id, sellerHospitalId: hMilan.id,  quantity: 30, unitPrice: 12.50,status: "DELIVERED",createdAt: daysAgo(158) },
    { listingId: lRome2.id,    buyerId: uFlorence.id, buyerHospitalId: hFlorence.id, sellerHospitalId: hRome.id,   quantity: 5, unitPrice: 38,   status: "DELIVERED", createdAt: daysAgo(115) },
    { listingId: lPadova1.id,  buyerId: uFlorence.id, buyerHospitalId: hFlorence.id, sellerHospitalId: hPadova.id, quantity: 4, unitPrice: 145,  status: "CONFIRMED", createdAt: daysAgo(40)  },
    { listingId: lGenoa1.id,   buyerId: uFlorence.id, buyerHospitalId: hFlorence.id, sellerHospitalId: hGenoa.id,  quantity: 12, unitPrice: 22,   status: "CONFIRMED", createdAt: daysAgo(22)  },
    { listingId: lPadova2.id,  buyerId: uFlorence.id, buyerHospitalId: hFlorence.id, sellerHospitalId: hPadova.id, quantity: 20, unitPrice: 4.20, status: "PENDING",   createdAt: daysAgo(3)   },
  ];

  for (const o of orderSeeds) {
    await prisma.order.create({
      data: {
        quantity: o.quantity,
        unitPrice: o.unitPrice,
        totalPrice: o.unitPrice * o.quantity,
        currency: "EUR",
        status: o.status,
        listingId: o.listingId,
        buyerId: o.buyerId,
        buyerHospitalId: o.buyerHospitalId,
        sellerHospitalId: o.sellerHospitalId,
        createdAt: o.createdAt,
      },
    });
  }

  console.log(`✅ Seed complete — 5 hospitals, 5 users, 10 listings (refreshed with AIC/ATC/storageCondition/totalValue), ${orderSeeds.length} orders`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
