/**
 * Seed script for PostgreSQL via Prisma.
 *
 * Populates the database with realistic sample data for local development.
 * Run: pnpm db:seed  (from apps/api, or pnpm db:seed from root)
 */

import { PrismaClient, UserRole, OrderStatus, QuoteStatus, ServiceType, NotificationType } from "@prisma/client";
import { hashPassword } from "../src/utils/password.js";

const prisma = new PrismaClient();

// ─── Helpers ─────────────────────────────────────────────────

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(12, 0, 0, 0);
  return d;
}

// ─── Main ────────────────────────────────────────────────────

async function main() {
  console.log("=== Seeding PostgreSQL Database ===\n");

  // ─── Users ──────────────────────────────────────────────
  console.log("Seeding users...");

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@gopalmtrees.com" },
    update: {},
    create: {
      email: "admin@gopalmtrees.com",
      passwordHash: await hashPassword("admin123"),
      displayName: "Palm Admin",
      phone: "(516) 555-0001",
      role: UserRole.admin,
      notificationPreferences: {
        create: {
          orderUpdates: true,
          promotions: false,
          quoteResponses: true,
        },
      },
      createdAt: daysAgo(120),
    },
  });
  console.log(`  Created user: ${adminUser.email}`);

  const johnUser = await prisma.user.upsert({
    where: { email: "john@example.com" },
    update: {},
    create: {
      email: "john@example.com",
      passwordHash: await hashPassword("test1234"),
      displayName: "John Rivera",
      phone: "(516) 555-0102",
      role: UserRole.customer,
      notificationPreferences: {
        create: {
          orderUpdates: true,
          promotions: true,
          quoteResponses: true,
        },
      },
      addresses: {
        create: [
          {
            label: "Home",
            street: "123 Maple Street",
            unit: "Apt 4B",
            city: "Hicksville",
            state: "NY",
            zip: "11801",
            isDefault: true,
          },
          {
            label: "Office",
            street: "456 Corporate Blvd",
            city: "Garden City",
            state: "NY",
            zip: "11530",
            isDefault: false,
          },
        ],
      },
      createdAt: daysAgo(60),
    },
  });
  console.log(`  Created user: ${johnUser.email}`);

  const sarahUser = await prisma.user.upsert({
    where: { email: "sarah@example.com" },
    update: {},
    create: {
      email: "sarah@example.com",
      passwordHash: await hashPassword("test1234"),
      displayName: "Sarah Chen",
      phone: "(609) 555-0203",
      role: UserRole.customer,
      notificationPreferences: {
        create: {
          orderUpdates: true,
          promotions: true,
          quoteResponses: true,
        },
      },
      addresses: {
        create: [
          {
            label: "Home",
            street: "789 Ocean Avenue",
            city: "Manahawkin",
            state: "NJ",
            zip: "08050",
            isDefault: true,
          },
        ],
      },
      createdAt: daysAgo(30),
    },
  });
  console.log(`  Created user: ${sarahUser.email}`);

  // ─── Categories ────────────────────────────────────────────
  console.log("Seeding categories...");

  const categories = [
    { name: "Palm Trees", slug: "palm-trees", description: "Beautiful palm trees to bring a tropical feel to your landscape.", imageURL: "https://placehold.co/600x400/2d5016/white?text=Palm+Trees", sortOrder: 1 },
    { name: "Tropical Plants", slug: "tropical-plants", description: "Lush tropical plants that thrive in warm environments.", imageURL: "https://placehold.co/600x400/1a6b3c/white?text=Tropical+Plants", sortOrder: 2 },
    { name: "Fruit Trees", slug: "fruit-trees", description: "Grow your own fresh fruit with our selection of fruit trees.", imageURL: "https://placehold.co/600x400/8b6914/white?text=Fruit+Trees", sortOrder: 3 },
    { name: "Exotic Plants", slug: "exotic-plants", description: "Rare and exotic plants to make your garden stand out.", imageURL: "https://placehold.co/600x400/6b1a6b/white?text=Exotic+Plants", sortOrder: 4 },
    { name: "Succulents", slug: "succulents", description: "Low-maintenance succulents perfect for any space.", imageURL: "https://placehold.co/600x400/3c8b6b/white?text=Succulents", sortOrder: 5 },
    { name: "Garden Supplies", slug: "garden-supplies", description: "Everything you need to keep your plants healthy and thriving.", imageURL: "https://placehold.co/600x400/8b4513/white?text=Garden+Supplies", sortOrder: 6 },
  ];

  const catMap: Record<string, string> = {};
  for (const cat of categories) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    catMap[cat.slug] = created.id;
  }
  console.log(`  Created ${categories.length} categories`);

  // ─── Products ──────────────────────────────────────────────
  console.log("Seeding products...");

  const productData = [
    {
      name: "Canary Island Date Palm",
      slug: "canary-island-date-palm",
      description: "The Canary Island Date Palm (Phoenix canariensis) is a majestic, slow-growing palm known for its thick trunk and graceful crown of arching fronds. A stunning focal point for any landscape.",
      categorySlug: "palm-trees",
      images: ["https://placehold.co/800x600/2d5016/white?text=Canary+Palm+1", "https://placehold.co/800x600/2d5016/white?text=Canary+Palm+2"],
      thumbnailURL: "https://placehold.co/400x400/2d5016/white?text=Canary+Palm",
      sizes: [
        { label: "Small", height: "3-4 ft", price: 149.99, stock: 12, sku: "CIP-SM-001" },
        { label: "Medium", height: "5-7 ft", price: 299.99, stock: 8, sku: "CIP-MD-001" },
        { label: "Large", height: "8-10 ft", price: 499.99, stock: 4, sku: "CIP-LG-001" },
      ],
      careSunlight: "Full sun",
      careWater: "Moderate; water deeply once per week",
      careTemperature: "Hardy to 20°F (-6°C)",
      careSoil: "Well-draining sandy or loamy soil",
      careTips: ["Fertilize 3 times a year with palm-specific fertilizer", "Remove dead fronds to maintain appearance", "Protect from hard freezes when young"],
      tags: ["palm", "tropical", "landscape", "cold-hardy"],
      featured: true,
      seasonalOnly: false,
      createdAt: daysAgo(90),
    },
    {
      name: "Pygmy Date Palm",
      slug: "pygmy-date-palm",
      description: "The Pygmy Date Palm (Phoenix roebelenii) is a compact, elegant palm perfect for smaller spaces. Its soft, feathery fronds create a lush tropical look.",
      categorySlug: "palm-trees",
      images: ["https://placehold.co/800x600/2d5016/white?text=Pygmy+Palm+1", "https://placehold.co/800x600/2d5016/white?text=Pygmy+Palm+2"],
      thumbnailURL: "https://placehold.co/400x400/2d5016/white?text=Pygmy+Palm",
      sizes: [
        { label: "Small", height: "2-3 ft", price: 79.99, stock: 20, sku: "PDP-SM-001" },
        { label: "Medium", height: "3-4 ft", price: 129.99, stock: 15, sku: "PDP-MD-001" },
        { label: "Large", height: "5-6 ft", price: 199.99, stock: 8, sku: "PDP-LG-001" },
      ],
      careSunlight: "Partial to full sun",
      careWater: "Regular watering; keep soil slightly moist",
      careTemperature: "Hardy to 30°F (-1°C)",
      careSoil: "Rich, well-draining potting mix",
      careTips: ["Great for containers and indoor spaces", "Mist leaves occasionally in dry environments", "Fertilize monthly during growing season"],
      tags: ["palm", "tropical", "indoor", "compact"],
      featured: true,
      seasonalOnly: false,
      createdAt: daysAgo(85),
    },
    {
      name: "Windmill Palm",
      slug: "windmill-palm",
      description: "The Windmill Palm (Trachycarpus fortunei) is one of the hardiest palms available, able to withstand cold temperatures and snow. Its distinctive hairy trunk and fan-shaped fronds make it a unique addition.",
      categorySlug: "palm-trees",
      images: ["https://placehold.co/800x600/2d5016/white?text=Windmill+Palm+1", "https://placehold.co/800x600/2d5016/white?text=Windmill+Palm+2", "https://placehold.co/800x600/2d5016/white?text=Windmill+Palm+3"],
      thumbnailURL: "https://placehold.co/400x400/2d5016/white?text=Windmill+Palm",
      sizes: [
        { label: "Small", height: "3-4 ft", price: 119.99, stock: 15, sku: "WMP-SM-001" },
        { label: "Medium", height: "5-6 ft", price: 229.99, stock: 10, sku: "WMP-MD-001" },
        { label: "Large", height: "7-9 ft", price: 399.99, stock: 5, sku: "WMP-LG-001" },
      ],
      careSunlight: "Full sun to partial shade",
      careWater: "Moderate; drought tolerant once established",
      careTemperature: "Hardy to 5°F (-15°C)",
      careSoil: "Well-draining; tolerates various soil types",
      careTips: ["Most cold-hardy palm available", "Wrap trunk in burlap during extreme cold snaps", "Slow growing — patience is rewarded"],
      tags: ["palm", "cold-hardy", "landscape", "fan-palm"],
      featured: false,
      seasonalOnly: false,
      createdAt: daysAgo(80),
    },
    {
      name: "Bird of Paradise",
      slug: "bird-of-paradise",
      description: "The Bird of Paradise (Strelitzia reginae) produces striking orange and blue flowers that resemble tropical birds in flight. A dramatic accent plant for gardens and interiors.",
      categorySlug: "tropical-plants",
      images: ["https://placehold.co/800x600/1a6b3c/white?text=Bird+of+Paradise+1", "https://placehold.co/800x600/1a6b3c/white?text=Bird+of+Paradise+2"],
      thumbnailURL: "https://placehold.co/400x400/1a6b3c/white?text=Bird+of+Paradise",
      sizes: [
        { label: "Small", height: "1-2 ft", price: 39.99, stock: 25, sku: "BOP-SM-001" },
        { label: "Medium", height: "3-4 ft", price: 89.99, stock: 15, sku: "BOP-MD-001" },
        { label: "Large", height: "5-6 ft", price: 159.99, stock: 8, sku: "BOP-LG-001" },
      ],
      careSunlight: "Full sun to partial shade",
      careWater: "Regular watering; allow top soil to dry between waterings",
      careTemperature: "Hardy to 25°F (-4°C)",
      careSoil: "Rich, well-draining soil",
      careTips: ["Blooms best in full sun", "Divide clumps every 5 years for best flowering", "Makes an excellent indoor plant in bright light"],
      tags: ["tropical", "flowering", "indoor", "accent"],
      featured: true,
      seasonalOnly: false,
      createdAt: daysAgo(75),
    },
    {
      name: "Monstera Deliciosa",
      slug: "monstera-deliciosa",
      description: "The Monstera Deliciosa, or Swiss Cheese Plant, is beloved for its large, glossy, perforated leaves. A trendy and easy-to-care-for tropical houseplant.",
      categorySlug: "tropical-plants",
      images: ["https://placehold.co/800x600/1a6b3c/white?text=Monstera+1", "https://placehold.co/800x600/1a6b3c/white?text=Monstera+2"],
      thumbnailURL: "https://placehold.co/400x400/1a6b3c/white?text=Monstera",
      sizes: [
        { label: "Small", height: "1-2 ft", price: 34.99, stock: 30, sku: "MON-SM-001" },
        { label: "Medium", height: "2-3 ft", price: 69.99, stock: 18, sku: "MON-MD-001" },
        { label: "Large", height: "4-5 ft", price: 119.99, stock: 10, sku: "MON-LG-001" },
      ],
      careSunlight: "Bright indirect light",
      careWater: "Water when top 2 inches of soil are dry",
      careTemperature: "60-85°F (15-29°C)",
      careSoil: "Peat-based well-draining mix",
      careTips: ["Provide a moss pole for climbing support", "Wipe leaves with a damp cloth to remove dust", "Toxic to pets — keep out of reach"],
      tags: ["tropical", "indoor", "houseplant", "trendy"],
      featured: false,
      seasonalOnly: false,
      createdAt: daysAgo(70),
    },
    {
      name: "Meyer Lemon Tree",
      slug: "meyer-lemon-tree",
      description: "The Meyer Lemon Tree produces sweet, thin-skinned lemons that are a cross between a lemon and a mandarin orange. Perfect for patios, gardens, or growing indoors.",
      categorySlug: "fruit-trees",
      images: ["https://placehold.co/800x600/8b6914/white?text=Meyer+Lemon+1", "https://placehold.co/800x600/8b6914/white?text=Meyer+Lemon+2"],
      thumbnailURL: "https://placehold.co/400x400/8b6914/white?text=Meyer+Lemon",
      sizes: [
        { label: "Small", height: "1-2 ft", price: 49.99, stock: 20, sku: "MLT-SM-001" },
        { label: "Medium", height: "3-4 ft", price: 99.99, stock: 12, sku: "MLT-MD-001" },
        { label: "Large", height: "5-6 ft", price: 179.99, stock: 6, sku: "MLT-LG-001" },
      ],
      careSunlight: "Full sun (6-8 hours)",
      careWater: "Regular; keep soil consistently moist but not soggy",
      careTemperature: "Hardy to 28°F (-2°C)",
      careSoil: "Slightly acidic, well-draining citrus mix",
      careTips: ["Bring indoors when temperatures drop below 28°F", "Fertilize with citrus-specific fertilizer every 4-6 weeks", "Prune to maintain shape and encourage fruiting"],
      tags: ["fruit", "citrus", "indoor", "edible"],
      featured: true,
      seasonalOnly: false,
      createdAt: daysAgo(65),
    },
    {
      name: "Avocado Tree",
      slug: "avocado-tree",
      description: "Grow your own avocados at home! Our grafted Avocado Trees produce fruit much sooner than seed-grown varieties. A rewarding addition to warm-climate gardens.",
      categorySlug: "fruit-trees",
      images: ["https://placehold.co/800x600/8b6914/white?text=Avocado+Tree+1", "https://placehold.co/800x600/8b6914/white?text=Avocado+Tree+2"],
      thumbnailURL: "https://placehold.co/400x400/8b6914/white?text=Avocado+Tree",
      sizes: [
        { label: "Small", height: "2-3 ft", price: 59.99, stock: 15, sku: "AVO-SM-001" },
        { label: "Medium", height: "4-5 ft", price: 129.99, stock: 8, sku: "AVO-MD-001" },
      ],
      careSunlight: "Full sun",
      careWater: "Deep watering 2-3 times per week",
      careTemperature: "Hardy to 32°F (0°C)",
      careSoil: "Well-draining, slightly acidic soil",
      careTips: ["Grafted varieties fruit in 2-3 years vs 10+ from seed", "Protect from frost with covers in winter", "Mulch around base to retain moisture"],
      tags: ["fruit", "edible", "tropical", "grafted"],
      featured: false,
      seasonalOnly: true,
      createdAt: daysAgo(60),
    },
    {
      name: "Plumeria",
      slug: "plumeria",
      description: "Plumeria, also known as Frangipani, produces intensely fragrant flowers in shades of white, yellow, pink, and red. The iconic flower of Hawaiian leis.",
      categorySlug: "exotic-plants",
      images: ["https://placehold.co/800x600/6b1a6b/white?text=Plumeria+1", "https://placehold.co/800x600/6b1a6b/white?text=Plumeria+2"],
      thumbnailURL: "https://placehold.co/400x400/6b1a6b/white?text=Plumeria",
      sizes: [
        { label: "Small", height: "1-2 ft", price: 44.99, stock: 18, sku: "PLU-SM-001" },
        { label: "Medium", height: "3-4 ft", price: 89.99, stock: 10, sku: "PLU-MD-001" },
        { label: "Large", height: "5-6 ft", price: 149.99, stock: 5, sku: "PLU-LG-001" },
      ],
      careSunlight: "Full sun (at least 6 hours)",
      careWater: "Moderate; reduce in winter dormancy",
      careTemperature: "Hardy to 33°F (1°C)",
      careSoil: "Well-draining, slightly acidic",
      careTips: ["Goes dormant in winter and loses leaves — this is normal", "Bring indoors before first frost", "Avoid overwatering to prevent root rot"],
      tags: ["exotic", "flowering", "fragrant", "tropical"],
      featured: false,
      seasonalOnly: true,
      createdAt: daysAgo(55),
    },
    {
      name: "Japanese Maple",
      slug: "japanese-maple",
      description: "The Japanese Maple (Acer palmatum) is prized for its stunning, delicate foliage that turns brilliant shades of red, orange, and gold in autumn. An elegant specimen tree.",
      categorySlug: "exotic-plants",
      images: ["https://placehold.co/800x600/6b1a6b/white?text=Japanese+Maple+1", "https://placehold.co/800x600/6b1a6b/white?text=Japanese+Maple+2", "https://placehold.co/800x600/6b1a6b/white?text=Japanese+Maple+3"],
      thumbnailURL: "https://placehold.co/400x400/6b1a6b/white?text=Japanese+Maple",
      sizes: [
        { label: "Small", height: "2-3 ft", price: 89.99, stock: 12, sku: "JMP-SM-001" },
        { label: "Medium", height: "4-5 ft", price: 179.99, stock: 7, sku: "JMP-MD-001" },
        { label: "Large", height: "6-8 ft", price: 349.99, stock: 3, sku: "JMP-LG-001" },
      ],
      careSunlight: "Partial shade; protect from harsh afternoon sun",
      careWater: "Regular; keep soil consistently moist",
      careTemperature: "Hardy to -10°F (-23°C)",
      careSoil: "Acidic, well-draining, rich in organic matter",
      careTips: ["Mulch heavily to protect shallow roots", "Avoid heavy pruning — light shaping only", "Stunning fall color makes it a landscape centerpiece"],
      tags: ["exotic", "ornamental", "deciduous", "fall-color"],
      featured: true,
      seasonalOnly: false,
      createdAt: daysAgo(50),
    },
    {
      name: "Agave Blue Glow",
      slug: "agave-blue-glow",
      description: "Agave 'Blue Glow' is a stunning hybrid succulent with smooth, blue-green leaves edged in red and gold. A slow-growing, architectural accent plant.",
      categorySlug: "succulents",
      images: ["https://placehold.co/800x600/3c8b6b/white?text=Agave+Blue+Glow+1", "https://placehold.co/800x600/3c8b6b/white?text=Agave+Blue+Glow+2"],
      thumbnailURL: "https://placehold.co/400x400/3c8b6b/white?text=Agave+Blue+Glow",
      sizes: [
        { label: "Small", height: "6-8 in", price: 24.99, stock: 35, sku: "ABG-SM-001" },
        { label: "Medium", height: "12-16 in", price: 49.99, stock: 20, sku: "ABG-MD-001" },
        { label: "Large", height: "18-24 in", price: 89.99, stock: 10, sku: "ABG-LG-001" },
      ],
      careSunlight: "Full sun",
      careWater: "Very low; water every 2-3 weeks in summer",
      careTemperature: "Hardy to 25°F (-4°C)",
      careSoil: "Fast-draining cactus/succulent mix",
      careTips: ["Extremely drought tolerant once established", "Protect from prolonged freezing temperatures", "Handle with care — leaf tips are sharp"],
      tags: ["succulent", "drought-tolerant", "architectural", "low-maintenance"],
      featured: false,
      seasonalOnly: false,
      createdAt: daysAgo(45),
    },
    {
      name: "Aloe Vera",
      slug: "aloe-vera",
      description: "Aloe Vera is a versatile succulent known for its medicinal gel. Easy to grow indoors or out, it's both beautiful and practical.",
      categorySlug: "succulents",
      images: ["https://placehold.co/800x600/3c8b6b/white?text=Aloe+Vera+1", "https://placehold.co/800x600/3c8b6b/white?text=Aloe+Vera+2"],
      thumbnailURL: "https://placehold.co/400x400/3c8b6b/white?text=Aloe+Vera",
      sizes: [
        { label: "Small", height: "4-6 in", price: 19.99, stock: 40, sku: "ALV-SM-001" },
        { label: "Medium", height: "8-12 in", price: 34.99, stock: 25, sku: "ALV-MD-001" },
      ],
      careSunlight: "Bright indirect light to full sun",
      careWater: "Low; water when soil is completely dry",
      careTemperature: "Hardy to 40°F (4°C)",
      careSoil: "Sandy, well-draining cactus mix",
      careTips: ["Gel inside leaves soothes minor burns and skin irritation", "Overwatering is the #1 cause of aloe death", "Produces offsets (pups) that can be separated and repotted"],
      tags: ["succulent", "medicinal", "indoor", "beginner-friendly"],
      featured: false,
      seasonalOnly: false,
      createdAt: daysAgo(40),
    },
    {
      name: "Premium Palm Fertilizer",
      slug: "premium-palm-fertilizer",
      description: "Our specially formulated palm fertilizer provides the perfect blend of nitrogen, potassium, and micronutrients that palms and tropical plants need to thrive. 8-2-12 formula with slow-release granules.",
      categorySlug: "garden-supplies",
      images: ["https://placehold.co/800x600/8b4513/white?text=Palm+Fertilizer+1", "https://placehold.co/800x600/8b4513/white?text=Palm+Fertilizer+2"],
      thumbnailURL: "https://placehold.co/400x400/8b4513/white?text=Palm+Fertilizer",
      sizes: [
        { label: "5 lb Bag", height: "N/A", price: 19.99, stock: 50, sku: "PPF-SM-001" },
        { label: "10 lb Bag", height: "N/A", price: 34.99, stock: 30, sku: "PPF-MD-001" },
        { label: "25 lb Bag", height: "N/A", price: 69.99, stock: 15, sku: "PPF-LG-001" },
      ],
      careSunlight: "N/A",
      careWater: "Water in after applying",
      careTemperature: "Store in cool, dry place",
      careSoil: "Apply to surface around drip line",
      careTips: ["Apply every 3 months during growing season", "Use 1 lb per inch of trunk diameter", "Keep away from direct trunk contact"],
      tags: ["supplies", "fertilizer", "palm-care", "slow-release"],
      featured: false,
      seasonalOnly: false,
      createdAt: daysAgo(35),
    },
  ];

  const productMap: Record<string, string> = {};
  for (const p of productData) {
    const { images, sizes, careTips, tags, categorySlug, ...rest } = p;
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        ...rest,
        categoryId: catMap[categorySlug],
        images: { create: images.map((url, i) => ({ url, sortOrder: i })) },
        sizes: { create: sizes },
        tags: { create: tags.map((tag) => ({ tag })) },
        careTips: { create: careTips.map((tip, i) => ({ tip, sortOrder: i })) },
      },
    });
    productMap[p.slug] = product.id;
  }
  console.log(`  Created ${productData.length} products`);

  // ─── Store Locations ──────────────────────────────────────
  console.log("Seeding stores...");

  const defaultHours = [
    { day: "Monday", open: "9:00 AM", close: "6:00 PM", closed: false },
    { day: "Tuesday", open: "9:00 AM", close: "6:00 PM", closed: false },
    { day: "Wednesday", open: "9:00 AM", close: "6:00 PM", closed: false },
    { day: "Thursday", open: "9:00 AM", close: "6:00 PM", closed: false },
    { day: "Friday", open: "9:00 AM", close: "6:00 PM", closed: false },
    { day: "Saturday", open: "9:00 AM", close: "5:00 PM", closed: false },
    { day: "Sunday", open: "", close: "", closed: true },
  ];

  const storeLocations = [
    { name: "Go Palm Trees - Hicksville", address: "388 S Broadway", city: "Hicksville", state: "NY", zip: "11801", phone: "(516) 822-7256", latitude: 40.7632, longitude: -73.525 },
    { name: "Go Palm Trees - Island Park", address: "4177 Austin Blvd", city: "Island Park", state: "NY", zip: "11558", phone: "(516) 889-3961", latitude: 40.6043, longitude: -73.6554 },
    { name: "Go Palm Trees - Dix Hills", address: "547 E Deer Park Rd", city: "Dix Hills", state: "NY", zip: "11746", phone: "(631) 242-7256", latitude: 40.8051, longitude: -73.3243 },
    { name: "Go Palm Trees - Manahawkin", address: "657 E Bay Ave", city: "Manahawkin", state: "NJ", zip: "08050", phone: "(609) 597-7256", latitude: 39.6932, longitude: -74.2585 },
  ];

  for (const loc of storeLocations) {
    await prisma.storeLocation.create({
      data: {
        ...loc,
        hours: defaultHours,
        imageURL: `https://placehold.co/800x400/2d5016/white?text=${encodeURIComponent(loc.city)}`,
        active: true,
      },
    });
  }
  console.log(`  Created ${storeLocations.length} stores`);

  // ─── Orders ───────────────────────────────────────────────
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
    {
      userId: johnUser.id,
      userEmail: "john@example.com",
      items: [
        { productId: productMap["pygmy-date-palm"], productName: "Pygmy Date Palm", productImage: "https://placehold.co/400x400/2d5016/white?text=Pygmy+Palm", sizeId: "md", sizeLabel: "Medium", price: 129.99, quantity: 1 },
        { productId: productMap["premium-palm-fertilizer"], productName: "Premium Palm Fertilizer", productImage: "https://placehold.co/400x400/8b4513/white?text=Palm+Fertilizer", sizeId: "sm", sizeLabel: "5 lb Bag", price: 19.99, quantity: 2 },
      ],
      subtotal: 169.97,
      tax: 13.6,
      deliveryFee: 0,
      total: 183.57,
      shippingAddress: johnAddress,
      statusHistory: [{ status: "confirmed", timestamp: daysAgo(0).toISOString(), note: "Payment received" }],
      currentStatus: OrderStatus.confirmed,
      stripePaymentIntentId: "pi_seed_001",
      createdAt: daysAgo(0),
    },
    {
      userId: johnUser.id,
      userEmail: "john@example.com",
      items: [
        { productId: productMap["bird-of-paradise"], productName: "Bird of Paradise", productImage: "https://placehold.co/400x400/1a6b3c/white?text=Bird+of+Paradise", sizeId: "lg", sizeLabel: "Large", price: 159.99, quantity: 1 },
      ],
      subtotal: 159.99,
      tax: 12.8,
      deliveryFee: 0,
      total: 172.79,
      shippingAddress: johnAddress,
      statusHistory: [
        { status: "confirmed", timestamp: daysAgo(3).toISOString(), note: "Payment received" },
        { status: "preparing", timestamp: daysAgo(2).toISOString(), note: "Being prepared at our Hicksville farm" },
      ],
      currentStatus: OrderStatus.preparing,
      stripePaymentIntentId: "pi_seed_002",
      createdAt: daysAgo(3),
    },
    {
      userId: johnUser.id,
      userEmail: "john@example.com",
      items: [
        { productId: productMap["canary-island-date-palm"], productName: "Canary Island Date Palm", productImage: "https://placehold.co/400x400/2d5016/white?text=Canary+Palm", sizeId: "lg", sizeLabel: "Large", price: 499.99, quantity: 1 },
        { productId: productMap["agave-blue-glow"], productName: "Agave Blue Glow", productImage: "https://placehold.co/400x400/3c8b6b/white?text=Agave+Blue+Glow", sizeId: "md", sizeLabel: "Medium", price: 49.99, quantity: 2 },
      ],
      subtotal: 599.97,
      tax: 48.0,
      deliveryFee: 0,
      total: 647.97,
      shippingAddress: johnAddress,
      deliveryDate: daysAgo(7),
      statusHistory: [
        { status: "confirmed", timestamp: daysAgo(14).toISOString(), note: "Payment received" },
        { status: "preparing", timestamp: daysAgo(12).toISOString(), note: "Being prepared at our Hicksville farm" },
        { status: "in_transit", timestamp: daysAgo(8).toISOString(), note: "On the delivery truck" },
        { status: "delivered", timestamp: daysAgo(7).toISOString(), note: "Delivered to front door" },
      ],
      currentStatus: OrderStatus.delivered,
      stripePaymentIntentId: "pi_seed_003",
      createdAt: daysAgo(14),
    },
    {
      userId: johnUser.id,
      userEmail: "john@example.com",
      items: [
        { productId: productMap["meyer-lemon-tree"], productName: "Meyer Lemon Tree", productImage: "https://placehold.co/400x400/8b6914/white?text=Meyer+Lemon", sizeId: "md", sizeLabel: "Medium", price: 99.99, quantity: 1 },
      ],
      subtotal: 99.99,
      tax: 8.0,
      deliveryFee: 0,
      total: 107.99,
      shippingAddress: johnAddress,
      statusHistory: [
        { status: "confirmed", timestamp: daysAgo(10).toISOString(), note: "Payment received" },
        { status: "cancelled", timestamp: daysAgo(9).toISOString(), note: "Customer requested cancellation" },
        { status: "refunded", timestamp: daysAgo(8).toISOString(), note: "Full refund issued" },
      ],
      currentStatus: OrderStatus.refunded,
      stripePaymentIntentId: "pi_seed_004",
      refundId: "re_seed_004",
      refundAmount: 107.99,
      createdAt: daysAgo(10),
    },
  ];

  for (const order of orders) {
    await prisma.order.create({ data: order });
  }
  console.log(`  Created ${orders.length} orders`);

  // ─── Cart ─────────────────────────────────────────────────
  console.log("Seeding carts...");

  await prisma.cart.create({
    data: {
      userId: sarahUser.id,
      items: {
        create: [
          { productId: productMap["monstera-deliciosa"], productName: "Monstera Deliciosa", productImage: "https://placehold.co/400x400/1a6b3c/white?text=Monstera", sizeId: "md", sizeLabel: "Medium", price: 69.99, quantity: 1 },
          { productId: productMap["aloe-vera"], productName: "Aloe Vera", productImage: "https://placehold.co/400x400/3c8b6b/white?text=Aloe+Vera", sizeId: "sm", sizeLabel: "Small", price: 19.99, quantity: 3 },
        ],
      },
    },
  });
  console.log("  Created 1 cart (sarah)");

  // ─── Quotes ───────────────────────────────────────────────
  console.log("Seeding quotes...");

  const quotes = [
    {
      userId: johnUser.id,
      userEmail: "john@example.com",
      userName: "John Rivera",
      serviceType: ServiceType.landscape_design,
      description: "I'd like a full tropical landscape design for my backyard. About 2,000 sq ft area. Looking for a mix of palms, tropical plants, and a small water feature. Would love to see a 3D rendering before committing.",
      photos: [],
      contactPreference: "email",
      phone: "(516) 555-0102",
      status: QuoteStatus.pending,
      createdAt: daysAgo(2),
    },
    {
      userId: sarahUser.id,
      userEmail: "sarah@example.com",
      userName: "Sarah Chen",
      serviceType: ServiceType.installation,
      description: "Need 3 large Windmill Palms installed in my front yard. The holes are already dug. Just need professional planting and staking. Address is 789 Ocean Avenue, Manahawkin, NJ.",
      photos: [],
      contactPreference: "phone",
      phone: "(609) 555-0203",
      status: QuoteStatus.estimated,
      adminResponse: "Hi Sarah! We can definitely help with the palm installation. Based on your description, we estimate 2-3 hours of work for our crew. The price below covers transportation from our Manahawkin location, planting, staking, and initial watering. We recommend our Premium Palm Fertilizer as well.",
      estimatedPrice: 450.0,
      createdAt: daysAgo(5),
    },
    {
      userId: johnUser.id,
      userEmail: "john@example.com",
      userName: "John Rivera",
      serviceType: ServiceType.bulk_order,
      description: "I manage a commercial property and need 20 Pygmy Date Palms and 10 Bird of Paradise plants for our lobby and outdoor areas. Looking for a bulk discount.",
      photos: [],
      contactPreference: "either",
      phone: "(516) 555-0102",
      status: QuoteStatus.accepted,
      adminResponse: "Great news, John! We can offer a 15% bulk discount on this order. That brings the total to $3,824.85 for 20 Pygmy Date Palms (Medium) and 10 Bird of Paradise (Large). Delivery and installation included. We can schedule delivery for next Tuesday.",
      estimatedPrice: 3824.85,
      createdAt: daysAgo(10),
    },
  ];

  for (const q of quotes) {
    await prisma.quote.create({ data: q });
  }
  console.log(`  Created ${quotes.length} quotes`);

  // ─── Wishlist ─────────────────────────────────────────────
  console.log("Seeding wishlists...");

  await prisma.wishlistItem.create({
    data: {
      userId: johnUser.id,
      productId: productMap["canary-island-date-palm"],
      productName: "Canary Island Date Palm",
      productImage: "https://placehold.co/400x400/2d5016/white?text=Canary+Palm",
      addedAt: daysAgo(20),
    },
  });
  await prisma.wishlistItem.create({
    data: {
      userId: johnUser.id,
      productId: productMap["japanese-maple"],
      productName: "Japanese Maple",
      productImage: "https://placehold.co/400x400/6b1a6b/white?text=Japanese+Maple",
      addedAt: daysAgo(15),
    },
  });
  console.log("  Created 2 wishlist items (john)");

  // ─── Notifications ────────────────────────────────────────
  console.log("Seeding notifications...");

  await prisma.pushNotification.create({
    data: {
      title: "Spring Sale is Here!",
      body: "Get 20% off all Palm Trees this weekend. Use code SPRING20 at checkout. Limited time offer!",
      type: NotificationType.promotion,
      data: { promoCode: "SPRING20", discount: "20" },
      targetUserIds: [],
      broadcast: true,
      sentAt: daysAgo(1),
      sentBy: adminUser.id,
    },
  });
  await prisma.pushNotification.create({
    data: {
      title: "Your order is being prepared",
      body: "Order #002 is now being prepared at our Hicksville farm. We'll notify you when it ships!",
      type: NotificationType.order_update,
      data: { orderId: "order-002", status: "preparing" },
      targetUserIds: [johnUser.id],
      broadcast: false,
      sentAt: daysAgo(2),
      sentBy: adminUser.id,
    },
  });
  console.log("  Created 2 notifications");

  // ─── Analytics ────────────────────────────────────────────
  console.log("Seeding analytics (last 7 days)...");

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
    [{ productId: productMap["canary-island-date-palm"], productName: "Canary Island Date Palm", quantity: 3 }, { productId: productMap["pygmy-date-palm"], productName: "Pygmy Date Palm", quantity: 2 }, { productId: productMap["premium-palm-fertilizer"], productName: "Premium Palm Fertilizer", quantity: 5 }],
    [{ productId: productMap["bird-of-paradise"], productName: "Bird of Paradise", quantity: 4 }, { productId: productMap["monstera-deliciosa"], productName: "Monstera Deliciosa", quantity: 3 }],
    [{ productId: productMap["windmill-palm"], productName: "Windmill Palm", quantity: 5 }, { productId: productMap["meyer-lemon-tree"], productName: "Meyer Lemon Tree", quantity: 3 }, { productId: productMap["aloe-vera"], productName: "Aloe Vera", quantity: 6 }],
    [{ productId: productMap["canary-island-date-palm"], productName: "Canary Island Date Palm", quantity: 6 }, { productId: productMap["japanese-maple"], productName: "Japanese Maple", quantity: 4 }, { productId: productMap["agave-blue-glow"], productName: "Agave Blue Glow", quantity: 3 }],
    [{ productId: productMap["pygmy-date-palm"], productName: "Pygmy Date Palm", quantity: 4 }, { productId: productMap["plumeria"], productName: "Plumeria", quantity: 2 }],
    [{ productId: productMap["avocado-tree"], productName: "Avocado Tree", quantity: 2 }, { productId: productMap["meyer-lemon-tree"], productName: "Meyer Lemon Tree", quantity: 1 }],
    [{ productId: productMap["canary-island-date-palm"], productName: "Canary Island Date Palm", quantity: 5 }, { productId: productMap["bird-of-paradise"], productName: "Bird of Paradise", quantity: 4 }, { productId: productMap["windmill-palm"], productName: "Windmill Palm", quantity: 3 }],
  ];

  for (let i = 0; i < dailyData.length; i++) {
    const d = dailyData[i];
    const date = new Date();
    date.setDate(date.getDate() - d.daysBack);
    const dateStr = date.toISOString().split("T")[0];

    await prisma.dailyAnalytics.upsert({
      where: { id: dateStr },
      update: {},
      create: {
        id: dateStr,
        date: dateStr,
        revenue: d.revenue,
        orderCount: d.orderCount,
        newCustomers: d.newCustomers,
        topProductsJson: topProductSets[i],
        averageOrderValue: d.avgOrder,
      },
    });
  }
  console.log("  Created 7 analytics entries");

  console.log("\n=== Seeding complete! ===");
  console.log("Login with: admin@gopalmtrees.com / admin123");
}

main()
  .catch((err) => {
    console.error("\nSeeding failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
