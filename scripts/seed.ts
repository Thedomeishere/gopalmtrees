/**
 * Seed script for Firebase emulators.
 *
 * Populates Auth + Firestore with realistic sample data for local development.
 * Run: pnpm seed  (from project root, with emulators running)
 */

import { initializeApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";

// ─── Firebase init (points at emulators via env vars) ────────
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";

initializeApp({ projectId: "demo-go-palm-trees" });

const auth = getAuth();
const db = getFirestore();

// ─── Helpers ─────────────────────────────────────────────────
function ts(date: Date): Timestamp {
  return Timestamp.fromDate(date);
}

function daysAgo(n: number): Timestamp {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(12, 0, 0, 0);
  return ts(d);
}

function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ─── Fixed IDs ───────────────────────────────────────────────
const ADMIN_UID = "admin-uid-001";
const JOHN_UID = "john-uid-002";
const SARAH_UID = "sarah-uid-003";

// Product IDs
const PID = {
  canaryPalm: "prod-canary-island-date-palm",
  pygmyPalm: "prod-pygmy-date-palm",
  windmillPalm: "prod-windmill-palm",
  birdOfParadise: "prod-bird-of-paradise",
  monstera: "prod-monstera-deliciosa",
  meyerLemon: "prod-meyer-lemon",
  avocado: "prod-avocado-tree",
  plumeria: "prod-plumeria",
  japanesemaple: "prod-japanese-maple",
  agave: "prod-agave-blue-glow",
  aloe: "prod-aloe-vera",
  fertilizer: "prod-premium-palm-fertilizer",
};

// Category IDs
const CAT = {
  palmTrees: "cat-palm-trees",
  tropicalPlants: "cat-tropical-plants",
  fruitTrees: "cat-fruit-trees",
  exoticPlants: "cat-exotic-plants",
  succulents: "cat-succulents",
  gardenSupplies: "cat-garden-supplies",
};

// ─── Auth Users ──────────────────────────────────────────────
async function seedAuth() {
  console.log("Seeding Auth users...");

  const users = [
    {
      uid: ADMIN_UID,
      email: "admin@gopalmtrees.com",
      password: "admin123",
      displayName: "Palm Admin",
    },
    {
      uid: JOHN_UID,
      email: "john@example.com",
      password: "test1234",
      displayName: "John Rivera",
    },
    {
      uid: SARAH_UID,
      email: "sarah@example.com",
      password: "test1234",
      displayName: "Sarah Chen",
    },
  ];

  for (const u of users) {
    try {
      await auth.createUser(u);
      console.log(`  Created user: ${u.email}`);
    } catch (err: any) {
      if (err.code === "auth/uid-already-exists" || err.code === "auth/email-already-exists") {
        console.log(`  User already exists: ${u.email}`);
      } else {
        throw err;
      }
    }
  }
}

// ─── Categories ──────────────────────────────────────────────
async function seedCategories() {
  console.log("Seeding categories...");

  const categories = [
    {
      id: CAT.palmTrees,
      name: "Palm Trees",
      slug: "palm-trees",
      description: "Beautiful palm trees to bring a tropical feel to your landscape.",
      imageURL: "https://placehold.co/600x400/2d5016/white?text=Palm+Trees",
      sortOrder: 1,
      active: true,
    },
    {
      id: CAT.tropicalPlants,
      name: "Tropical Plants",
      slug: "tropical-plants",
      description: "Lush tropical plants that thrive in warm environments.",
      imageURL: "https://placehold.co/600x400/1a6b3c/white?text=Tropical+Plants",
      sortOrder: 2,
      active: true,
    },
    {
      id: CAT.fruitTrees,
      name: "Fruit Trees",
      slug: "fruit-trees",
      description: "Grow your own fresh fruit with our selection of fruit trees.",
      imageURL: "https://placehold.co/600x400/8b6914/white?text=Fruit+Trees",
      sortOrder: 3,
      active: true,
    },
    {
      id: CAT.exoticPlants,
      name: "Exotic Plants",
      slug: "exotic-plants",
      description: "Rare and exotic plants to make your garden stand out.",
      imageURL: "https://placehold.co/600x400/6b1a6b/white?text=Exotic+Plants",
      sortOrder: 4,
      active: true,
    },
    {
      id: CAT.succulents,
      name: "Succulents",
      slug: "succulents",
      description: "Low-maintenance succulents perfect for any space.",
      imageURL: "https://placehold.co/600x400/3c8b6b/white?text=Succulents",
      sortOrder: 5,
      active: true,
    },
    {
      id: CAT.gardenSupplies,
      name: "Garden Supplies",
      slug: "garden-supplies",
      description: "Everything you need to keep your plants healthy and thriving.",
      imageURL: "https://placehold.co/600x400/8b4513/white?text=Garden+Supplies",
      sortOrder: 6,
      active: true,
    },
  ];

  const batch = db.batch();
  for (const cat of categories) {
    const { id, ...data } = cat;
    batch.set(db.collection("categories").doc(id), data);
  }
  await batch.commit();
  console.log(`  Created ${categories.length} categories`);
}

// ─── Stores ──────────────────────────────────────────────────
async function seedStores() {
  console.log("Seeding stores...");

  const weekdayHours = (day: string) => ({ day, open: "9:00 AM", close: "6:00 PM", closed: false });
  const sundayHours = { day: "Sunday", open: "", close: "", closed: true };

  const defaultHours = [
    weekdayHours("Monday"),
    weekdayHours("Tuesday"),
    weekdayHours("Wednesday"),
    weekdayHours("Thursday"),
    weekdayHours("Friday"),
    { day: "Saturday", open: "9:00 AM", close: "5:00 PM", closed: false },
    sundayHours,
  ];

  const storeLocations = [
    {
      name: "Go Palm Trees - Hicksville",
      address: "388 S Broadway",
      city: "Hicksville",
      state: "NY",
      zip: "11801",
      phone: "(516) 822-7256",
      latitude: 40.7632,
      longitude: -73.525,
    },
    {
      name: "Go Palm Trees - Island Park",
      address: "4177 Austin Blvd",
      city: "Island Park",
      state: "NY",
      zip: "11558",
      phone: "(516) 889-3961",
      latitude: 40.6043,
      longitude: -73.6554,
    },
    {
      name: "Go Palm Trees - Dix Hills",
      address: "547 E Deer Park Rd",
      city: "Dix Hills",
      state: "NY",
      zip: "11746",
      phone: "(631) 242-7256",
      latitude: 40.8051,
      longitude: -73.3243,
    },
    {
      name: "Go Palm Trees - Manahawkin",
      address: "657 E Bay Ave",
      city: "Manahawkin",
      state: "NJ",
      zip: "08050",
      phone: "(609) 597-7256",
      latitude: 39.6932,
      longitude: -74.2585,
    },
  ];

  const batch = db.batch();
  storeLocations.forEach((loc, i) => {
    const id = `store-${slug(loc.city)}`;
    batch.set(db.collection("stores").doc(id), {
      ...loc,
      hours: defaultHours,
      imageURL: `https://placehold.co/800x400/2d5016/white?text=${encodeURIComponent(loc.city)}`,
      active: true,
    });
  });
  await batch.commit();
  console.log(`  Created ${storeLocations.length} stores`);
}

// ─── Products ────────────────────────────────────────────────
async function seedProducts() {
  console.log("Seeding products...");

  const now = Timestamp.now();

  const products = [
    // Palm Trees
    {
      id: PID.canaryPalm,
      name: "Canary Island Date Palm",
      slug: "canary-island-date-palm",
      description:
        "The Canary Island Date Palm (Phoenix canariensis) is a majestic, slow-growing palm known for its thick trunk and graceful crown of arching fronds. A stunning focal point for any landscape.",
      categoryId: CAT.palmTrees,
      images: [
        "https://placehold.co/800x600/2d5016/white?text=Canary+Palm+1",
        "https://placehold.co/800x600/2d5016/white?text=Canary+Palm+2",
      ],
      thumbnailURL: "https://placehold.co/400x400/2d5016/white?text=Canary+Palm",
      sizes: [
        { id: "sm", label: "Small", height: "3-4 ft", price: 149.99, stock: 12, sku: "CIP-SM-001" },
        { id: "md", label: "Medium", height: "5-7 ft", price: 299.99, stock: 8, sku: "CIP-MD-001" },
        { id: "lg", label: "Large", height: "8-10 ft", price: 499.99, stock: 4, sku: "CIP-LG-001" },
      ],
      careInfo: {
        sunlight: "Full sun",
        water: "Moderate; water deeply once per week",
        temperature: "Hardy to 20°F (-6°C)",
        soil: "Well-draining sandy or loamy soil",
        tips: [
          "Fertilize 3 times a year with palm-specific fertilizer",
          "Remove dead fronds to maintain appearance",
          "Protect from hard freezes when young",
        ],
      },
      tags: ["palm", "tropical", "landscape", "cold-hardy"],
      featured: true,
      active: true,
      seasonalOnly: false,
      createdAt: daysAgo(90),
      updatedAt: now,
    },
    {
      id: PID.pygmyPalm,
      name: "Pygmy Date Palm",
      slug: "pygmy-date-palm",
      description:
        "The Pygmy Date Palm (Phoenix roebelenii) is a compact, elegant palm perfect for smaller spaces. Its soft, feathery fronds create a lush tropical look.",
      categoryId: CAT.palmTrees,
      images: [
        "https://placehold.co/800x600/2d5016/white?text=Pygmy+Palm+1",
        "https://placehold.co/800x600/2d5016/white?text=Pygmy+Palm+2",
      ],
      thumbnailURL: "https://placehold.co/400x400/2d5016/white?text=Pygmy+Palm",
      sizes: [
        { id: "sm", label: "Small", height: "2-3 ft", price: 79.99, stock: 20, sku: "PDP-SM-001" },
        { id: "md", label: "Medium", height: "3-4 ft", price: 129.99, stock: 15, sku: "PDP-MD-001" },
        { id: "lg", label: "Large", height: "5-6 ft", price: 199.99, stock: 8, sku: "PDP-LG-001" },
      ],
      careInfo: {
        sunlight: "Partial to full sun",
        water: "Regular watering; keep soil slightly moist",
        temperature: "Hardy to 30°F (-1°C)",
        soil: "Rich, well-draining potting mix",
        tips: [
          "Great for containers and indoor spaces",
          "Mist leaves occasionally in dry environments",
          "Fertilize monthly during growing season",
        ],
      },
      tags: ["palm", "tropical", "indoor", "compact"],
      featured: true,
      active: true,
      seasonalOnly: false,
      createdAt: daysAgo(85),
      updatedAt: now,
    },
    {
      id: PID.windmillPalm,
      name: "Windmill Palm",
      slug: "windmill-palm",
      description:
        "The Windmill Palm (Trachycarpus fortunei) is one of the hardiest palms available, able to withstand cold temperatures and snow. Its distinctive hairy trunk and fan-shaped fronds make it a unique addition.",
      categoryId: CAT.palmTrees,
      images: [
        "https://placehold.co/800x600/2d5016/white?text=Windmill+Palm+1",
        "https://placehold.co/800x600/2d5016/white?text=Windmill+Palm+2",
        "https://placehold.co/800x600/2d5016/white?text=Windmill+Palm+3",
      ],
      thumbnailURL: "https://placehold.co/400x400/2d5016/white?text=Windmill+Palm",
      sizes: [
        { id: "sm", label: "Small", height: "3-4 ft", price: 119.99, stock: 15, sku: "WMP-SM-001" },
        { id: "md", label: "Medium", height: "5-6 ft", price: 229.99, stock: 10, sku: "WMP-MD-001" },
        { id: "lg", label: "Large", height: "7-9 ft", price: 399.99, stock: 5, sku: "WMP-LG-001" },
      ],
      careInfo: {
        sunlight: "Full sun to partial shade",
        water: "Moderate; drought tolerant once established",
        temperature: "Hardy to 5°F (-15°C)",
        soil: "Well-draining; tolerates various soil types",
        tips: [
          "Most cold-hardy palm available",
          "Wrap trunk in burlap during extreme cold snaps",
          "Slow growing — patience is rewarded",
        ],
      },
      tags: ["palm", "cold-hardy", "landscape", "fan-palm"],
      featured: false,
      active: true,
      seasonalOnly: false,
      createdAt: daysAgo(80),
      updatedAt: now,
    },
    // Tropical Plants
    {
      id: PID.birdOfParadise,
      name: "Bird of Paradise",
      slug: "bird-of-paradise",
      description:
        "The Bird of Paradise (Strelitzia reginae) produces striking orange and blue flowers that resemble tropical birds in flight. A dramatic accent plant for gardens and interiors.",
      categoryId: CAT.tropicalPlants,
      images: [
        "https://placehold.co/800x600/1a6b3c/white?text=Bird+of+Paradise+1",
        "https://placehold.co/800x600/1a6b3c/white?text=Bird+of+Paradise+2",
      ],
      thumbnailURL: "https://placehold.co/400x400/1a6b3c/white?text=Bird+of+Paradise",
      sizes: [
        { id: "sm", label: "Small", height: "1-2 ft", price: 39.99, stock: 25, sku: "BOP-SM-001" },
        { id: "md", label: "Medium", height: "3-4 ft", price: 89.99, stock: 15, sku: "BOP-MD-001" },
        { id: "lg", label: "Large", height: "5-6 ft", price: 159.99, stock: 8, sku: "BOP-LG-001" },
      ],
      careInfo: {
        sunlight: "Full sun to partial shade",
        water: "Regular watering; allow top soil to dry between waterings",
        temperature: "Hardy to 25°F (-4°C)",
        soil: "Rich, well-draining soil",
        tips: [
          "Blooms best in full sun",
          "Divide clumps every 5 years for best flowering",
          "Makes an excellent indoor plant in bright light",
        ],
      },
      tags: ["tropical", "flowering", "indoor", "accent"],
      featured: true,
      active: true,
      seasonalOnly: false,
      createdAt: daysAgo(75),
      updatedAt: now,
    },
    {
      id: PID.monstera,
      name: "Monstera Deliciosa",
      slug: "monstera-deliciosa",
      description:
        "The Monstera Deliciosa, or Swiss Cheese Plant, is beloved for its large, glossy, perforated leaves. A trendy and easy-to-care-for tropical houseplant.",
      categoryId: CAT.tropicalPlants,
      images: [
        "https://placehold.co/800x600/1a6b3c/white?text=Monstera+1",
        "https://placehold.co/800x600/1a6b3c/white?text=Monstera+2",
      ],
      thumbnailURL: "https://placehold.co/400x400/1a6b3c/white?text=Monstera",
      sizes: [
        { id: "sm", label: "Small", height: "1-2 ft", price: 34.99, stock: 30, sku: "MON-SM-001" },
        { id: "md", label: "Medium", height: "2-3 ft", price: 69.99, stock: 18, sku: "MON-MD-001" },
        { id: "lg", label: "Large", height: "4-5 ft", price: 119.99, stock: 10, sku: "MON-LG-001" },
      ],
      careInfo: {
        sunlight: "Bright indirect light",
        water: "Water when top 2 inches of soil are dry",
        temperature: "60-85°F (15-29°C)",
        soil: "Peat-based well-draining mix",
        tips: [
          "Provide a moss pole for climbing support",
          "Wipe leaves with a damp cloth to remove dust",
          "Toxic to pets — keep out of reach",
        ],
      },
      tags: ["tropical", "indoor", "houseplant", "trendy"],
      featured: false,
      active: true,
      seasonalOnly: false,
      createdAt: daysAgo(70),
      updatedAt: now,
    },
    // Fruit Trees
    {
      id: PID.meyerLemon,
      name: "Meyer Lemon Tree",
      slug: "meyer-lemon-tree",
      description:
        "The Meyer Lemon Tree produces sweet, thin-skinned lemons that are a cross between a lemon and a mandarin orange. Perfect for patios, gardens, or growing indoors.",
      categoryId: CAT.fruitTrees,
      images: [
        "https://placehold.co/800x600/8b6914/white?text=Meyer+Lemon+1",
        "https://placehold.co/800x600/8b6914/white?text=Meyer+Lemon+2",
      ],
      thumbnailURL: "https://placehold.co/400x400/8b6914/white?text=Meyer+Lemon",
      sizes: [
        { id: "sm", label: "Small", height: "1-2 ft", price: 49.99, stock: 20, sku: "MLT-SM-001" },
        { id: "md", label: "Medium", height: "3-4 ft", price: 99.99, stock: 12, sku: "MLT-MD-001" },
        { id: "lg", label: "Large", height: "5-6 ft", price: 179.99, stock: 6, sku: "MLT-LG-001" },
      ],
      careInfo: {
        sunlight: "Full sun (6-8 hours)",
        water: "Regular; keep soil consistently moist but not soggy",
        temperature: "Hardy to 28°F (-2°C)",
        soil: "Slightly acidic, well-draining citrus mix",
        tips: [
          "Bring indoors when temperatures drop below 28°F",
          "Fertilize with citrus-specific fertilizer every 4-6 weeks",
          "Prune to maintain shape and encourage fruiting",
        ],
      },
      tags: ["fruit", "citrus", "indoor", "edible"],
      featured: true,
      active: true,
      seasonalOnly: false,
      createdAt: daysAgo(65),
      updatedAt: now,
    },
    {
      id: PID.avocado,
      name: "Avocado Tree",
      slug: "avocado-tree",
      description:
        "Grow your own avocados at home! Our grafted Avocado Trees produce fruit much sooner than seed-grown varieties. A rewarding addition to warm-climate gardens.",
      categoryId: CAT.fruitTrees,
      images: [
        "https://placehold.co/800x600/8b6914/white?text=Avocado+Tree+1",
        "https://placehold.co/800x600/8b6914/white?text=Avocado+Tree+2",
      ],
      thumbnailURL: "https://placehold.co/400x400/8b6914/white?text=Avocado+Tree",
      sizes: [
        { id: "sm", label: "Small", height: "2-3 ft", price: 59.99, stock: 15, sku: "AVO-SM-001" },
        { id: "md", label: "Medium", height: "4-5 ft", price: 129.99, stock: 8, sku: "AVO-MD-001" },
      ],
      careInfo: {
        sunlight: "Full sun",
        water: "Deep watering 2-3 times per week",
        temperature: "Hardy to 32°F (0°C)",
        soil: "Well-draining, slightly acidic soil",
        tips: [
          "Grafted varieties fruit in 2-3 years vs 10+ from seed",
          "Protect from frost with covers in winter",
          "Mulch around base to retain moisture",
        ],
      },
      tags: ["fruit", "edible", "tropical", "grafted"],
      featured: false,
      active: true,
      seasonalOnly: true,
      createdAt: daysAgo(60),
      updatedAt: now,
    },
    // Exotic Plants
    {
      id: PID.plumeria,
      name: "Plumeria",
      slug: "plumeria",
      description:
        "Plumeria, also known as Frangipani, produces intensely fragrant flowers in shades of white, yellow, pink, and red. The iconic flower of Hawaiian leis.",
      categoryId: CAT.exoticPlants,
      images: [
        "https://placehold.co/800x600/6b1a6b/white?text=Plumeria+1",
        "https://placehold.co/800x600/6b1a6b/white?text=Plumeria+2",
      ],
      thumbnailURL: "https://placehold.co/400x400/6b1a6b/white?text=Plumeria",
      sizes: [
        { id: "sm", label: "Small", height: "1-2 ft", price: 44.99, stock: 18, sku: "PLU-SM-001" },
        { id: "md", label: "Medium", height: "3-4 ft", price: 89.99, stock: 10, sku: "PLU-MD-001" },
        { id: "lg", label: "Large", height: "5-6 ft", price: 149.99, stock: 5, sku: "PLU-LG-001" },
      ],
      careInfo: {
        sunlight: "Full sun (at least 6 hours)",
        water: "Moderate; reduce in winter dormancy",
        temperature: "Hardy to 33°F (1°C)",
        soil: "Well-draining, slightly acidic",
        tips: [
          "Goes dormant in winter and loses leaves — this is normal",
          "Bring indoors before first frost",
          "Avoid overwatering to prevent root rot",
        ],
      },
      tags: ["exotic", "flowering", "fragrant", "tropical"],
      featured: false,
      active: true,
      seasonalOnly: true,
      createdAt: daysAgo(55),
      updatedAt: now,
    },
    {
      id: PID.japanesemaple,
      name: "Japanese Maple",
      slug: "japanese-maple",
      description:
        "The Japanese Maple (Acer palmatum) is prized for its stunning, delicate foliage that turns brilliant shades of red, orange, and gold in autumn. An elegant specimen tree.",
      categoryId: CAT.exoticPlants,
      images: [
        "https://placehold.co/800x600/6b1a6b/white?text=Japanese+Maple+1",
        "https://placehold.co/800x600/6b1a6b/white?text=Japanese+Maple+2",
        "https://placehold.co/800x600/6b1a6b/white?text=Japanese+Maple+3",
      ],
      thumbnailURL: "https://placehold.co/400x400/6b1a6b/white?text=Japanese+Maple",
      sizes: [
        { id: "sm", label: "Small", height: "2-3 ft", price: 89.99, stock: 12, sku: "JMP-SM-001" },
        { id: "md", label: "Medium", height: "4-5 ft", price: 179.99, stock: 7, sku: "JMP-MD-001" },
        { id: "lg", label: "Large", height: "6-8 ft", price: 349.99, stock: 3, sku: "JMP-LG-001" },
      ],
      careInfo: {
        sunlight: "Partial shade; protect from harsh afternoon sun",
        water: "Regular; keep soil consistently moist",
        temperature: "Hardy to -10°F (-23°C)",
        soil: "Acidic, well-draining, rich in organic matter",
        tips: [
          "Mulch heavily to protect shallow roots",
          "Avoid heavy pruning — light shaping only",
          "Stunning fall color makes it a landscape centerpiece",
        ],
      },
      tags: ["exotic", "ornamental", "deciduous", "fall-color"],
      featured: true,
      active: true,
      seasonalOnly: false,
      createdAt: daysAgo(50),
      updatedAt: now,
    },
    // Succulents
    {
      id: PID.agave,
      name: "Agave Blue Glow",
      slug: "agave-blue-glow",
      description:
        "Agave 'Blue Glow' is a stunning hybrid succulent with smooth, blue-green leaves edged in red and gold. A slow-growing, architectural accent plant.",
      categoryId: CAT.succulents,
      images: [
        "https://placehold.co/800x600/3c8b6b/white?text=Agave+Blue+Glow+1",
        "https://placehold.co/800x600/3c8b6b/white?text=Agave+Blue+Glow+2",
      ],
      thumbnailURL: "https://placehold.co/400x400/3c8b6b/white?text=Agave+Blue+Glow",
      sizes: [
        { id: "sm", label: "Small", height: "6-8 in", price: 24.99, stock: 35, sku: "ABG-SM-001" },
        { id: "md", label: "Medium", height: "12-16 in", price: 49.99, stock: 20, sku: "ABG-MD-001" },
        { id: "lg", label: "Large", height: "18-24 in", price: 89.99, stock: 10, sku: "ABG-LG-001" },
      ],
      careInfo: {
        sunlight: "Full sun",
        water: "Very low; water every 2-3 weeks in summer",
        temperature: "Hardy to 25°F (-4°C)",
        soil: "Fast-draining cactus/succulent mix",
        tips: [
          "Extremely drought tolerant once established",
          "Protect from prolonged freezing temperatures",
          "Handle with care — leaf tips are sharp",
        ],
      },
      tags: ["succulent", "drought-tolerant", "architectural", "low-maintenance"],
      featured: false,
      active: true,
      seasonalOnly: false,
      createdAt: daysAgo(45),
      updatedAt: now,
    },
    {
      id: PID.aloe,
      name: "Aloe Vera",
      slug: "aloe-vera",
      description:
        "Aloe Vera is a versatile succulent known for its medicinal gel. Easy to grow indoors or out, it's both beautiful and practical.",
      categoryId: CAT.succulents,
      images: [
        "https://placehold.co/800x600/3c8b6b/white?text=Aloe+Vera+1",
        "https://placehold.co/800x600/3c8b6b/white?text=Aloe+Vera+2",
      ],
      thumbnailURL: "https://placehold.co/400x400/3c8b6b/white?text=Aloe+Vera",
      sizes: [
        { id: "sm", label: "Small", height: "4-6 in", price: 19.99, stock: 40, sku: "ALV-SM-001" },
        { id: "md", label: "Medium", height: "8-12 in", price: 34.99, stock: 25, sku: "ALV-MD-001" },
      ],
      careInfo: {
        sunlight: "Bright indirect light to full sun",
        water: "Low; water when soil is completely dry",
        temperature: "Hardy to 40°F (4°C)",
        soil: "Sandy, well-draining cactus mix",
        tips: [
          "Gel inside leaves soothes minor burns and skin irritation",
          "Overwatering is the #1 cause of aloe death",
          "Produces offsets (pups) that can be separated and repotted",
        ],
      },
      tags: ["succulent", "medicinal", "indoor", "beginner-friendly"],
      featured: false,
      active: true,
      seasonalOnly: false,
      createdAt: daysAgo(40),
      updatedAt: now,
    },
    // Garden Supplies
    {
      id: PID.fertilizer,
      name: "Premium Palm Fertilizer",
      slug: "premium-palm-fertilizer",
      description:
        "Our specially formulated palm fertilizer provides the perfect blend of nitrogen, potassium, and micronutrients that palms and tropical plants need to thrive. 8-2-12 formula with slow-release granules.",
      categoryId: CAT.gardenSupplies,
      images: [
        "https://placehold.co/800x600/8b4513/white?text=Palm+Fertilizer+1",
        "https://placehold.co/800x600/8b4513/white?text=Palm+Fertilizer+2",
      ],
      thumbnailURL: "https://placehold.co/400x400/8b4513/white?text=Palm+Fertilizer",
      sizes: [
        { id: "sm", label: "5 lb Bag", height: "N/A", price: 19.99, stock: 50, sku: "PPF-SM-001" },
        { id: "md", label: "10 lb Bag", height: "N/A", price: 34.99, stock: 30, sku: "PPF-MD-001" },
        { id: "lg", label: "25 lb Bag", height: "N/A", price: 69.99, stock: 15, sku: "PPF-LG-001" },
      ],
      careInfo: {
        sunlight: "N/A",
        water: "Water in after applying",
        temperature: "Store in cool, dry place",
        soil: "Apply to surface around drip line",
        tips: [
          "Apply every 3 months during growing season",
          "Use 1 lb per inch of trunk diameter",
          "Keep away from direct trunk contact",
        ],
      },
      tags: ["supplies", "fertilizer", "palm-care", "slow-release"],
      featured: false,
      active: true,
      seasonalOnly: false,
      createdAt: daysAgo(35),
      updatedAt: now,
    },
  ];

  const batch = db.batch();
  for (const prod of products) {
    const { id, ...data } = prod;
    batch.set(db.collection("products").doc(id), data);
  }
  await batch.commit();
  console.log(`  Created ${products.length} products`);
}

// ─── Users (Firestore profiles) ──────────────────────────────
async function seedUsers() {
  console.log("Seeding user profiles...");

  const now = Timestamp.now();

  const users = [
    {
      id: ADMIN_UID,
      email: "admin@gopalmtrees.com",
      displayName: "Palm Admin",
      phone: "(516) 555-0001",
      photoURL: "",
      role: "admin" as const,
      addresses: [],
      fcmTokens: [],
      notificationPreferences: {
        orderUpdates: true,
        promotions: false,
        quoteResponses: true,
      },
      createdAt: daysAgo(120),
      updatedAt: now,
    },
    {
      id: JOHN_UID,
      email: "john@example.com",
      displayName: "John Rivera",
      phone: "(516) 555-0102",
      photoURL: "",
      role: "customer" as const,
      addresses: [
        {
          id: "addr-john-1",
          label: "Home",
          street: "123 Maple Street",
          unit: "Apt 4B",
          city: "Hicksville",
          state: "NY",
          zip: "11801",
          isDefault: true,
        },
        {
          id: "addr-john-2",
          label: "Office",
          street: "456 Corporate Blvd",
          city: "Garden City",
          state: "NY",
          zip: "11530",
          isDefault: false,
        },
      ],
      fcmTokens: [],
      notificationPreferences: {
        orderUpdates: true,
        promotions: true,
        quoteResponses: true,
      },
      createdAt: daysAgo(60),
      updatedAt: now,
    },
    {
      id: SARAH_UID,
      email: "sarah@example.com",
      displayName: "Sarah Chen",
      phone: "(609) 555-0203",
      photoURL: "",
      role: "customer" as const,
      addresses: [
        {
          id: "addr-sarah-1",
          label: "Home",
          street: "789 Ocean Avenue",
          city: "Manahawkin",
          state: "NJ",
          zip: "08050",
          isDefault: true,
        },
      ],
      fcmTokens: [],
      notificationPreferences: {
        orderUpdates: true,
        promotions: true,
        quoteResponses: true,
      },
      createdAt: daysAgo(30),
      updatedAt: now,
    },
  ];

  const batch = db.batch();
  for (const u of users) {
    const { id, ...data } = u;
    batch.set(db.collection("users").doc(id), data);
  }
  await batch.commit();
  console.log(`  Created ${users.length} user profiles`);
}

// ─── Orders ──────────────────────────────────────────────────
async function seedOrders() {
  console.log("Seeding orders...");

  const johnAddress = {
    id: "addr-john-1",
    label: "Home",
    street: "123 Maple Street",
    unit: "Apt 4B",
    city: "Hicksville",
    state: "NY",
    zip: "11801",
    isDefault: true,
  };

  const orders = [
    // Order 1: Confirmed (just placed)
    {
      id: "order-001",
      userId: JOHN_UID,
      userEmail: "john@example.com",
      items: [
        {
          productId: PID.pygmyPalm,
          productName: "Pygmy Date Palm",
          productImage: "https://placehold.co/400x400/2d5016/white?text=Pygmy+Palm",
          sizeId: "md",
          sizeLabel: "Medium",
          price: 129.99,
          quantity: 1,
        },
        {
          productId: PID.fertilizer,
          productName: "Premium Palm Fertilizer",
          productImage: "https://placehold.co/400x400/8b4513/white?text=Palm+Fertilizer",
          sizeId: "sm",
          sizeLabel: "5 lb Bag",
          price: 19.99,
          quantity: 2,
        },
      ],
      subtotal: 169.97,
      tax: 13.6,
      deliveryFee: 0,
      total: 183.57,
      shippingAddress: johnAddress,
      statusHistory: [
        { status: "confirmed", timestamp: daysAgo(0), note: "Payment received" },
      ],
      currentStatus: "confirmed",
      stripePaymentIntentId: "pi_seed_001",
      createdAt: daysAgo(0),
      updatedAt: daysAgo(0),
    },
    // Order 2: Preparing
    {
      id: "order-002",
      userId: JOHN_UID,
      userEmail: "john@example.com",
      items: [
        {
          productId: PID.birdOfParadise,
          productName: "Bird of Paradise",
          productImage: "https://placehold.co/400x400/1a6b3c/white?text=Bird+of+Paradise",
          sizeId: "lg",
          sizeLabel: "Large",
          price: 159.99,
          quantity: 1,
        },
      ],
      subtotal: 159.99,
      tax: 12.8,
      deliveryFee: 0,
      total: 172.79,
      shippingAddress: johnAddress,
      statusHistory: [
        { status: "confirmed", timestamp: daysAgo(3), note: "Payment received" },
        { status: "preparing", timestamp: daysAgo(2), note: "Being prepared at our Hicksville farm" },
      ],
      currentStatus: "preparing",
      stripePaymentIntentId: "pi_seed_002",
      createdAt: daysAgo(3),
      updatedAt: daysAgo(2),
    },
    // Order 3: Delivered (full timeline)
    {
      id: "order-003",
      userId: JOHN_UID,
      userEmail: "john@example.com",
      items: [
        {
          productId: PID.canaryPalm,
          productName: "Canary Island Date Palm",
          productImage: "https://placehold.co/400x400/2d5016/white?text=Canary+Palm",
          sizeId: "lg",
          sizeLabel: "Large",
          price: 499.99,
          quantity: 1,
        },
        {
          productId: PID.agave,
          productName: "Agave Blue Glow",
          productImage: "https://placehold.co/400x400/3c8b6b/white?text=Agave+Blue+Glow",
          sizeId: "md",
          sizeLabel: "Medium",
          price: 49.99,
          quantity: 2,
        },
      ],
      subtotal: 599.97,
      tax: 48.0,
      deliveryFee: 0,
      total: 647.97,
      shippingAddress: johnAddress,
      deliveryDate: daysAgo(7),
      statusHistory: [
        { status: "confirmed", timestamp: daysAgo(14), note: "Payment received" },
        { status: "preparing", timestamp: daysAgo(12), note: "Being prepared at our Hicksville farm" },
        { status: "in_transit", timestamp: daysAgo(8), note: "On the delivery truck" },
        { status: "delivered", timestamp: daysAgo(7), note: "Delivered to front door" },
      ],
      currentStatus: "delivered",
      stripePaymentIntentId: "pi_seed_003",
      createdAt: daysAgo(14),
      updatedAt: daysAgo(7),
    },
    // Order 4: Cancelled + refunded
    {
      id: "order-004",
      userId: JOHN_UID,
      userEmail: "john@example.com",
      items: [
        {
          productId: PID.meyerLemon,
          productName: "Meyer Lemon Tree",
          productImage: "https://placehold.co/400x400/8b6914/white?text=Meyer+Lemon",
          sizeId: "md",
          sizeLabel: "Medium",
          price: 99.99,
          quantity: 1,
        },
      ],
      subtotal: 99.99,
      tax: 8.0,
      deliveryFee: 0,
      total: 107.99,
      shippingAddress: johnAddress,
      statusHistory: [
        { status: "confirmed", timestamp: daysAgo(10), note: "Payment received" },
        { status: "cancelled", timestamp: daysAgo(9), note: "Customer requested cancellation" },
        { status: "refunded", timestamp: daysAgo(8), note: "Full refund issued" },
      ],
      currentStatus: "refunded",
      stripePaymentIntentId: "pi_seed_004",
      refundId: "re_seed_004",
      refundAmount: 107.99,
      createdAt: daysAgo(10),
      updatedAt: daysAgo(8),
    },
  ];

  const batch = db.batch();
  for (const order of orders) {
    const { id, ...data } = order;
    batch.set(db.collection("orders").doc(id), data);
  }
  await batch.commit();
  console.log(`  Created ${orders.length} orders`);
}

// ─── Cart ────────────────────────────────────────────────────
async function seedCarts() {
  console.log("Seeding carts...");

  await db
    .collection("carts")
    .doc(SARAH_UID)
    .set({
      userId: SARAH_UID,
      items: [
        {
          productId: PID.monstera,
          productName: "Monstera Deliciosa",
          productImage: "https://placehold.co/400x400/1a6b3c/white?text=Monstera",
          sizeId: "md",
          sizeLabel: "Medium",
          price: 69.99,
          quantity: 1,
        },
        {
          productId: PID.aloe,
          productName: "Aloe Vera",
          productImage: "https://placehold.co/400x400/3c8b6b/white?text=Aloe+Vera",
          sizeId: "sm",
          sizeLabel: "Small",
          price: 19.99,
          quantity: 3,
        },
      ],
      updatedAt: Timestamp.now(),
    });

  console.log("  Created 1 cart (sarah)");
}

// ─── Quotes ──────────────────────────────────────────────────
async function seedQuotes() {
  console.log("Seeding quotes...");

  const now = Timestamp.now();

  const quotes = [
    {
      id: "quote-001",
      userId: JOHN_UID,
      userEmail: "john@example.com",
      userName: "John Rivera",
      serviceType: "landscape_design",
      description:
        "I'd like a full tropical landscape design for my backyard. About 2,000 sq ft area. Looking for a mix of palms, tropical plants, and a small water feature. Would love to see a 3D rendering before committing.",
      photos: [],
      contactPreference: "email" as const,
      phone: "(516) 555-0102",
      status: "pending" as const,
      createdAt: daysAgo(2),
      updatedAt: daysAgo(2),
    },
    {
      id: "quote-002",
      userId: SARAH_UID,
      userEmail: "sarah@example.com",
      userName: "Sarah Chen",
      serviceType: "installation",
      description:
        "Need 3 large Windmill Palms installed in my front yard. The holes are already dug. Just need professional planting and staking. Address is 789 Ocean Avenue, Manahawkin, NJ.",
      photos: [],
      contactPreference: "phone" as const,
      phone: "(609) 555-0203",
      status: "estimated" as const,
      adminResponse:
        "Hi Sarah! We can definitely help with the palm installation. Based on your description, we estimate 2-3 hours of work for our crew. The price below covers transportation from our Manahawkin location, planting, staking, and initial watering. We recommend our Premium Palm Fertilizer as well.",
      estimatedPrice: 450.0,
      createdAt: daysAgo(5),
      updatedAt: daysAgo(3),
    },
    {
      id: "quote-003",
      userId: JOHN_UID,
      userEmail: "john@example.com",
      userName: "John Rivera",
      serviceType: "bulk_order",
      description:
        "I manage a commercial property and need 20 Pygmy Date Palms and 10 Bird of Paradise plants for our lobby and outdoor areas. Looking for a bulk discount.",
      photos: [],
      contactPreference: "either" as const,
      phone: "(516) 555-0102",
      status: "accepted" as const,
      adminResponse:
        "Great news, John! We can offer a 15% bulk discount on this order. That brings the total to $3,824.85 for 20 Pygmy Date Palms (Medium) and 10 Bird of Paradise (Large). Delivery and installation included. We can schedule delivery for next Tuesday.",
      estimatedPrice: 3824.85,
      createdAt: daysAgo(10),
      updatedAt: daysAgo(6),
    },
  ];

  const batch = db.batch();
  for (const q of quotes) {
    const { id, ...data } = q;
    batch.set(db.collection("quotes").doc(id), data);
  }
  await batch.commit();
  console.log(`  Created ${quotes.length} quotes`);
}

// ─── Wishlist (subcollection) ────────────────────────────────
async function seedWishlists() {
  console.log("Seeding wishlists...");

  const batch = db.batch();

  batch.set(
    db.collection("users").doc(JOHN_UID).collection("wishlist").doc(PID.canaryPalm),
    {
      productId: PID.canaryPalm,
      productName: "Canary Island Date Palm",
      productImage: "https://placehold.co/400x400/2d5016/white?text=Canary+Palm",
      addedAt: daysAgo(20),
    }
  );

  batch.set(
    db.collection("users").doc(JOHN_UID).collection("wishlist").doc(PID.japanesemaple),
    {
      productId: PID.japanesemaple,
      productName: "Japanese Maple",
      productImage: "https://placehold.co/400x400/6b1a6b/white?text=Japanese+Maple",
      addedAt: daysAgo(15),
    }
  );

  await batch.commit();
  console.log("  Created 2 wishlist items (john)");
}

// ─── Notifications ───────────────────────────────────────────
async function seedNotifications() {
  console.log("Seeding notifications...");

  const batch = db.batch();

  batch.set(db.collection("notifications").doc("notif-001"), {
    title: "Spring Sale is Here!",
    body: "Get 20% off all Palm Trees this weekend. Use code SPRING20 at checkout. Limited time offer!",
    type: "promotion",
    data: { promoCode: "SPRING20", discount: "20" },
    targetUserIds: [],
    broadcast: true,
    sentAt: daysAgo(1),
    sentBy: ADMIN_UID,
  });

  batch.set(db.collection("notifications").doc("notif-002"), {
    title: "Your order is being prepared",
    body: "Order #002 is now being prepared at our Hicksville farm. We'll notify you when it ships!",
    type: "order_update",
    data: { orderId: "order-002", status: "preparing" },
    targetUserIds: [JOHN_UID],
    broadcast: false,
    sentAt: daysAgo(2),
    sentBy: ADMIN_UID,
  });

  await batch.commit();
  console.log("  Created 2 notifications");
}

// ─── Analytics ───────────────────────────────────────────────
async function seedAnalytics() {
  console.log("Seeding analytics (last 7 days)...");

  const batch = db.batch();

  const dailyData = [
    { daysBack: 7, revenue: 1247.98, orderCount: 4, newCustomers: 2, avgOrder: 311.99 },
    { daysBack: 6, revenue: 879.96, orderCount: 3, newCustomers: 1, avgOrder: 293.32 },
    { daysBack: 5, revenue: 2159.94, orderCount: 6, newCustomers: 3, avgOrder: 360.0 },
    { daysBack: 4, revenue: 3199.92, orderCount: 8, newCustomers: 2, avgOrder: 400.0 },
    { daysBack: 3, revenue: 1549.95, orderCount: 5, newCustomers: 1, avgOrder: 310.0 },
    { daysBack: 2, revenue: 899.97, orderCount: 2, newCustomers: 0, avgOrder: 450.0 },
    { daysBack: 1, revenue: 2499.93, orderCount: 7, newCustomers: 4, avgOrder: 357.13 },
  ];

  const topProductSets = [
    [
      { productId: PID.canaryPalm, productName: "Canary Island Date Palm", quantity: 3 },
      { productId: PID.pygmyPalm, productName: "Pygmy Date Palm", quantity: 2 },
      { productId: PID.fertilizer, productName: "Premium Palm Fertilizer", quantity: 5 },
    ],
    [
      { productId: PID.birdOfParadise, productName: "Bird of Paradise", quantity: 4 },
      { productId: PID.monstera, productName: "Monstera Deliciosa", quantity: 3 },
    ],
    [
      { productId: PID.windmillPalm, productName: "Windmill Palm", quantity: 5 },
      { productId: PID.meyerLemon, productName: "Meyer Lemon Tree", quantity: 3 },
      { productId: PID.aloe, productName: "Aloe Vera", quantity: 6 },
    ],
    [
      { productId: PID.canaryPalm, productName: "Canary Island Date Palm", quantity: 6 },
      { productId: PID.japanesemaple, productName: "Japanese Maple", quantity: 4 },
      { productId: PID.agave, productName: "Agave Blue Glow", quantity: 3 },
    ],
    [
      { productId: PID.pygmyPalm, productName: "Pygmy Date Palm", quantity: 4 },
      { productId: PID.plumeria, productName: "Plumeria", quantity: 2 },
    ],
    [
      { productId: PID.avocado, productName: "Avocado Tree", quantity: 2 },
      { productId: PID.meyerLemon, productName: "Meyer Lemon Tree", quantity: 1 },
    ],
    [
      { productId: PID.canaryPalm, productName: "Canary Island Date Palm", quantity: 5 },
      { productId: PID.birdOfParadise, productName: "Bird of Paradise", quantity: 4 },
      { productId: PID.windmillPalm, productName: "Windmill Palm", quantity: 3 },
    ],
  ];

  for (let i = 0; i < dailyData.length; i++) {
    const d = dailyData[i];
    const date = new Date();
    date.setDate(date.getDate() - d.daysBack);
    const dateStr = date.toISOString().split("T")[0];

    batch.set(db.collection("analytics").doc(dateStr), {
      date: dateStr,
      revenue: d.revenue,
      orderCount: d.orderCount,
      newCustomers: d.newCustomers,
      topProducts: topProductSets[i],
      averageOrderValue: d.avgOrder,
    });
  }

  await batch.commit();
  console.log("  Created 7 analytics entries");
}

// ─── Main ────────────────────────────────────────────────────
async function main() {
  console.log("=== Seeding Firebase Emulators ===\n");

  try {
    await seedAuth();
    await seedCategories();
    await seedStores();
    await seedProducts();
    await seedUsers();
    await seedOrders();
    await seedCarts();
    await seedQuotes();
    await seedWishlists();
    await seedNotifications();
    await seedAnalytics();

    console.log("\n=== Seeding complete! ===");
    console.log("Open http://localhost:4000 to view the Emulator UI");
  } catch (err) {
    console.error("\nSeeding failed:", err);
    process.exit(1);
  }
}

main();
