import { useEffect, useState } from "react";
import { ArrowRight, Check, Clock3, FileText, LoaderCircle, Package, Plus, RefreshCw } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useUser } from "@clerk/react";
import { apiFetch, type Order, type Project } from "@/lib/marketplace-api";

const naira = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });
const button = "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50";

export default function CustomerPortal() {
  const { user } = useUser();
  const [, setLocation] = useLocation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ name: "", roomType: "Living room", style: "Warm modern", city: "Lagos", budget: "₦1m – ₦3m", notes: "" });

  async function refresh() {
    setLoading(true);
    try {
      const [nextOrders, nextProjects] = await Promise.all([apiFetch<Order[]>("/orders"), apiFetch<Project[]>("/projects")]);
      setOrders(nextOrders);
      setProjects(nextProjects);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load your workspace.");
    } finally { setLoading(false); }
  }
  useEffect(() => { refresh(); }, []);

  async function createRequest(event: React.FormEvent) {
    event.preventDefault();
    try {
      await apiFetch("/projects", { method: "POST", body: JSON.stringify(form) });
      setForm({ name: "", roomType: "Living room", style: "Warm modern", city: "Lagos", budget: "₦1m – ₦3m", notes: "" });
      setShowForm(false);
      setMessage("Project request submitted. We’ll match you with a trusted professional.");
      await refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not submit your project."); }
  }

  return <div className="min-h-screen bg-background">
    <header className="border-b border-border bg-background px-5 py-5 lg:px-8"><div className="mx-auto flex max-w-[1320px] items-center justify-between"><Link href="/" className="flex items-center gap-3 text-[17px] font-semibold tracking-[-.04em]"><img src="/brand-logo.png" alt="BobTech Furnitures" className="size-11 rounded-xl object-cover" />BobTech <span className="text-accent">Furnitures</span></Link><div className="flex items-center gap-3"><span className="hidden text-sm text-muted-foreground sm:block">Hi, {user?.firstName || "there"}</span><Link href="/marketplace" className={`${button} border border-border`}>Marketplace <ArrowRight size={16} /></Link></div></div></header>
    <main className="mx-auto max-w-[1320px] px-5 py-12 lg:px-8 lg:py-16"><div className="flex flex-wrap items-end justify-between gap-5"><div><div className="text-[10px] font-bold uppercase tracking-[.18em] text-accent">Your BobTech space</div><h1 className="mt-4 font-display text-6xl leading-[.92] tracking-[-.04em]">A place to<br /><em>keep moving.</em></h1></div><button onClick={refresh} className={`${button} border border-border`}><RefreshCw size={15} /> Refresh</button></div>
      {message && <div className="mt-8 rounded-2xl border border-primary/15 bg-[#d5e1d7] p-4 text-sm text-primary">{message}</div>}
      {loading ? <div className="mt-12 flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="animate-spin" size={16} /> Loading your workspace…</div> : <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-border bg-card p-6 lg:p-8"><div className="flex items-center justify-between"><div><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-accent"><Package size={15} /> Orders & service requests</div><h2 className="mt-3 font-display text-4xl">Track what’s <em>moving.</em></h2></div><Link href="/marketplace" className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground"><Plus size={18} /></Link></div><div className="mt-7 space-y-3">{orders.length ? orders.map((order) => <div key={order.id} className="rounded-2xl border border-border p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold">{order.orderNumber}</p><p className="mt-1 text-xs text-muted-foreground">{order.items.map((item) => `${item.itemName} × ${item.quantity}`).join(", ")}</p></div><span className="rounded-full bg-[#d5e1d7] px-3 py-1 text-[10px] font-semibold text-primary">{order.status}</span></div><div className="mt-4 flex justify-between text-xs text-muted-foreground"><span>{order.deliveryAddress}</span><strong className="text-primary">{naira.format(order.total)}</strong></div></div>) : <EmptyState icon={<Package size={18} />} text="Your marketplace orders will appear here." link="/marketplace" label="Browse marketplace" />}</div></section>
        <section className="rounded-3xl bg-primary p-6 text-primary-foreground lg:p-8"><div className="flex items-center justify-between"><div><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-accent"><FileText size={15} /> Interior projects</div><h2 className="mt-3 font-display text-4xl">Your ideas,<br /><em>in progress.</em></h2></div><button onClick={() => setShowForm(true)} className={`${button} bg-accent text-accent-foreground`}><Plus size={16} /> New brief</button></div><div className="mt-7 space-y-3">{projects.length ? projects.map((project) => <div key={project.id} className="rounded-2xl bg-primary-foreground/10 p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold">{project.name}</p><p className="mt-1 text-xs text-primary-foreground/60">{project.roomType} · {project.city}</p></div><span className="text-xs font-semibold text-accent">{project.progress}%</span></div><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-primary-foreground/15"><div className="h-full rounded-full bg-accent" style={{ width: `${project.progress}%` }} /></div><div className="mt-3 flex items-center gap-2 text-xs text-primary-foreground/60"><Clock3 size={13} /> {project.status}</div></div>) : <div className="rounded-2xl bg-primary-foreground/10 p-5 text-sm text-primary-foreground/65">No project briefs yet. Tell us what you want to make.</div>}</div></section>
      </div>}
    </main>
    {showForm && <div className="fixed inset-0 z-50 grid place-items-center bg-primary/40 p-5 backdrop-blur-sm"><form onSubmit={createRequest} className="w-full max-w-xl rounded-3xl bg-background p-7 shadow-lg"><div className="flex items-start justify-between"><div><div className="text-[10px] font-bold uppercase tracking-[.18em] text-accent">New project brief</div><h2 className="mt-2 font-display text-4xl">Let’s make a<br /><em>room yours.</em></h2></div><button type="button" onClick={() => setShowForm(false)} className="text-sm text-muted-foreground">Close</button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="text-xs font-semibold">Project name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-2 h-12 w-full rounded-xl border border-input bg-card px-4 text-sm outline-none focus:border-primary" placeholder="Our new living room" /></label><label className="text-xs font-semibold">City<input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="mt-2 h-12 w-full rounded-xl border border-input bg-card px-4 text-sm outline-none focus:border-primary" /></label><label className="text-xs font-semibold">Room type<select value={form.roomType} onChange={(e) => setForm({ ...form, roomType: e.target.value })} className="mt-2 h-12 w-full rounded-xl border border-input bg-card px-4 text-sm"><option>Living room</option><option>Bedroom</option><option>Dining room</option><option>Whole home</option></select></label><label className="text-xs font-semibold">Style<input value={form.style} onChange={(e) => setForm({ ...form, style: e.target.value })} className="mt-2 h-12 w-full rounded-xl border border-input bg-card px-4 text-sm outline-none focus:border-primary" /></label><label className="text-xs font-semibold sm:col-span-2">Budget<select value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} className="mt-2 h-12 w-full rounded-xl border border-input bg-card px-4 text-sm"><option>₦500k – ₦1m</option><option>₦1m – ₦3m</option><option>₦3m – ₦7m</option><option>₦7m+</option></select></label><label className="text-xs font-semibold sm:col-span-2">What do you need help with?<textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mt-2 min-h-24 w-full rounded-xl border border-input bg-card p-4 text-sm outline-none focus:border-primary" placeholder="Tell us about the space, timeline, and what matters most." /></label></div><button className={`${button} mt-6 w-full bg-accent text-accent-foreground`} type="submit">Send project request <ArrowRight size={16} /></button></form></div>}
  </div>;
}

function EmptyState({ icon, text, link, label }: { icon: React.ReactNode; text: string; link: string; label: string }) {
  return <div className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground"><div className="flex items-center gap-2">{icon}{text}</div><Link href={link} className="mt-4 inline-flex items-center gap-2 font-semibold text-primary">{label} <ArrowRight size={14} /></Link></div>;
}