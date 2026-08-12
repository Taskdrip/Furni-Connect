import { useEffect, useState } from "react";
import { Edit3, Eye, EyeOff, LoaderCircle, Plus, Save, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { apiFetch, type MarketplaceItem } from "@/lib/marketplace-api";

const emptyForm = { kind: "product" as "product" | "service", name: "", description: "", category: "", price: "", image: "/images/living-room.jpg", maker: "BobTech Furnitures", availability: "Available", featured: false, active: true };
const button = "inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50";

export default function AdminMarketplace() {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    try { setItems(await apiFetch<MarketplaceItem[]>("/admin/marketplace/all")); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Could not load the catalog."); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  function edit(item: MarketplaceItem) {
    setEditing(item.id);
    setForm({ kind: item.kind, name: item.name, description: item.description, category: item.category, price: String(item.price), image: item.image, maker: item.maker, availability: item.availability, featured: item.featured, active: item.active });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    const payload = { ...form, price: Number(form.price) };
    try {
      await apiFetch(editing ? `/admin/marketplace/${editing}` : "/admin/marketplace", { method: editing ? "PATCH" : "POST", body: JSON.stringify(payload) });
      setForm(emptyForm); setEditing(null); setMessage(editing ? "Catalog item updated." : "Catalog item added."); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not save this item."); }
  }
  async function toggle(item: MarketplaceItem) {
    await apiFetch(`/admin/marketplace/${item.id}`, { method: "PATCH", body: JSON.stringify({ active: !item.active }) });
    await load();
  }
  async function remove(item: MarketplaceItem) {
    if (!window.confirm(`Hide ${item.name} from the marketplace?`)) return;
    await apiFetch(`/admin/marketplace/${item.id}`, { method: "DELETE" });
    await load();
  }

  return <div className="min-h-screen bg-background"><header className="border-b border-border bg-background px-5 py-5 lg:px-8"><div className="mx-auto flex max-w-[1320px] items-center justify-between"><Link href="/" className="flex items-center gap-3 text-[17px] font-semibold"><img src="/brand-logo.png" alt="BobTech Furnitures" className="size-11 rounded-xl object-cover" />BobTech <span className="text-accent">Admin</span></Link><Link href="/marketplace" className={`${button} border border-border`}>View marketplace</Link></div></header><main className="mx-auto max-w-[1320px] px-5 py-12 lg:px-8"><div className="flex items-end justify-between gap-5"><div><div className="text-[10px] font-bold uppercase tracking-[.18em] text-accent">Catalog control</div><h1 className="mt-4 font-display text-6xl leading-[.92]">Products &<br /><em>services.</em></h1></div></div>{message && <div className="mt-7 rounded-2xl bg-[#d5e1d7] p-4 text-sm text-primary">{message}</div>}<form onSubmit={save} className="mt-8 rounded-3xl border border-border bg-card p-6 lg:p-8"><div className="flex items-center justify-between"><h2 className="font-display text-3xl">{editing ? "Edit catalog item" : "Add to marketplace"}</h2>{editing && <button type="button" onClick={() => { setEditing(null); setForm(emptyForm); }} className="text-sm text-muted-foreground">Cancel edit</button>}</div><div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4"><label className="text-xs font-semibold">Type<select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as "product" | "service" })} className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"><option value="product">Product</option><option value="service">Service</option></select></label><label className="text-xs font-semibold lg:col-span-2">Name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" /></label><label className="text-xs font-semibold">Price (₦)<input required min="0" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" /></label><label className="text-xs font-semibold">Category<input required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" /></label><label className="text-xs font-semibold">Maker / provider<input required value={form.maker} onChange={(e) => setForm({ ...form, maker: e.target.value })} className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" /></label><label className="text-xs font-semibold">Availability<input required value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })} className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" /></label><label className="text-xs font-semibold">Image URL<input required value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" /></label><label className="text-xs font-semibold md:col-span-2 lg:col-span-4">Description<textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-2 min-h-20 w-full rounded-xl border border-input bg-background p-3 text-sm" /></label></div><div className="mt-5 flex flex-wrap gap-5 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Feature on marketplace</label><label className="flex items-center gap-2"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Visible to customers</label></div><button className={`${button} mt-6 bg-primary text-primary-foreground`} type="submit"><Save size={15} /> {editing ? "Save changes" : "Add item"}</button></form><section className="mt-10 rounded-3xl border border-border bg-card p-6 lg:p-8"><div className="flex items-center justify-between"><h2 className="font-display text-3xl">Current catalog</h2><span className="text-sm text-muted-foreground">{items.length} items</span></div>{loading ? <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="animate-spin" size={16} /> Loading catalog…</div> : <div className="mt-5 divide-y divide-border">{items.map((item) => <div key={item.id} className="flex flex-wrap items-center gap-4 py-4"><img src={item.image} alt="" className="size-14 rounded-xl object-cover" /><div className="min-w-[200px] flex-1"><div className="flex items-center gap-2"><span className="rounded-full bg-muted px-2 py-1 text-[10px] uppercase">{item.kind}</span><h3 className="text-sm font-semibold">{item.name}</h3></div><p className="mt-1 text-xs text-muted-foreground">{item.category} · ₦{item.price.toLocaleString()}</p></div><span className={`text-xs ${item.active ? "text-primary" : "text-muted-foreground"}`}>{item.active ? "Visible" : "Hidden"}</span><button onClick={() => edit(item)} className={`${button} border border-border`}><Edit3 size={14} /> Edit</button><button onClick={() => toggle(item)} className={`${button} border border-border`}>{item.active ? <EyeOff size={14} /> : <Eye size={14} />} {item.active ? "Hide" : "Show"}</button><button onClick={() => remove(item)} className={`${button} text-destructive`}><Trash2 size={14} /></button></div>)}</div>}</section></main></div>;
}