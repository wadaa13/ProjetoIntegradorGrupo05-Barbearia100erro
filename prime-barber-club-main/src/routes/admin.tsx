import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Lock, Trash2 } from "lucide-react";
import logo from "@/assets/logo.jpg.asset.json";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SLOTS, WEEKDAYS, brl, isSlotTaken, priceFor, setState, toISO, uid, useStore, type Booking, type Promo, type Review } from "@/lib/store";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Painel do gestor · Barbearia 100 Erro" },
      { name: "description", content: "Agenda, faturamento e catálogo da Barbearia 100 Erro." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Painel do gestor · Barbearia 100 Erro" },
      { property: "og:description", content: "Área restrita do gestor." },
    ],
  }),
  component: AdminPage,
});

const ADMIN_PIN = "barbearia100erro";

function AdminPage() {
  const [ok, setOk] = useState(false);
  const [pin, setPin] = useState("");
  if (!ok)
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <form onSubmit={(e) => { e.preventDefault(); pin === ADMIN_PIN ? setOk(true) : toast.error("Senha incorreta"); }} className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card p-8 text-center">
          <img src={logo.url} alt="" className="mx-auto h-24 w-24 rounded-xl" />
          <h1 className="flex items-center justify-center gap-2 font-display text-2xl"><Lock className="h-5 w-5 text-primary" /> Área do gestor</h1>
          <Input type="password" placeholder="Senha" value={pin} onChange={(e) => setPin(e.target.value)} />
          <Button type="submit" className="w-full">Entrar</Button>
        </form>
      </div>
    );
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <img src={logo.url} alt="" className="h-12 w-12 rounded-md" />
        <h1 className="font-display text-3xl">Painel do gestor</h1>
      </div>
      <Tabs defaultValue="financeiro">
        <TabsList className="flex-wrap">
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="agenda">Agenda</TabsTrigger>
          <TabsTrigger value="catalogo">Catálogo</TabsTrigger>
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
          <TabsTrigger value="avaliacoes">Avaliações</TabsTrigger>
        </TabsList>
        <TabsContent value="financeiro"><Financeiro /></TabsContent>
        <TabsContent value="agenda"><Agenda /></TabsContent>
        <TabsContent value="catalogo"><Catalogo /></TabsContent>
        <TabsContent value="clientes"><Clientes /></TabsContent>
        <TabsContent value="avaliacoes"><Avaliacoes /></TabsContent>
      </Tabs>
    </div>
  );
}

function Financeiro() {
  const s = useStore();
  const price = (b: Booking) => priceFor(s, b.serviceId, b.date);
  const done = s.bookings.filter((b) => b.status === "concluido");
  const today = toISO(new Date());
  const since = (days: number) => { const d = new Date(); d.setDate(d.getDate() - days); return toISO(d); };
  const sum = (from: string) => done.filter((b) => b.date >= from && b.date <= today).reduce((a, b) => a + price(b), 0);
  const chart = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = since(6 - i);
    return { dia: d.slice(8) + "/" + d.slice(5, 7), total: done.filter((b) => b.date === d).reduce((a, b) => a + price(b), 0) };
  }), [s.bookings]);
  const planRevenue = s.clients.reduce((a, c) => a + (s.plans.find((p) => p.id === c.planId)?.price ?? 0), 0);
  return (
    <div className="space-y-6 pt-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[["Hoje", sum(today)], ["Últimos 7 dias", sum(since(6))], ["Últimos 30 dias", sum(since(29))], ["Planos / mês", planRevenue]].map(([l, v]) => (
          <div key={l as string} className="rounded-xl border border-border bg-card p-5"><p className="text-sm text-muted-foreground">{l}</p><p className="font-display text-3xl text-primary">{brl(v as number)}</p></div>
        ))}
      </div>
      <div className="h-72 rounded-xl border border-border bg-card p-4">
        <ResponsiveContainer><BarChart data={chart}><XAxis dataKey="dia" stroke="var(--muted-foreground)" /><YAxis stroke="var(--muted-foreground)" /><Tooltip formatter={(v: number) => brl(v)} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }} /><Bar dataKey="total" fill="var(--primary)" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>
      </div>
      <p className="text-xs text-muted-foreground">O faturamento soma os atendimentos marcados como concluídos na Agenda.</p>
    </div>
  );
}

