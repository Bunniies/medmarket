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
  const [catOncology, catCardiology, catNeurology, catImmunology, catAntibiotics, catAnesthesiology] =
    await Promise.all([
      prisma.category.upsert({ where: { slug: "oncology" },       update: {}, create: { name: "Oncology",       slug: "oncology",       icon: "🔬" } }),
      prisma.category.upsert({ where: { slug: "cardiology" },     update: {}, create: { name: "Cardiology",     slug: "cardiology",     icon: "❤️" } }),
      prisma.category.upsert({ where: { slug: "neurology" },      update: {}, create: { name: "Neurology",      slug: "neurology",      icon: "🧠" } }),
      prisma.category.upsert({ where: { slug: "immunology" },     update: {}, create: { name: "Immunology",     slug: "immunology",     icon: "🛡️" } }),
      prisma.category.upsert({ where: { slug: "antibiotics" },    update: {}, create: { name: "Antibiotics",    slug: "antibiotics",    icon: "💊" } }),
      prisma.category.upsert({ where: { slug: "anesthesiology" }, update: {}, create: { name: "Anesthesiology", slug: "anesthesiology", icon: "😴" } }),
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

  // ── Listings ─────────────────────────────────────────────────────────────────
  const listings = await Promise.all([
    // Milan listings
    prisma.listing.upsert({ where: { id: "lst-milan-1" }, update: {}, create: {
      id: "lst-milan-1", title: "Trastuzumab 440mg — 20 vials", medicineName: "Trastuzumab", genericName: "Trastuzumab", atcCode: "L01FD01",
      manufacturer: "Roche", batchNumber: "BT-2024-001", expiryDate: daysFromNow(45),
      quantity: 20, unit: "vials", pricePerUnit: 850, currency: "EUR",
      condition: MedicineCondition.SEALED, status: ListingStatus.ACTIVE,
      sellerId: uMilan.id, hospitalId: hMilan.id, categoryId: catOncology.id,
    }}),
    prisma.listing.upsert({ where: { id: "lst-milan-2" }, update: {}, create: {
      id: "lst-milan-2", title: "Amiodarone 200mg — 60 tablets surplus", medicineName: "Amiodarone", genericName: "Amiodarone hydrochloride", atcCode: "C01BD01",
      manufacturer: "Sanofi", batchNumber: "SA-2024-112", expiryDate: daysFromNow(180),
      quantity: 60, unit: "tablets", pricePerUnit: 12.50, currency: "EUR",
      condition: MedicineCondition.SEALED, status: ListingStatus.ACTIVE,
      sellerId: uMilan.id, hospitalId: hMilan.id, categoryId: catCardiology.id,
    }}),

    // Rome listings
    prisma.listing.upsert({ where: { id: "lst-rome-1" }, update: {}, create: {
      id: "lst-rome-1", title: "Rituximab 500mg — 15 vials expiring soon", medicineName: "Rituximab", genericName: "Rituximab", atcCode: "L01FA01",
      manufacturer: "Roche", batchNumber: "RT-2024-055", expiryDate: daysFromNow(28),
      quantity: 15, unit: "vials", pricePerUnit: 920, currency: "EUR",
      condition: MedicineCondition.SEALED, status: ListingStatus.ACTIVE,
      sellerId: uRome.id, hospitalId: hRome.id, categoryId: catOncology.id,
    }}),
    prisma.listing.upsert({ where: { id: "lst-rome-2" }, update: {}, create: {
      id: "lst-rome-2", title: "Methylprednisolone 1g — 30 vials", medicineName: "Methylprednisolone", genericName: "Methylprednisolone sodium succinate", atcCode: "H02AB04",
      manufacturer: "Pfizer", batchNumber: "PF-2024-309", expiryDate: daysFromNow(120),
      quantity: 30, unit: "vials", pricePerUnit: 38, currency: "EUR",
      condition: MedicineCondition.SEALED, status: ListingStatus.ACTIVE,
      sellerId: uRome.id, hospitalId: hRome.id, categoryId: catImmunology.id,
    }}),

    // Genoa listings
    prisma.listing.upsert({ where: { id: "lst-genoa-1" }, update: {}, create: {
      id: "lst-genoa-1", title: "Vancomycin 500mg — 40 vials", medicineName: "Vancomycin", genericName: "Vancomycin hydrochloride", atcCode: "J01XA01",
      manufacturer: "Hikma", batchNumber: "HK-2024-771", expiryDate: daysFromNow(60),
      quantity: 40, unit: "vials", pricePerUnit: 22, currency: "EUR",
      condition: MedicineCondition.SEALED, status: ListingStatus.ACTIVE,
      sellerId: uGenoa.id, hospitalId: hGenoa.id, categoryId: catAntibiotics.id,
    }}),
    prisma.listing.upsert({ where: { id: "lst-genoa-2" }, update: {}, create: {
      id: "lst-genoa-2", title: "Propofol 200mg/20ml — 50 vials", medicineName: "Propofol", genericName: "Propofol", atcCode: "N01AX10",
      manufacturer: "Fresenius", batchNumber: "FR-2024-440", expiryDate: daysFromNow(15),
      quantity: 50, unit: "vials", pricePerUnit: 8.80, currency: "EUR",
      condition: MedicineCondition.SEALED, status: ListingStatus.ACTIVE,
      sellerId: uGenoa.id, hospitalId: hGenoa.id, categoryId: catAnesthesiology.id,
    }}),

    // Padova listings
    prisma.listing.upsert({ where: { id: "lst-padova-1" }, update: {}, create: {
      id: "lst-padova-1", title: "Cyclosporine 100mg — 25 capsules", medicineName: "Cyclosporine", genericName: "Ciclosporin", atcCode: "L04AD01",
      manufacturer: "Novartis", batchNumber: "NV-2024-213", expiryDate: daysFromNow(200),
      quantity: 25, unit: "capsules", pricePerUnit: 145, currency: "EUR",
      condition: MedicineCondition.SEALED, status: ListingStatus.ACTIVE,
      sellerId: uPadova.id, hospitalId: hPadova.id, categoryId: catImmunology.id,
    }}),
    prisma.listing.upsert({ where: { id: "lst-padova-2" }, update: {}, create: {
      id: "lst-padova-2", title: "Levetiracetam 500mg — 100 tablets", medicineName: "Levetiracetam", genericName: "Levetiracetam", atcCode: "N03AX14",
      manufacturer: "UCB Pharma", batchNumber: "UC-2024-882", expiryDate: daysFromNow(270),
      quantity: 100, unit: "tablets", pricePerUnit: 4.20, currency: "EUR",
      condition: MedicineCondition.SEALED, status: ListingStatus.ACTIVE,
      sellerId: uPadova.id, hospitalId: hPadova.id, categoryId: catNeurology.id,
    }}),

    // Florence listings
    prisma.listing.upsert({ where: { id: "lst-florence-1" }, update: {}, create: {
      id: "lst-florence-1", title: "Bevacizumab 400mg — 12 vials expiring soon", medicineName: "Bevacizumab", genericName: "Bevacizumab", atcCode: "L01FG01",
      manufacturer: "Roche", batchNumber: "BV-2024-099", expiryDate: daysFromNow(35),
      quantity: 12, unit: "vials", pricePerUnit: 1100, currency: "EUR",
      condition: MedicineCondition.SEALED, status: ListingStatus.ACTIVE,
      sellerId: uFlorence.id, hospitalId: hFlorence.id, categoryId: catOncology.id,
    }}),
    prisma.listing.upsert({ where: { id: "lst-florence-2" }, update: {}, create: {
      id: "lst-florence-2", title: "Piperacillin/Tazobactam 4.5g — 80 vials", medicineName: "Piperacillin/Tazobactam", genericName: "Piperacillin / Tazobactam", atcCode: "J01CR05",
      manufacturer: "Pfizer", batchNumber: "PF-2024-501", expiryDate: daysFromNow(90),
      quantity: 80, unit: "vials", pricePerUnit: 18.50, currency: "EUR",
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

  console.log(`✅ Seed complete — 5 hospitals, 5 users, 10 listings, ${orderSeeds.length} orders`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
