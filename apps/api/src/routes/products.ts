import { Router, Request, Response } from "express";
import { prisma } from "../prisma.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

function formatProduct(p: any) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    categoryId: p.categoryId,
    thumbnailURL: p.thumbnailURL,
    featured: p.featured,
    active: p.active,
    seasonalOnly: p.seasonalOnly,
    images: (p.images || []).sort((a: any, b: any) => a.sortOrder - b.sortOrder).map((i: any) => i.url),
    sizes: (p.sizes || []).map((s: any) => ({
      id: s.id,
      label: s.label,
      height: s.height,
      price: s.price,
      compareAtPrice: s.compareAtPrice,
      stock: s.stock,
      sku: s.sku,
    })),
    careInfo: {
      sunlight: p.careSunlight,
      water: p.careWater,
      temperature: p.careTemperature,
      soil: p.careSoil,
      tips: (p.careTips || []).sort((a: any, b: any) => a.sortOrder - b.sortOrder).map((t: any) => t.tip),
    },
    tags: (p.tags || []).map((t: any) => t.tag),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

const productIncludes = {
  images: true,
  sizes: true,
  tags: true,
  careTips: true,
};

// GET /api/products
router.get("/", async (_req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      include: productIncludes,
      orderBy: { name: "asc" },
    });
    res.json(products.map(formatProduct));
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/products/:id
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: productIncludes,
    });
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.json(formatProduct(product));
  } catch (error) {
    console.error("Get product error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/products
router.post("/", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, slug, description, categoryId, thumbnailURL, featured, active, seasonalOnly, images, sizes, careInfo, tags } = req.body;

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description: description || "",
        categoryId: categoryId || null,
        thumbnailURL: thumbnailURL || "",
        featured: featured ?? false,
        active: active ?? true,
        seasonalOnly: seasonalOnly ?? false,
        careSunlight: careInfo?.sunlight || "",
        careWater: careInfo?.water || "",
        careTemperature: careInfo?.temperature || "",
        careSoil: careInfo?.soil || "",
        images: {
          create: (images || []).map((url: string, i: number) => ({ url, sortOrder: i })),
        },
        sizes: {
          create: (sizes || []).map((s: any) => ({
            label: s.label,
            height: s.height || "",
            price: s.price,
            compareAtPrice: s.compareAtPrice || null,
            stock: s.stock || 0,
            sku: s.sku || "",
          })),
        },
        tags: {
          create: (tags || []).map((tag: string) => ({ tag })),
        },
        careTips: {
          create: (careInfo?.tips || []).map((tip: string, i: number) => ({ tip, sortOrder: i })),
        },
      },
      include: productIncludes,
    });

    res.status(201).json(formatProduct(product));
  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/products/:id
router.put("/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, slug, description, categoryId, thumbnailURL, featured, active, seasonalOnly, images, sizes, careInfo, tags } = req.body;

    // Delete existing related records and recreate
    await prisma.$transaction([
      prisma.productImage.deleteMany({ where: { productId: req.params.id } }),
      prisma.productSize.deleteMany({ where: { productId: req.params.id } }),
      prisma.productTag.deleteMany({ where: { productId: req.params.id } }),
      prisma.careTip.deleteMany({ where: { productId: req.params.id } }),
    ]);

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        name,
        slug,
        description: description || "",
        categoryId: categoryId || null,
        thumbnailURL: thumbnailURL || "",
        featured: featured ?? false,
        active: active ?? true,
        seasonalOnly: seasonalOnly ?? false,
        careSunlight: careInfo?.sunlight || "",
        careWater: careInfo?.water || "",
        careTemperature: careInfo?.temperature || "",
        careSoil: careInfo?.soil || "",
        images: {
          create: (images || []).map((url: string, i: number) => ({ url, sortOrder: i })),
        },
        sizes: {
          create: (sizes || []).map((s: any) => ({
            id: s.id && !s.id.startsWith("cl") ? undefined : undefined, // let Prisma generate new IDs
            label: s.label,
            height: s.height || "",
            price: s.price,
            compareAtPrice: s.compareAtPrice || null,
            stock: s.stock || 0,
            sku: s.sku || "",
          })),
        },
        tags: {
          create: (tags || []).map((tag: string) => ({ tag })),
        },
        careTips: {
          create: (careInfo?.tips || []).map((tip: string, i: number) => ({ tip, sortOrder: i })),
        },
      },
      include: productIncludes,
    });

    res.json(formatProduct(product));
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/products/:id
router.delete("/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    await prisma.product.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