function Agenda() {
  const s = useStore();
  const [date, setDate] = useState(toISO(new Date()));
  const [walk, setWalk] = useState({ name: "", serviceId: s.services[0]?.id ?? "", time: "" });
  const upd = (id: string, p: Partial<Booking>) => setState((st) => ({ ...st, bookings: st.bookings.map((b) => (b.id === id ? { ...b, ...p } : b)) }));
  const toggleBlock = (t: string) => setState((st) => { const k = `${date} ${t}`; return { ...st, blocked: st.blocked.includes(k) ? st.blocked.filter((x) => x !== k) : [...st.blocked, k] }; });
  const addWalk = () => {
    if (!walk.name || !walk.time) { toast.error("Nome e horário"); return; }
    if (isSlotTaken(s, date, walk.time)) { toast.error("Horário ocupado"); return; }
    setState((st) => ({ ...st, bookings: [...st.bookings, { id: uid(), clientName: walk.name, phone: "", serviceId: walk.serviceId, date, time: walk.time, paid: true, walkIn: true, status: "concluido" }] }));
    setWalk({ ...walk, name: "", time: "" });
  };
  return (
    <div className="space-y-4 pt-4">
      <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-auto" />
      <div className="divide-y divide-border rounded-xl border border-border bg-card">
        {SLOTS.map((t) => {
          const b = s.bookings.find((x) => x.date === date && x.time === t && x.status !== "cancelado");
          const blocked = s.blocked.includes(`${date} ${t}`);
          const sv = b && s.services.find((x) => x.id === b.serviceId);
          return (
            <div key={t} className="flex flex-wrap items-center gap-3 p-3">
              <span className="w-14 font-display text-lg text-primary">{t}</span>
              {b ? (
                <>
                  <span className="min-w-0 flex-1">{b.clientName} · {sv?.name} {b.walkIn && "(presencial)"} · <span className="text-muted-foreground">{b.paid ? "pago" : "sinal"} · {b.status}</span></span>
                  {b.status === "agendado" && <Button size="sm" onClick={() => upd(b.id, { status: "concluido", paid: true })}>Concluir</Button>}
                  <select className="h-8 rounded-md border border-input bg-background px-2 text-sm" value="" onChange={(e) => e.target.value && (isSlotTaken(s, date, e.target.value) ? toast.error("Ocupado") : upd(b.id, { time: e.target.value }))}>
                    <option value="">Remarcar</option>{SLOTS.map((x) => <option key={x}>{x}</option>)}
                  </select>
                  <Button size="sm" variant="ghost" onClick={() => upd(b.id, { status: "cancelado" })}>Cancelar</Button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-muted-foreground">{blocked ? "Bloqueado" : "Livre"}</span>
                  <Button size="sm" variant="outline" onClick={() => toggleBlock(t)}>{blocked ? "Desbloquear" : "Bloquear"}</Button>
                </>
              )}
            </div>
          );
        })}
      </div>
      <div className="grid gap-2 rounded-xl border border-border bg-card p-4 sm:grid-cols-4">
        <Input placeholder="Cliente presencial" value={walk.name} onChange={(e) => setWalk({ ...walk, name: e.target.value })} />
        <select className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={walk.serviceId} onChange={(e) => setWalk({ ...walk, serviceId: e.target.value })}>{s.services.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
        <select className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={walk.time} onChange={(e) => setWalk({ ...walk, time: e.target.value })}><option value="">Horário</option>{SLOTS.map((x) => <option key={x}>{x}</option>)}</select>
        <Button onClick={addWalk}>Incluir atendimento</Button>
      </div>
    </div>
  );
}

function Catalogo() {
  const s = useStore();
  const [promo, setPromo] = useState({ title: "", text: "", serviceId: "", weekday: "", price: "" });
  const setPromoField = (id: string, patch: Partial<Promo>) =>
    setState((st) => ({ ...st, promos: st.promos.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  const createPromo = () => {
    if (!promo.title || !promo.serviceId || promo.weekday === "" || promo.price === "") { toast.error("Preencha título, serviço, dia e preço"); return; }
    setState((st) => ({
      ...st,
      promos: [...st.promos, { id: uid(), title: promo.title, text: promo.text, active: true, serviceId: promo.serviceId, weekday: Number(promo.weekday), price: Number(promo.price) }],
    }));
    setPromo({ title: "", text: "", serviceId: "", weekday: "", price: "" });
  };
  const selCls = "h-9 rounded-md border border-input bg-background px-2 text-sm";
  return (
    <div className="space-y-8 pt-4">
      <section className="space-y-2">
        <h2 className="font-display text-2xl">Serviços</h2>
        {s.services.map((sv) => (
          <div key={sv.id} className="grid gap-2 rounded-lg border border-border bg-card p-3 sm:grid-cols-[1fr_2fr_120px_auto]">
            <Input value={sv.name} onChange={(e) => setState((st) => ({ ...st, services: st.services.map((x) => (x.id === sv.id ? { ...x, name: e.target.value } : x)) }))} />
            <Input value={sv.description} onChange={(e) => setState((st) => ({ ...st, services: st.services.map((x) => (x.id === sv.id ? { ...x, description: e.target.value } : x)) }))} />
            <Input type="number" value={sv.price} onChange={(e) => setState((st) => ({ ...st, services: st.services.map((x) => (x.id === sv.id ? { ...x, price: Number(e.target.value) } : x)) }))} />
            <Button size="icon" variant="ghost" onClick={() => setState((st) => ({ ...st, services: st.services.filter((x) => x.id !== sv.id) }))}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
        <Button variant="outline" onClick={() => setState((st) => ({ ...st, services: [...st.services, { id: uid(), name: "Novo serviço", price: 0, duration: 30, description: "" }] }))}>Adicionar serviço</Button>
      </section>
      <section className="space-y-2">
        <h2 className="font-display text-2xl">Planos</h2>
        {s.plans.map((p) => (
          <div key={p.id} className="grid gap-2 rounded-lg border border-border bg-card p-3 sm:grid-cols-[1fr_2fr_120px]">
            <Input value={p.name} onChange={(e) => setState((st) => ({ ...st, plans: st.plans.map((x) => (x.id === p.id ? { ...x, name: e.target.value } : x)) }))} />
            <Input value={p.description} onChange={(e) => setState((st) => ({ ...st, plans: st.plans.map((x) => (x.id === p.id ? { ...x, description: e.target.value } : x)) }))} />
            <Input type="number" value={p.price} onChange={(e) => setState((st) => ({ ...st, plans: st.plans.map((x) => (x.id === p.id ? { ...x, price: Number(e.target.value) } : x)) }))} />
          </div>
        ))}
      </section>
      <section className="space-y-2">
        <h2 className="font-display text-2xl">Promoções</h2>
        {s.promos.map((p) => (
          <div key={p.id} className="space-y-3 rounded-lg border border-border bg-card p-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="min-w-0 flex-1"><strong>{p.title}</strong> — {p.text}</span>
              <Button size="sm" variant={p.active ? "default" : "outline"} onClick={() => setPromoField(p.id, { active: !p.active })}>{p.active ? "Ativa" : "Inativa"}</Button>
              <Button size="icon" variant="ghost" onClick={() => setState((st) => ({ ...st, promos: st.promos.filter((x) => x.id !== p.id) }))}><Trash2 className="h-4 w-4" /></Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <select className={selCls} value={p.serviceId ?? ""} onChange={(e) => setPromoField(p.id, { serviceId: e.target.value || undefined })}>
                <option value="">Todos os serviços</option>
                {s.services.map((sv) => <option key={sv.id} value={sv.id}>{sv.name}</option>)}
              </select>
              <select className={selCls} value={p.weekday ?? ""} onChange={(e) => setPromoField(p.id, { weekday: e.target.value === "" ? undefined : Number(e.target.value) })}>
                <option value="">Qualquer dia</option>
                {WEEKDAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
              </select>
              <Input type="number" placeholder="Preço promocional" value={p.price ?? ""} onChange={(e) => setPromoField(p.id, { price: e.target.value === "" ? undefined : Number(e.target.value) })} />
            </div>
            <p className="text-xs text-muted-foreground">
              {p.serviceId ? s.services.find((x) => x.id === p.serviceId)?.name : "Qualquer serviço"}
              {" · "}
              {p.weekday !== undefined ? WEEKDAYS[p.weekday] : "qualquer dia"}
              {p.price !== undefined ? ` · sai por ${brl(p.price)}` : ""}
            </p>
          </div>
        ))}
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto_auto_auto]">
          <Input placeholder="Título" value={promo.title} onChange={(e) => setPromo({ ...promo, title: e.target.value })} />
          <Input placeholder="Descrição" value={promo.text} onChange={(e) => setPromo({ ...promo, text: e.target.value })} />
          <select className={selCls} value={promo.serviceId} onChange={(e) => setPromo({ ...promo, serviceId: e.target.value })}>
            <option value="">Serviço</option>
            {s.services.map((sv) => <option key={sv.id} value={sv.id}>{sv.name}</option>)}
          </select>
          <select className={selCls} value={promo.weekday} onChange={(e) => setPromo({ ...promo, weekday: e.target.value })}>
            <option value="">Dia</option>
            {WEEKDAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
          </select>
          <Input className="w-28" type="number" placeholder="Preço" value={promo.price} onChange={(e) => setPromo({ ...promo, price: e.target.value })} />
          <Button onClick={createPromo}>Criar</Button>
        </div>
      </section>
    </div>
  );
}

function Clientes() {
  const s = useStore();
  if (!s.clients.length) return <p className="pt-4 text-muted-foreground">Nenhum cliente cadastrado ainda.</p>;
  return (
    <div className="space-y-2 pt-4">
      {s.clients.map((c) => {
        const visits = s.bookings.filter((b) => (b.clientId === c.id || b.phone === c.phone) && b.status === "concluido").length;
        return (
          <div key={c.id} className="flex flex-wrap justify-between gap-2 rounded-lg border border-border bg-card p-4">
            <div><p className="font-semibold">{c.name}</p><p className="text-sm text-muted-foreground">{c.phone} · {c.email} · aniv. {c.birthday ? c.birthday.split("-").reverse().slice(0, 2).join("/") : "—"}</p></div>
            <p className="text-sm">{s.plans.find((p) => p.id === c.planId)?.name ?? "Sem plano"} · {visits} visitas</p>
          </div>
        );
      })}
    </div>
  );
}

function Avaliacoes() {
  const s = useStore();
  const [r, setR] = useState({ author: "", text: "", rating: "5", date: toISO(new Date()) });
  const setRv = (id: string, patch: Partial<Review>) =>
    setState((st) => ({ ...st, reviews: st.reviews.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  const add = () => {
    if (!r.author || !r.text) { toast.error("Informe nome e texto"); return; }
    setState((st) => ({ ...st, reviews: [...st.reviews, { id: uid(), author: r.author, text: r.text, rating: Number(r.rating), date: r.date }] }));
    setR({ author: "", text: "", rating: "5", date: toISO(new Date()) });
    toast.success("Avaliação publicada");
  };
  const selCls = "h-9 rounded-md border border-input bg-background px-2 text-sm";
  return (
    <div className="space-y-4 pt-4">
      <div>
        <h2 className="font-display text-2xl">Avaliações do site</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Depoimentos publicados pela barbearia e exibidos na página inicial. Para que as avaliações do Google
          apareçam sozinhas, é preciso conectar a conta do Google da barbearia ao site.
        </p>
      </div>
      {s.reviews.length === 0 ? (
        <p className="text-muted-foreground">Nenhuma avaliação publicada ainda.</p>
      ) : (
        <div className="space-y-3">
          {s.reviews.map((rv) => (
            <div key={rv.id} className="space-y-2 rounded-lg border border-border bg-card p-3">
              <div className="grid gap-2 sm:grid-cols-[1fr_130px_150px_auto]">
                <Input value={rv.author} onChange={(e) => setRv(rv.id, { author: e.target.value })} />
                <select className={selCls} value={rv.rating} onChange={(e) => setRv(rv.id, { rating: Number(e.target.value) })}>
                  {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} estrela{n > 1 ? "s" : ""}</option>)}
                </select>
                <Input type="date" value={rv.date} onChange={(e) => setRv(rv.id, { date: e.target.value })} />
                <Button size="icon" variant="ghost" onClick={() => setState((st) => ({ ...st, reviews: st.reviews.filter((x) => x.id !== rv.id) }))}><Trash2 className="h-4 w-4" /></Button>
              </div>
              <Input value={rv.text} onChange={(e) => setRv(rv.id, { text: e.target.value })} />
            </div>
          ))}
        </div>
      )}
      <div className="space-y-2 rounded-xl border border-border bg-card p-4">
        <p className="font-display text-lg">Publicar nova avaliação</p>
        <div className="grid gap-2 sm:grid-cols-[1fr_130px_150px]">
          <Input placeholder="Nome do cliente" value={r.author} onChange={(e) => setR({ ...r, author: e.target.value })} />
          <select className={selCls} value={r.rating} onChange={(e) => setR({ ...r, rating: e.target.value })}>
            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} estrela{n > 1 ? "s" : ""}</option>)}
          </select>
          <Input type="date" value={r.date} onChange={(e) => setR({ ...r, date: e.target.value })} />
        </div>
        <Input placeholder="Texto da avaliação" value={r.text} onChange={(e) => setR({ ...r, text: e.target.value })} />
        <Button onClick={add}>Publicar</Button>
      </div>
    </div>
  );
}
