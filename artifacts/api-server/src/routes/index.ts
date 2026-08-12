import { Router, type IRouter } from "express";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import {
  aiDesignsTable,
  appUsersTable,
  insertProjectSchema,
  marketplaceItemsTable,
  projectsTable,
  providersTable,
} from "@workspace/db";
import { db } from "@workspace/db";
import healthRouter from "./health";
import marketplaceRouter, { ensureMarketplaceSeeds } from "./marketplace";
import { appUser, requireAdmin, requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

const seedProviders = [
  {
    name: "Adebayo Woodcraft",
    category: "Furniture Studio",
    city: "Lagos",
    state: "Lagos",
    description: "A family workshop making warm, durable furniture from honest Nigerian timber.",
    coverImage: "/images/studio.jpg",
    portfolio: ["/images/studio.jpg", "/images/living-room.jpg", "/images/dining-room.jpg"],
    styles: ["Warm modern", "Natural materials", "Bespoke furniture"],
    verified: true,
    rating: 49,
    completedProjects: 86,
    startingPrice: 280000,
    responseTime: "Within 2 hrs",
  },
  {
    name: "Ilé Living",
    category: "Interior Design",
    city: "Abuja",
    state: "FCT",
    description: "Residential interiors with a soft point of view and a sharp eye for proportion.",
    coverImage: "/images/bedroom.jpg",
    portfolio: ["/images/bedroom.jpg", "/images/living-room.jpg", "/images/studio.jpg"],
    styles: ["Soft minimal", "Contemporary", "Full-service interiors"],
    verified: true,
    rating: 48,
    completedProjects: 54,
    startingPrice: 450000,
    responseTime: "Within 1 day",
  },
  {
    name: "Atrium Objects",
    category: "Furniture Studio",
    city: "Ibadan",
    state: "Oyo",
    description: "Object-led furniture and small spaces made with restraint, texture and character.",
    coverImage: "/images/dining-room.jpg",
    portfolio: ["/images/dining-room.jpg", "/images/studio.jpg", "/images/bedroom.jpg"],
    styles: ["Afro-contemporary", "Small spaces", "Objects"],
    verified: true,
    rating: 47,
    completedProjects: 31,
    startingPrice: 195000,
    responseTime: "Within 4 hrs",
  },
];

async function ensureProviderSeeds(): Promise<void> {
  const existing = await db.select({ id: providersTable.id }).from(providersTable).limit(1);
  if (!existing.length) await db.insert(providersTable).values(seedProviders);
}

function providerResponse(provider: typeof providersTable.$inferSelect) {
  return { ...provider, rating: Number(provider.rating) / 10 };
}

router.use(healthRouter);
router.use(marketplaceRouter);

router.get("/providers", async (req, res) => {
  await ensureProviderSeeds();
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const city = typeof req.query.city === "string" ? req.query.city : "";
  const category = typeof req.query.category === "string" ? req.query.category : "";
  const filters = [];
  if (city) filters.push(eq(providersTable.city, city));
  if (category) filters.push(eq(providersTable.category, category));
  if (search) {
    filters.push(
      or(
        ilike(providersTable.name, `%${search}%`),
        ilike(providersTable.category, `%${search}%`),
        ilike(providersTable.description, `%${search}%`),
      )!,
    );
  }
  const providers = await db
    .select()
    .from(providersTable)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(providersTable.verified), desc(providersTable.rating));
  res.json(providers.map(providerResponse));
});

router.get("/providers/:id", async (req, res) => {
  await ensureProviderSeeds();
  const provider = await db.select().from(providersTable).where(eq(providersTable.id, Number(req.params.id))).limit(1);
  if (!provider[0]) {
    res.status(404).json({ error: "Professional not found." });
    return;
  }
  res.json(providerResponse(provider[0]));
});

router.get("/projects", requireAuth, async (req, res) => {
  const projects = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.userId, appUser(req).id))
    .orderBy(desc(projectsTable.createdAt));
  res.json(projects);
});

router.post("/projects", requireAuth, async (req, res) => {
  const parsed = insertProjectSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const project = await db.insert(projectsTable).values({ ...parsed.data, userId: appUser(req).id }).returning();
  res.status(201).json(project[0]);
});

router.get("/projects/:id", requireAuth, async (req, res) => {
  const filters = [eq(projectsTable.id, Number(req.params.id))];
  const user = appUser(req);
  if (user.role !== "admin") filters.push(eq(projectsTable.userId, user.id));
  const project = await db.select().from(projectsTable).where(and(...filters)).limit(1);
  if (!project[0]) {
    res.status(404).json({ error: "Project not found." });
    return;
  }
  res.json(project[0]);
});

router.get("/dashboard/summary", requireAuth, async (req, res) => {
  const userProjects = await db.select().from(projectsTable).where(eq(projectsTable.userId, appUser(req).id));
  res.json({
    activeProjects: userProjects.filter((project) => project.status !== "Completed").length,
    pendingQuotes: userProjects.filter((project) => project.status === "Quote requested").length,
    totalSpent: 0,
    savedProfessionals: 0,
    recentActivity: userProjects.slice(0, 4).map((project) => `${project.name} · ${project.status}`),
  });
});

router.get("/business/dashboard/summary", requireAuth, async (_req, res) => {
  res.json({
    revenue: 0,
    newLeads: 0,
    activeProjects: 0,
    pendingQuotes: 0,
    conversionRate: 0,
    rating: 0,
    revenueSeries: [],
    pipeline: [],
  });
});

router.get("/ai/designs", requireAuth, async (req, res) => {
  const designs = await db
    .select()
    .from(aiDesignsTable)
    .where(eq(aiDesignsTable.userId, appUser(req).id))
    .orderBy(desc(aiDesignsTable.createdAt));
  res.json(designs);
});

router.post("/ai/designs/generate", requireAuth, async (req, res) => {
  const body = req.body as Record<string, unknown>;
  const roomType = String(body.roomType || "Living room");
  const style = String(body.style || "Warm modern");
  const color = String(body.color || "Terracotta & cream");
  const budget = String(body.budget || "₦1.5m – ₦3m");
  const originalImage = String(body.originalImage || "");
  const design = {
    roomType,
    style,
    color,
    budget,
    originalImage,
    resultImage: originalImage,
    summary: `A ${style.toLowerCase()} ${roomType.toLowerCase()} grounded in ${color.toLowerCase()} tones, layered with locally made pieces and room to breathe.`,
    estimatedMin: 1500000,
    estimatedMax: 3000000,
    recommendations: [],
  };
  const saved = await db.insert(aiDesignsTable).values({ ...design, userId: appUser(req).id }).returning();
  res.status(201).json({ ...design, id: saved[0].id });
});

router.get("/admin/marketplace/all", requireAdmin, async (_req, res) => {
  await ensureMarketplaceSeeds();
  const items = await db.select().from(marketplaceItemsTable).orderBy(desc(marketplaceItemsTable.createdAt));
  res.json(items);
});

export default router;