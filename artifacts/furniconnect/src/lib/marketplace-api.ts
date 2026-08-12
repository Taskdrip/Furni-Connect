export type MarketplaceItem = {
  id: number;
  kind: "product" | "service";
  name: string;
  description: string;
  category: string;
  price: number;
  image: string;
  maker: string;
  availability: string;
  featured: boolean;
  active: boolean;
};

export type Order = {
  id: number;
  orderNumber: string;
  total: number;
  status: string;
  deliveryAddress: string;
  createdAt: string;
  items: Array<{ itemName: string; quantity: number; unitPrice: number }>;
};

export type Project = {
  id: number;
  name: string;
  roomType: string;
  style: string;
  city: string;
  budget: string;
  notes: string;
  status: string;
  progress: number;
  providerName?: string | null;
  createdAt: string;
};

const apiBase = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/api`;

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = typeof body?.error === "string" ? body.error : `Request failed (${response.status})`;
    throw new Error(message);
  }
  return body as T;
}