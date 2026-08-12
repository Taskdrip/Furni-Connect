import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, Minus, Plus, Search, ShoppingBag, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { SignedIn, SignedOut } from "@clerk/react";
import { apiFetch, type MarketplaceItem } from "@/lib/marketplace-api";

const naira = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });
const money = (value: number) => naira.format(Number(value) || 0);
const button = "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50";

export default function Marketplace() {
  const [, setLocation] = useLocation();
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [kind, setKind] = useState<"" | "product" | "service">("");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<Record<number, number>>({});
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setLoading(true);
    apiFetch<MarketplaceItem[]>(`/marketplace?${new URLSearchParams({ ...(kind ? { kind } : {}), ...(search ? { search } : {}) })}`)
      .then(setItems)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [kind, search]);

  const cartItems = useMemo(() => items.filter((item) => cart[item.id]), [items, cart]);
  const cartCount = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
  const total = cartItems.reduce((sum, item) => sum + item.price * cart[item.id], 0);

  function updateCart(item: MarketplaceItem, delta: number) {
    setCart((current) => {
      const next = Math.max(0, (current[item.id] ?? 0) + delta);
      const updated = { ...current };
      if (next) updated[item.id] = next;
      else delete updated[item.id];
      return updated;
    });
  }

  async function submitOrder(event: React.FormEvent) {
    event.preventDefault();
    try {
      await apiFetch("/orders", {
        method: "POST",
        body: JSON.stringify({
          items: cartItems.map((item) => ({ itemId: item.id, quantity: cart[item.id] })),
          deliveryAddress: address,
        }),
      });
      setCart({});
      setAddress("");
      setCheckoutOpen(false);
      setSuccess("Your request is in. Track it from your customer dashboard.");
      setTimeout(() => setLocation("/dashboard"), 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not place the order.");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/70 bg-background/90 px-5 py-5 backdrop-blur-xl lg:px-8">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 text-[17px] font-semibold tracking-[-.04em]">
            <img src="/brand-logo.png" alt="BobTech Furnitures" className="size-11 rounded-xl object-cover" />
            <span>BobTech <span className="text-accent">Furnitures</span></span>
          </Link>
          <div className="flex items-center gap-2">
            <SignedOut><Link href="/sign-in" className={`${button} border border-border`}>Sign in</Link></SignedOut>
            <SignedIn><Link href="/dashboard" className={`${button} border border-border`}>My dashboard</Link></SignedIn>
            <button onClick={() => setCheckoutOpen(true)} disabled={!cartCount} className={`${button} bg-primary text-primary-foreground`}>
              <ShoppingBag size={16} /> <span>{cartCount}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1320px] px-5 py-12 lg:px-8 lg:py-20">
        <div className="flex flex-wrap items-end justify-between gap-7">
          <div><div className="mb-4 text-[10px] font-bold uppercase tracking-[.18em] text-accent">The BobTech marketplace</div><h1 className="font-display text-6xl leading-[.92] tracking-[-.04em] sm:text-8xl">Buy well.<br /><em>Make it yours.</em></h1><p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground">Furniture, objects, and practical design services from trusted makers across Nigeria.</p></div>
          <Link href="/ai-room-designer" className="flex items-center gap-2 text-sm font-semibold text-primary">Need help choosing? <ArrowRight size={16} /></Link>
        </div>

        <div className="mt-12 flex flex-wrap gap-3">
          {([["", "Everything"], ["product", "Furniture & objects"], ["service", "Design services"]] as const).map(([value, label]) => <button key={value} onClick={() => setKind(value)} className={`${button} ${kind === value ? "bg-primary text-primary-foreground" : "border border-border bg-card"}`}>{label}</button>)}
          <label className="ml-auto flex min-h-11 w-full max-w-sm items-center gap-2 rounded-full border border-border bg-card px-4 text-sm text-muted-foreground sm:w-auto"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search the edit" className="min-w-0 flex-1 bg-transparent outline-none" /></label>
        </div>

        {error && <div className="mt-8 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}
        {loading ? <div className="mt-10 text-sm text-muted-foreground">Loading the marketplace…</div> : <div className="mt-10 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => <article key={item.id} className="group">
            <div className="relative aspect-[.82] overflow-hidden rounded-[22px] bg-secondary"><img src={item.image || "/images/living-room.jpg"} alt={item.name} className="size-full object-cover transition duration-700 group-hover:scale-105" /><span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1.5 text-[10px] font-semibold backdrop-blur">{item.kind === "service" ? "Service" : item.availability}</span></div>
            <div className="mt-4 flex items-start justify-between gap-3"><div><h2 className="font-display text-2xl leading-none">{item.name}</h2><p className="mt-2 text-[11px] text-muted-foreground">{item.maker} · {item.category}</p></div><span className="whitespace-nowrap text-sm font-bold text-primary">{money(item.price)}</span></div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.description}</p>
            <div className="mt-4 flex items-center gap-2"><button onClick={() => updateCart(item, -1)} disabled={!cart[item.id]} className="grid size-9 place-items-center rounded-full border border-border"><Minus size={14} /></button><span className="w-5 text-center text-sm font-semibold">{cart[item.id] ?? 0}</span><button onClick={() => updateCart(item, 1)} className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground"><Plus size={14} /></button><span className="ml-2 text-xs text-muted-foreground">{item.kind === "service" ? "Add to request" : "Add to basket"}</span></div>
          </article>)}
        </div>}
        {!loading && !items.length && <div className="mt-10 rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">Nothing matches that search yet.</div>}
        {success && <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl bg-primary px-5 py-4 text-sm text-primary-foreground shadow-lg"><Check size={18} className="text-accent" /> {success}</div>}
      </main>

      {checkoutOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-primary/40 p-5 backdrop-blur-sm"><div className="w-full max-w-lg rounded-3xl bg-background p-7 shadow-lg"><div className="flex items-center justify-between"><div><div className="text-[10px] font-bold uppercase tracking-[.18em] text-accent">Your request</div><h2 className="mt-2 font-display text-4xl">Almost <em>there.</em></h2></div><button onClick={() => setCheckoutOpen(false)} className="rounded-full p-2 hover:bg-muted"><X size={18} /></button></div><div className="mt-6 space-y-3">{cartItems.map((item) => <div key={item.id} className="flex justify-between text-sm"><span>{item.name} × {cart[item.id]}</span><strong>{money(item.price * cart[item.id])}</strong></div>)}<div className="flex justify-between border-t border-border pt-4 font-semibold"><span>Total</span><span>{money(total)}</span></div></div><SignedOut><div className="mt-6 rounded-2xl bg-muted p-4 text-sm leading-6">Sign in to submit this order and keep a record of your delivery or service request.</div><Link href="/sign-in" className={`${button} mt-4 w-full bg-primary text-primary-foreground`}>Sign in to continue <ArrowRight size={16} /></Link></SignedOut><SignedIn><form onSubmit={submitOrder} className="mt-6 space-y-3"><label className="block text-xs font-semibold">Delivery address or project location<input required minLength={5} value={address} onChange={(event) => setAddress(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-input bg-card px-4 text-sm outline-none focus:border-primary" placeholder="12 Admiralty Way, Lagos" /></label><button className={`${button} w-full bg-accent text-accent-foreground`} type="submit">Submit request <ArrowRight size={16} /></button></form></SignedIn></div></div>}
    </div>
  );
}