import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Badge, Btn, Card, Field, TopNav } from "@/components/ui-kit";
import { brl, timeSlots, toKey } from "@/lib/data";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Painel do Gestor — Barbearia 100 Erro" },
      { name: "description", content: "Faturamento, agenda e catálogo da Barbearia 100 Erro em um só painel." },
      { property: "og:title", content: "Painel do Gestor — Barbearia 100 Erro" },
      { property: "og:description", content: "Gestão de agenda, finanças e serviços." },
    ],
  }),
  component: Admin,
});

const revenue7 = [620, 0, 840, 910, 1180, 1540, 1320];
const labels7 = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function Admin() {
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<"dash" | "agenda" | "catalogo">("dash");

  if (!authed)
    return (
      <div className="min-h-screen">
        <TopNav />
        <Card className="mx-auto mt-20 max-w-sm space-y-4">
          <h1 className="text-2xl">Acesso do gestor</h1>
          <Field label="E-mail" defaultValue="gestor@100erro.com" />
          <Field label="Senha" type="password" defaultValue="demo1234" />
          <Btn className="w-full" onClick={() => setAuthed(true)}>Entrar</Btn>
          <p className="text-center text-xs text-muted-foreground">Login de demonstração</p>
        </Card>
      </div>
    );

  return (
    <div className="min-h-screen">
      <TopNav />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl">Painel do Gestor</h1>
          <div className="flex rounded-lg border bg-card p-1">
            {([["dash", "Financeiro"], ["agenda", "Agenda"], ["catalogo", "Catálogo"]] as const).map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)} className={cn("rounded-md px-3 py-1.5 text-sm", tab === k ? "bg-gold text-primary-foreground" : "text-muted-foreground")}>{l}</button>
            ))}
          </div>
        </div>
        <div className="mt-6">{tab === "dash" ? <Dashboard /> : tab === "agenda" ? <Agenda /> : <Catalogo />}</div>
      </div>
    </div>
  );
}

