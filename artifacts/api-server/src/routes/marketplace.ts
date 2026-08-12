import { Router, type IRouter } from "express";
import { and, asc, desc, eq, ilike, or } from "drizzle-orm";
import {
  appUsersTable,
  insertMarketplaceItemSchema,
  marketplaceItemsTable,
  orderItemsTable,
  ordersTable,
  type MarketplaceItem,
} from "@workspace/db";
import { db } from "@workspace/db";
import { appUser, claimFirstAdmin, requireAdmin, requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

const seedItems = [
  {
    kind: "product",
    name: "The Sapele Lounge Chair",
    description: "A hand-finished solid wood lounge chair with generous proportions.",
    category: "Seating",
    price: 185000,
    image: "/images/studio.jpg",
    maker: "Adebayo Woodcraft · Lagos",
    availability: "Hand-finished",
    featured: true,
    active: true,
  },
  {
    kind: "product",
    name: "Nubian Oak Dining Set",
    description: "A warm, durable dining set made for long Nigerian evenings.",
    category: "Dining",
    price: 920000,
    image: "/images/dining-room.jpg",
    maker: "Ilé Living · Abuja",
    availability: "Made to order",
    featured: true,
    active: true,
  },
  {
    kind: "product",
    name: "The Quiet Hour Bed",
    description: "A calm statement bed with a considered, architectural silhouette.",
    category: "Bedroom",
    price: 640000,
    image: "/images/bedroom.jpg",
    maker: "Atrium Objects · Ibadan",
    availability: "New arrival",
    featured: true,
    active: true,
  },
  {
    kind: "product",
    name: "Aso Oke Accent Cushion",
    description: "Small-batch woven texture for a quick, meaningful room refresh.",
    category: "Objects",
    price: 38000,
    image: "/images/living-room.jpg",
    maker: "Moyo Home · Lagos",
    availability: "Small batch",
    featured: false,
    active: true,
  },
  {
    kind: "service",
    name: "Room refresh consultation",
    description: "A focused 60-minute consultation to clarify priorities, layout and budget.",
    category: "Interior design",
    price: 75000,
    image: "/images/living-room.jpg",
    maker: "BobTech Design Desk",
    availability: "Book a conversation",
    featured: true,
    active: true,
  },
  {
    kind: "service",
    name: "Bespoke furniture brief",
    description: "Turn an idea into a build-ready furniture brief with a trusted maker.",
    category: "Furniture design",
    price: 120000,
    image: "/images/studio.jpg",
    maker: "BobTech Design Desk",
    availability: "Starts with a brief",
    featured: false,
    active: true,
  },
];

export async function ensureMarketplaceSeeds(): Promise<void> {
  const existing = await db.select({ id: marketplaceItemsTable.id }).from(marketplaceItemsTable).limit(1);
  if (!existing.length) await db.insert(marketplaceItemsTable).values(seedItems);
}

function serializeItem(item: MarketplaceItem) {
  return { ...item, price: Number(item.price) };
}

router.get("/marketplace", async (req, res) => {
  await ensureMarketplaceSeeds();
  const kind = typeof req.query.kind === "string" ? req.query.kind : undefined;
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const filters = [eq(marketplaceItemsTable.active, true)];
  if (kind === "product" || kind === "service") filters.push(eq(marketplaceItemsTable.kind, kind));
  if (search) {
    filters.push(
      or(
        ilike(marketplaceItemsTable.name, `%${search}%`),
        ilike(marketplaceItemsTable.category, `%${search}%`),
        ilike(marketplaceItemsTable.maker, `%${search}%`),
      )!,
    );
  }
  const items = await db
    .select()
    .from(marketplaceItemsTable)
    .where(and(...filters))
    .orderBy(desc(marketplaceItemsTable.featured), desc(marketplaceItemsTable.createdAt));
  res.json(items.map(serializeItem));
});

router.get("/marketplace/:id", async (req, res) => {
  const item = await db
    .select()
    .from(marketplaceItemsTable)
    .where(eq(marketplaceItemsTable.id, Number(req.params.id)))
    .limit(1);
  if (!item[0]) {
    res.status(404).json({ error: "Marketplace item not found." });
    return;
  }
  res.json(serializeItem(item[0]));
});

router.post("/admin/claim-first-access", requireAuth, async (req, res) => {
  const user = await claimFirstAdmin(req);
  if (!user) {
    res.status(401).json({ error: "Sign in to continue." });
    return;
  }
  res.json({ role: user.role, claimed: user.role === "admin" });
});

router.post("/admin/marketplace", requireAdmin, async (req, res) => {
  const parsed = insertMarketplaceItemSchema.safeParse({
    ...req.body,
    price: Number(req.body.price),
  });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const item = await db.insert(marketplaceItemsTable).values(parsed.data).returning();
  res.status(201).json(serializeItem(item[0]));
});

router.patch("/admin/marketplace/:id", requireAdmin, async (req, res) => {
  const allowed = ["kind", "name", "description", "category", "price", "image", "maker", "availability", "featured", "active"] as const;
  const updates: Partial<typeof marketplaceItemsTable.$inferInsert> = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) (updates as Record<string, unknown>)[key] = key === "price" ? Number(req.body[key]) : req.body[key];
  }
  const item = await db
    .update(marketplaceItemsTable)
    .set(updates)
    .where(eq(marketplaceItemsTable.id, Number(req.params.id)))
    .returning();
  if (!item[0]) {
    res.status(404).json({ error: "Marketplace item not found." });
    return;
  }
  res.json(serializeItem(item[0]));
});

