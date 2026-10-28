import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Badge, Btn, Card, Field, TopNav } from "@/components/ui-kit";
import { brl } from "@/lib/data";

export const Route = createFileRoute("/cliente")({
  head: () => ({
    meta: [
      { title: "Minha conta — Barbearia 100 Erro" },
      { name: "description", content: "Seu perfil, histórico de cortes e programa de fidelidade da Barbearia 100 Erro." },
      { property: "og:title", content: "Minha conta — Barbearia 100 Erro" },
      { property: "og:description", content: "Histórico, fidelidade e vantagens de aniversário." },
    ],
  }),
  component: Cliente,
});

const history = [
  { date: "2026-10-04", service: "Corte + Barba", barber: "Marcão", price: 80, note: "Degradê baixo, barba alinhada" },
  { date: "2026-09-13", service: "Corte Clássico", barber: "Marcão", price: 50, note: "Tesoura em cima, máquina 2 nas laterais" },
  { date: "2026-08-22", service: "Degradê Navalhado", barber: "Jefinho", price: 60, note: "Fade médio" },
  { date: "2026-07-30", service: "Corte + Barba", barber: "Marcão", price: 80, note: "" },
  { date: "2026-07-05", service: "Barba Completa", barber: "Jefinho", price: 40, note: "Toalha quente" },
  { date: "2026-06-14", service: "Corte Clássico", barber: "Marcão", price: 50, note: "" },
  { date: "2026-05-20", service: "Corte Clássico", barber: "Marcão", price: 50, note: "" },
];
const GOAL = 10;

function Cliente() {
  const [profile, setProfile] = useState({ name: "Rafael Souza", phone: "(11) 98888-7777", email: "rafael@email.com", birthday: "1994-11-02" });
  const [saved, setSaved] = useState(false);
  const visits = history.length;
  const pct = (visits / GOAL) * 100;

  return (
    <div className="min-h-screen">
      <TopNav />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <p className="text-sm text-muted-foreground">Bem-vindo de volta,</p>
        <h1 className="text-3xl">{profile.name}</h1>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            <Card className="border-primary/40 bg-accent">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-widest text-accent-foreground">Cartão fidelidade</p>
                  <p className="mt-1 font-display text-3xl">{visits} <span className="text-lg text-muted-foreground">/ {GOAL} visitas</span></p>
                </div>
                <Badge>Faltam {GOAL - visits} para um corte grátis</Badge>
              </div>
              <div className="mt-4 grid grid-cols-10 gap-1.5">
                {Array.from({ length: GOAL }).map((_, i) => (
                  <div key={i} className={i < visits ? "aspect-square rounded-full bg-gold" : "aspect-square rounded-full border border-primary/40"} />
                ))}
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-secondary"><div className="h-full bg-gold" style={{ width: `${pct}%` }} /></div>
            </Card>

            <Card>
              <h2 className="text-xl">Histórico de serviços</h2>
              <ol className="relative mt-5 space-y-6 border-l border-primary/30 pl-6">
                {history.map((h) => (
                  <li key={h.date} className="relative">
                    <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-gold" />
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="text-lg">{h.service}</h3>
                      <span className="text-sm text-primary">{brl(h.price)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{new Date(h.date + "T12:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })} • com {h.barber}</p>
                    {h.note && <p className="mt-1 text-sm text-muted-foreground">“{h.note}”</p>}
                  </li>
                ))}
              </ol>
            </Card>
          </div>

          <Card className="h-fit space-y-3">
            <h2 className="text-xl">Meus dados</h2>
            <Field label="Nome" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
            <Field label="WhatsApp" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
            <Field label="E-mail" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
            <Field label="Aniversário" type="date" value={profile.birthday} onChange={(e) => setProfile({ ...profile, birthday: e.target.value })} />
            <p className="rounded-md bg-accent p-2 text-xs text-accent-foreground">🎁 No mês do seu aniversário você ganha 30% de desconto em qualquer serviço.</p>
            <Btn className="w-full" onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}>{saved ? "Salvo ✓" : "Salvar alterações"}</Btn>
          </Card>
        </div>
      </div>
    </div>
  );
}