function Dashboard() {
  const { appointments, services } = useStore();
  const today = toKey(new Date());
  const todayRev = appointments.filter((a) => a.date === today).reduce((s, a) => s + (services.find((x) => x.id === a.serviceId)?.price ?? 0), 0);
  const week = revenue7.reduce((a, b) => a + b, 0);
  const max = Math.max(...revenue7);
  const ranking = services.map((s) => ({ s, n: appointments.filter((a) => a.serviceId === s.id).length })).sort((a, b) => b.n - a.n);
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Hoje" value={brl(todayRev)} hint={`${appointments.filter((a) => a.date === today).length} atendimentos`} />
        <Stat label="Semana" value={brl(week)} hint="+12% vs semana anterior" />
        <Stat label="Mês" value={brl(week * 4.2)} hint="Projeção automática" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <h3 className="text-lg">Faturamento — últimos 7 dias</h3>
          <div className="mt-6 flex h-48 items-end gap-3">
            {revenue7.map((v, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-[10px] text-muted-foreground">{v ? Math.round(v) : ""}</span>
                <div className="w-full rounded-t-md bg-gold" style={{ height: `${(v / max) * 100}%`, minHeight: 2 }} />
                <span className="text-xs text-muted-foreground">{labels7[i]}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h3 className="text-lg">Serviços mais vendidos</h3>
          <ul className="mt-4 space-y-3 text-sm">
            {ranking.slice(0, 5).map(({ s, n }) => (
              <li key={s.id} className="flex justify-between"><span>{s.name}</span><span className="text-primary">{n}</span></li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card>
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-3xl text-gold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </Card>
  );
}

function Agenda() {
  const { appointments, services, blocked, toggleBlock, addAppointment, removeAppointment, updateAppointment } = useStore();
  const [date, setDate] = useState(toKey(new Date()));
  const [walkName, setWalkName] = useState("");
  const [walkService, setWalkService] = useState(services[0]?.id ?? "");
  const [moving, setMoving] = useState<string | null>(null);

  const shift = (n: number) => { const d = new Date(date + "T12:00"); d.setDate(d.getDate() + n); setDate(toKey(d)); };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <Card>
        <div className="flex items-center justify-between">
          <Btn variant="ghost" onClick={() => shift(-1)}>←</Btn>
          <h3 className="text-lg capitalize">{new Date(date + "T12:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}</h3>
          <Btn variant="ghost" onClick={() => shift(1)}>→</Btn>
        </div>
        {moving && <p className="mt-3 rounded-md bg-accent p-2 text-center text-sm text-accent-foreground">Escolha um horário livre para remarcar • <button className="underline" onClick={() => setMoving(null)}>cancelar</button></p>}
        <ul className="mt-4 divide-y">
          {timeSlots.map((t) => {
            const a = appointments.find((x) => x.date === date && x.time === t);
            const isBlocked = blocked.includes(`${date}|${t}`);
            return (
              <li key={t} className="flex flex-wrap items-center gap-3 py-3">
                <span className="w-14 font-mono text-sm text-primary">{t}</span>
                {a ? (
                  <>
                    <div className="flex-1">
                      <p className="font-medium">{a.client}</p>
                      <p className="text-xs text-muted-foreground">{services.find((s) => s.id === a.serviceId)?.name}</p>
                    </div>
                    <Badge tone={a.status === "walk-in" ? "muted" : a.status === "confirmado" ? "success" : "gold"}>{a.status}</Badge>
                    <Btn variant="ghost" className="px-2 py-1 text-xs" onClick={() => setMoving(a.id)}>Remarcar</Btn>
                    <Btn variant="danger" className="px-2 py-1 text-xs" onClick={() => removeAppointment(a.id)}>Cancelar</Btn>
                  </>
                ) : isBlocked ? (
                  <>
                    <span className="flex-1 text-sm text-muted-foreground">🔒 Bloqueado</span>
                    <Btn variant="ghost" className="px-2 py-1 text-xs" onClick={() => toggleBlock(date, t)}>Liberar</Btn>
                  </>
                ) : moving ? (
                  <Btn variant="outline" className="flex-1 py-1 text-xs" onClick={() => { updateAppointment(moving, { date, time: t }); setMoving(null); }}>Mover para cá</Btn>
                ) : (
                  <>
                    <span className="flex-1 text-sm text-muted-foreground">Livre</span>
                    <Btn variant="ghost" className="px-2 py-1 text-xs" onClick={() => toggleBlock(date, t)}>Bloquear</Btn>
                    <Btn variant="outline" className="px-2 py-1 text-xs" disabled={!walkName}
                      onClick={() => { addAppointment({ client: walkName, serviceId: walkService, date, time: t, status: "walk-in" }); setWalkName(""); }}>+ Walk-in</Btn>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </Card>
      <Card className="h-fit space-y-3">
        <h3 className="text-lg">Atendimento presencial</h3>
        <p className="text-xs text-muted-foreground">Preencha e clique em “+ Walk-in” no horário desejado.</p>
        <Field label="Nome do cliente" value={walkName} onChange={(e) => setWalkName(e.target.value)} />
        <label className="block text-sm">
          <span className="mb-1 block text-muted-foreground">Serviço</span>
          <select value={walkService} onChange={(e) => setWalkService(e.target.value)} className="w-full rounded-md border bg-input/40 px-3 py-2">
            {services.map((s) => <option key={s.id} value={s.id} className="bg-card">{s.name}</option>)}
          </select>
        </label>
      </Card>
    </div>
  );
}

function Catalogo() {
  const { services, setServices, promos, setPromos } = useStore();
  const [form, setForm] = useState({ name: "", description: "", price: "", duration: "" });
  const [promo, setPromo] = useState({ title: "", discount: "" });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card>
        <h3 className="text-lg">Serviços</h3>
        <ul className="mt-4 divide-y">
          {services.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-3 py-3">
              <div className="min-w-40 flex-1">
                <input className="w-full bg-transparent font-medium outline-none" value={s.name}
                  onChange={(e) => setServices(services.map((x) => (x.id === s.id ? { ...x, name: e.target.value } : x)))} />
                <p className="text-xs text-muted-foreground">{s.duration} min</p>
              </div>
              <span className="text-sm text-muted-foreground">R$</span>
              <input type="number" className="w-20 rounded-md border bg-input/40 px-2 py-1 text-sm" value={s.price}
                onChange={(e) => setServices(services.map((x) => (x.id === s.id ? { ...x, price: Number(e.target.value) } : x)))} />
              <Btn variant="danger" className="px-2 py-1 text-xs" onClick={() => setServices(services.filter((x) => x.id !== s.id))}>Remover</Btn>
            </li>
          ))}
        </ul>
        <div className="mt-6 grid gap-3 border-t pt-5 sm:grid-cols-2">
          <Field label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Field label="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Field label="Preço (R$)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <Field label="Duração (min)" type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
          <Btn className="sm:col-span-2" disabled={!form.name || !form.price}
            onClick={() => { setServices([...services, { id: crypto.randomUUID(), name: form.name, description: form.description, price: Number(form.price), duration: Number(form.duration) || 30 }]); setForm({ name: "", description: "", price: "", duration: "" }); }}>
            Adicionar serviço
          </Btn>
        </div>
      </Card>
      <Card className="h-fit space-y-3">
        <h3 className="text-lg">Promoções ativas</h3>
        {promos.map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-md bg-accent p-3 text-sm">
            <span>{p.title} <strong className="text-primary">-{p.discount}%</strong></span>
            <button className="text-xs text-destructive" onClick={() => setPromos(promos.filter((x) => x.id !== p.id))}>remover</button>
          </div>
        ))}
        <Field label="Título" value={promo.title} onChange={(e) => setPromo({ ...promo, title: e.target.value })} />
        <Field label="Desconto (%)" type="number" value={promo.discount} onChange={(e) => setPromo({ ...promo, discount: e.target.value })} />
        <Btn className="w-full" disabled={!promo.title || !promo.discount}
          onClick={() => { setPromos([...promos, { id: crypto.randomUUID(), title: promo.title, description: "Promoção por tempo limitado.", discount: Number(promo.discount), days: "Dias de menor movimento" }]); setPromo({ title: "", discount: "" }); }}>
          Criar promoção
        </Btn>
      </Card>
    </div>
  );
}
