import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Gift, Award } from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { brl, setState, uid, useStore, type Client } from "@/lib/store";

export const Route = createFileRoute("/cliente")({
  head: () => ({
    meta: [
      { title: "Minha área · Barbearia 100 Erro" },
      { name: "description", content: "Cadastre-se, veja seu histórico e acompanhe sua fidelidade." },
      { property: "og:title", content: "Minha área · Barbearia 100 Erro" },
      { property: "og:description", content: "Cadastro, histórico e fidelidade do cliente." },
    ],
  }),
  component: ClientePage,
});

const LOYALTY_GOAL = 10;

function ClientePage() {
  const s = useStore();
  const me = s.clients.find((c) => c.id === s.currentClientId);
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10">{me ? <Dashboard me={me} /> : <Cadastro />}</main>
      <SiteFooter />
    </div>
  );
}

function Cadastro() {
  const s = useStore();
  const [f, setF] = useState({ name: "", phone: "", email: "", birthday: "", planId: "" });
  const [loginPhone, setLoginPhone] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name || !f.phone) { toast.error("Nome e WhatsApp são obrigatórios"); return; }
    if (s.clients.some((c) => c.phone === f.phone)) { toast.error("WhatsApp já cadastrado — use Entrar"); return; }
    const c: Client = { id: uid(), ...f, planId: f.planId || undefined };
    setState((st) => ({ ...st, clients: [...st.clients, c], currentClientId: c.id }));
    toast.success("Cadastro feito!");
  };
  const login = () => {
    const c = s.clients.find((x) => x.phone === loginPhone);
    if (!c) { toast.error("WhatsApp não encontrado"); return; }
    setState((st) => ({ ...st, currentClientId: c.id }));
  };
  return (
    <div className="grid gap-8 md:grid-cols-[1.4fr_1fr]">
      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <h1 className="font-display text-3xl">Cadastro do cliente</h1>
        {([["name", "Nome completo", "text"], ["phone", "WhatsApp", "tel"], ["email", "E-mail", "email"], ["birthday", "Data de aniversário", "date"]] as const).map(([k, l, t]) => (
          <div key={k} className="space-y-1"><Label htmlFor={k}>{l}</Label><Input id={k} type={t} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></div>
        ))}
        <div className="space-y-1">
          <Label htmlFor="plan">Plano (opcional)</Label>
          <select id="plan" value={f.planId} onChange={(e) => setF({ ...f, planId: e.target.value })} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Sem plano</option>
            {s.plans.map((p) => <option key={p.id} value={p.id}>{p.name} · {brl(p.price)}</option>)}
          </select>
        </div>
        <p className="flex items-center gap-2 text-sm text-muted-foreground"><Gift className="h-4 w-4 text-primary" /> Aniversariante ganha vantagens exclusivas.</p>
        <Button type="submit" className="w-full">Criar cadastro</Button>
      </form>
      <div className="h-fit space-y-3 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-2xl">Já tenho cadastro</h2>
        <Input placeholder="Seu WhatsApp" value={loginPhone} onChange={(e) => setLoginPhone(e.target.value)} />
        <Button variant="outline" className="w-full" onClick={login}>Entrar</Button>
      </div>
    </div>
  );
}

function Dashboard({ me }: { me: Client }) {
  const s = useStore();
  const [f, setF] = useState(me);
  const mine = s.bookings.filter((b) => b.clientId === me.id || b.phone === me.phone).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  const visits = mine.filter((b) => b.status === "concluido").length;
  const plan = s.plans.find((p) => p.id === me.planId);
  const save = () => { setState((st) => ({ ...st, clients: st.clients.map((c) => (c.id === me.id ? f : c)) })); toast.success("Dados salvos"); };
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl">Olá, {me.name.split(" ")[0]}!</h1>
        <Button variant="ghost" onClick={() => setState((st) => ({ ...st, currentClientId: undefined }))}>Sair</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-primary bg-primary/10 p-6">
          <p className="flex items-center gap-2 font-display text-xl"><Award className="h-5 w-5 text-primary" /> Fidelidade</p>
          <p className="mt-2 text-sm text-muted-foreground">{visits} de {LOYALTY_GOAL} visitas para ganhar um corte grátis</p>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-muted"><div className="h-full bg-gradient-brand" style={{ width: `${Math.min(100, (visits / LOYALTY_GOAL) * 100)}%` }} /></div>
          <p className="mt-4 text-sm">Plano: <strong>{plan ? `${plan.name} (${brl(plan.price)}/mês)` : "Nenhum"}</strong></p>
        </div>
        <div className="space-y-3 rounded-2xl border border-border bg-card p-6">
          <p className="font-display text-xl">Meus dados</p>
          <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Nome" />
          <Input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="E-mail" />
          <Input type="date" value={f.birthday} onChange={(e) => setF({ ...f, birthday: e.target.value })} />
          <select value={f.planId ?? ""} onChange={(e) => setF({ ...f, planId: e.target.value || undefined })} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Sem plano</option>
            {s.plans.map((p) => <option key={p.id} value={p.id}>{p.name} · {brl(p.price)}</option>)}
          </select>
          <Button onClick={save} className="w-full">Salvar</Button>
        </div>
      </div>
      <div>
        <h2 className="font-display text-2xl">Histórico</h2>
        {mine.length === 0 ? <p className="mt-3 text-muted-foreground">Nenhum atendimento ainda. <Link to="/" className="text-primary underline">Agende agora</Link>.</p> : (
          <ol className="mt-4 space-y-3 border-l-2 border-primary pl-5">
            {mine.map((b) => {
              const sv = s.services.find((x) => x.id === b.serviceId);
              return (
                <li key={b.id} className="rounded-lg border border-border bg-card p-4">
                  <p className="font-semibold">{sv?.name} · {brl(sv?.price ?? 0)}</p>
                  <p className="text-sm text-muted-foreground">{b.date.split("-").reverse().join("/")} às {b.time} · {b.status}</p>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