router.delete("/admin/marketplace/:id", requireAdmin, async (req, res) => {
  const item = await db
    .update(marketplaceItemsTable)
    .set({ active: false })
    .where(eq(marketplaceItemsTable.id, Number(req.params.id)))
    .returning({ id: marketplaceItemsTable.id });
  if (!item[0]) {
    res.status(404).json({ error: "Marketplace item not found." });
    return;
  }
  res.status(204).end();
});

router.get("/orders", requireAuth, async (req, res) => {
  const user = appUser(req);
  const orders = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.userId, user.id))
    .orderBy(desc(ordersTable.createdAt));
  const result = await Promise.all(
    orders.map(async (order) => ({
      ...order,
      total: Number(order.total),
      items: await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id)),
    })),
  );
  res.json(result);
});

router.post("/orders", requireAuth, async (req, res) => {
  const user = appUser(req);
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  const requested = items
    .map((item: unknown) => ({
      itemId: Number((item as { itemId?: unknown }).itemId),
      quantity: Number((item as { quantity?: unknown }).quantity),
    }))
    .filter((item: { itemId: number; quantity: number }) => Number.isInteger(item.itemId) && item.quantity > 0);
  if (!requested.length) {
    res.status(400).json({ error: "Add at least one item to your order." });
    return;
  }
  const catalog = await Promise.all(
    requested.map(async (requestedItem: { itemId: number; quantity: number }) => {
      const item = await db.select().from(marketplaceItemsTable).where(eq(marketplaceItemsTable.id, requestedItem.itemId)).limit(1);
      return { requestedItem, item: item[0] };
    }),
  );
  if (catalog.some(({ item }) => !item?.active)) {
    res.status(400).json({ error: "One of the selected marketplace items is no longer available." });
    return;
  }
  const total = catalog.reduce((sum, entry) => sum + Number(entry.item!.price) * entry.requestedItem.quantity, 0);
  const orderNumber = `BOB-${Date.now().toString(36).toUpperCase()}`;
  const created = await db
    .insert(ordersTable)
    .values({
      orderNumber,
      userId: user.id,
      total,
      deliveryAddress: typeof req.body.deliveryAddress === "string" ? req.body.deliveryAddress : "To be confirmed",
    })
    .returning();
  const order = created[0];
  await db.insert(orderItemsTable).values(
    catalog.map(({ item, requestedItem }) => ({
      orderId: order.id,
      itemId: item!.id,
      quantity: requestedItem.quantity,
      unitPrice: Number(item!.price),
      itemName: item!.name,
    })),
  );
  res.status(201).json({ ...order, total: Number(order.total), items: catalog.map(({ item, requestedItem }) => ({ itemName: item!.name, quantity: requestedItem.quantity, unitPrice: Number(item!.price) })) });
});

export default router;