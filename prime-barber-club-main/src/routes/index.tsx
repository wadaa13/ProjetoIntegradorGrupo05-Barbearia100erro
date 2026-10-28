import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Clock, Scissors, Check, CreditCard, Tag } from "lucide-react";
import logo from "@/assets/logo.jpg.asset.json";
import { Reviews } from "@/components/Reviews";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEPOSIT_RATE, HOURS, SLOTS, WEEKDAYS, activePromo, brl, isSlotTaken, priceFor, setState, toISO, uid, useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Barbearia 100 Erro · Agende seu horário" },
      { name: "description", content: "Corte, barba e planos mensais. Agende online na Barbearia 100 Erro." },
      { property: "og:title", content: "Barbearia 100 Erro · Agende seu horário" },
      { property: "og:description", content: "Corte, barba e planos mensais. Agende online." },
    ],
  }),
  component: Index,
});

const WEEK = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function Index() {
  const s = useStore();
  const days = useMemo(() => {
    const out: Date[] = [];
    const d = new Date();
    while (out.length < 14) { if (d.getDay() !== 0) out.push(new Date(d)); d.setDate(d.getDate() + 1); }
    return out;
  }, []);
  const [serviceId, setServiceId] = useState<string>();
  const [date, setDate] = useState(toISO(days[0] ?? new Date()));
  const [time, setTime] = useState<string>();
  const [step, setStep] = useState<"pick" | "pay" | "done">("pick");
  const me = s.clients.find((c) => c.id === s.currentClientId);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const service = s.services.find((x) => x.id === serviceId);
  const promos = s.promos.filter((p) => p.active);

  const confirm = (payFull: boolean) => {
    if (!service || !time) return;
    const n = me?.name ?? name, p = me?.phone ?? phone;
    if (!n || !p) { toast.error("Informe nome e telefone"); return; }
    setState((st) => ({ ...st, bookings: [...st.bookings, { id: uid(), clientId: me?.id, clientName: n, phone: p, serviceId: service.id, date, time, paid: payFull, status: "agendado" }] }));
    setStep("done");
    toast.success("Horário reservado!");
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 md:grid-cols-2">
        <div>
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/40 px-3 py-1 text-sm text-primary"><Clock className="h-4 w-4" /> {HOURS.label}</p>
          <h1 className="font-display text-5xl leading-tight md:text-6xl">Seu corte, <span className="text-primary">100 erro.</span></h1>
          <p className="mt-4 max-w-md text-muted-foreground">Escolha o serviço, o dia e o horário. Sem fila, sem mensagem perdida no WhatsApp.</p>
          <Button asChild size="lg" className="mt-6"><a href="#agendar">Agendar agora</a></Button>
        </div>
        <img src={logo.url} alt="Logo Barbearia 100 Erro" className="mx-auto w-full max-w-sm rounded-2xl shadow-glow" />
      </section>

      {promos.length > 0 && (
        <section className="mx-auto max-w-6xl px-4">
          {promos.map((p) => (
            <div key={p.id} className="mb-3 flex items-center gap-4 rounded-xl bg-gradient-brand p-5 text-primary-foreground">
              <Tag className="h-6 w-6 shrink-0" />
              <div><p className="font-display text-xl">{p.title}</p><p className="text-sm opacity-90">{p.text}</p></div>
            </div>
          ))}
        </section>
      )}

      <section id="agendar" className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="font-display text-3xl">1. Escolha o serviço</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {s.services.map((sv) => {
            const promo = activePromo(s, sv.id, date);
            const price = priceFor(s, sv.id, date);
            return (
            <button key={sv.id} onClick={() => { setServiceId(sv.id); setStep("pick"); }}
              className={`rounded-xl border p-5 text-left transition hover:border-primary ${serviceId === sv.id ? "border-primary bg-primary/10" : "border-border bg-card"}`}>
              <div className="flex items-start justify-between gap-2">
                <span className="flex items-center gap-2 font-display text-xl"><Scissors className="h-4 w-4 text-primary" />{sv.name}</span>
                <span className="whitespace-nowrap text-right font-display text-xl text-primary">
                  {promo && <span className="mr-1 text-sm text-muted-foreground line-through">{brl(sv.price)}</span>}
                  {brl(price)}
                </span>
              </div>
              {promo && promo.weekday !== undefined && (
                <p className="mt-1 text-xs font-semibold text-primary">Promoção de {WEEKDAYS[promo.weekday]} · {brl(promo.price as number)}</p>
              )}
              <p className="mt-2 text-sm text-muted-foreground">{sv.description}</p>
              <p className="mt-1 text-xs text-muted-foreground">{sv.duration} min</p>
            </button>
            );
          })}
        </div>

        <h2 className="mt-12 font-display text-3xl">2. Dia e horário</h2>
        <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
          {days.map((d) => {
            const iso = toISO(d);
            return (
              <button key={iso} onClick={() => { setDate(iso); setTime(undefined); }}
                className={`min-w-16 shrink-0 rounded-lg border px-3 py-2 text-center ${date === iso ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}>
                <div className="text-xs">{WEEK[d.getDay()]}</div><div className="font-display text-xl">{d.getDate()}</div>
              </button>
            );
          })}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-8">
          {SLOTS.map((t) => {
            const taken = isSlotTaken(s, date, t);
            return (
              <button key={t} disabled={taken} onClick={() => setTime(t)}
                className={`rounded-md border py-2 text-sm ${taken ? "cursor-not-allowed border-border text-muted-foreground line-through opacity-40" : time === t ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary"}`}>
                {t}
              </button>
            );
          })}
        </div>

        <h2 className="mt-12 font-display text-3xl">3. Confirmação</h2>
        <div className="mt-5 rounded-xl border border-border bg-card p-6">
          {step === "done" ? (
            <div className="text-center">
              <Check className="mx-auto h-10 w-10 text-primary" />
              <p className="mt-2 font-display text-2xl">Tudo certo!</p>
              <p className="text-muted-foreground">{service?.name} em {date.split("-").reverse().join("/")} às {time} · {brl(priceFor(s, serviceId ?? "", date))}</p>
              <Button variant="outline" className="mt-4" onClick={() => { setStep("pick"); setTime(undefined); }}>Novo agendamento</Button>
            </div>
          ) : !service || !time ? (
            <p className="text-muted-foreground">Selecione um serviço e um horário acima.</p>
          ) : (
            <div className="space-y-4">
              {(() => { const price = priceFor(s, service.id, date); return (
              <p><strong>{service.name}</strong> · {date.split("-").reverse().join("/")} às {time} · <span className="text-primary">{brl(price)}</span>
                {price < service.price && <span className="ml-2 text-xs text-muted-foreground line-through">{brl(service.price)}</span>}
                {price < service.price && <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">promoção</span>}
              </p>
              ) })()}
              {me ? <p className="text-sm text-muted-foreground">Agendando como {me.name}</p> : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} />
                  <Input placeholder="WhatsApp" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  <p className="text-sm text-muted-foreground sm:col-span-2">Já é cliente? <Link to="/cliente" className="text-primary underline">Faça seu cadastro</Link> para ver seu histórico.</p>
                </div>
              )}
              {step === "pick" ? <Button onClick={() => setStep("pay")}><CreditCard className="h-4 w-4" /> Ir para pagamento</Button> : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button variant="outline" onClick={() => confirm(false)}>Pagar sinal {brl(priceFor(s, service.id, date) * DEPOSIT_RATE)}</Button>
                  <Button onClick={() => confirm(true)}>Pagar total {brl(priceFor(s, service.id, date))}</Button>
                  <p className="text-xs text-muted-foreground sm:col-span-2">Pagamento simulado — nenhuma cobrança real é feita.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="font-display text-3xl">Planos mensais</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {s.plans.map((p, i) => (
            <div key={p.id} className={`rounded-2xl border p-6 ${i === 2 ? "border-primary bg-primary/10 shadow-glow" : "border-border bg-card"}`}>
              <p className="font-display text-2xl">{p.name}</p>
              <p className="mt-2 font-display text-4xl text-primary">{brl(p.price)}<span className="text-base text-muted-foreground">/mês</span></p>
              <p className="mt-3 text-sm text-muted-foreground">{p.description}</p>
              <Button asChild variant={i === 2 ? "default" : "outline"} className="mt-5 w-full"><Link to="/cliente">Quero esse</Link></Button>
            </div>
          ))}
        </div>
      </section>
      <Reviews />
      <SiteFooter />
    </div>
  );
}
