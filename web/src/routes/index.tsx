import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import hero from "@/assets/hero.jpg";
import { Badge, Btn, Card, Field, TopNav } from "@/components/ui-kit";
import { brl, hours, timeSlots, toKey } from "@/lib/data";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Barbearia 100 Erro — Agende seu horário online" },
      { name: "description", content: "Catálogo de serviços, promoções e agendamento online com pagamento antecipado na Barbearia 100 Erro." },
      { property: "og:title", content: "Barbearia 100 Erro — Agende online" },
      { property: "og:description", content: "Escolha o serviço, o horário e garanta sua vaga em segundos." },
    ],
  }),
  component: Catalog,
});

const weekday = (d: Date) => d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");

function Catalog() {
  const { services, promos, appointments, blocked, addAppointment } = useStore();
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [step, setStep] = useState<"select" | "checkout" | "done">("select");
  const [payMode, setPayMode] = useState<"sinal" | "total">("sinal");
  const [name, setName] = useState("");

  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return d; }), []);
  const service = services.find((s) => s.id === serviceId);
  const taken = (t: string) => !!date && (appointments.some((a) => a.date === date && a.time === t) || blocked.includes(`${date}|${t}`));
  const closed = (d: Date) => d.getDay() === 0 || d.getDay() === 1;
  const amount = service ? (payMode === "sinal" ? service.price * 0.3 : service.price) : 0;

  const confirm = () => {
    if (!service || !date || !time) return;
    addAppointment({ client: name || "Cliente", serviceId: service.id, date, time, status: "confirmado" });
    setStep("done");
  };
  const reset = () => { setServiceId(null); setDate(null); setTime(null); setStep("select"); setName(""); };

  return (
    <div className="min-h-screen">
      <TopNav />

      <section className="relative overflow-hidden">
        <img src={hero} alt="Interior da Barbearia 100 Erro" width={1600} height={912} className="absolute inset-0 h-full w-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-fade" />
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-24 md:pt-36">
          <p className="mb-3 text-xs uppercase tracking-[0.3em] text-primary">Desde 2015 • Navalha & Tradição</p>
          <h1 className="max-w-2xl text-4xl leading-tight md:text-6xl">
            Estilo afiado, <span className="text-gold">sem erro.</span>
          </h1>
          <p className="mt-4 max-w-lg text-muted-foreground">Escolha seu serviço, reserve o horário e garanta sua cadeira com pagamento antecipado.</p>
          <a href="#agendar"><Btn className="mt-8">Agendar agora</Btn></a>
          <div className="mt-10 flex flex-wrap gap-3">
            {hours.map((h) => (
              <div key={h.day} className="rounded-md border bg-card/70 px-3 py-2 text-xs backdrop-blur">
                <span className="text-muted-foreground">{h.day}</span> <span className="ml-1 font-semibold">{h.time}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-10 md:grid-cols-2">
        {promos.map((p) => (
          <div key={p.id} className="relative overflow-hidden rounded-xl border border-primary/40 bg-accent p-6">
            <div className="absolute -right-6 -top-6 grid h-28 w-28 place-items-center rounded-full bg-gold font-display text-2xl font-bold text-primary-foreground">-{p.discount}%</div>
            <Badge>{p.days}</Badge>
            <h3 className="mt-3 text-2xl">{p.title}</h3>
            <p className="mt-1 max-w-[70%] text-sm text-muted-foreground">{p.description}</p>
          </div>
        ))}
      </section>

      <section id="agendar" className="mx-auto max-w-6xl px-4 pb-24">
        {step === "done" ? (
          <Card className="mx-auto max-w-md text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success/15 text-2xl text-success">✓</div>
            <h2 className="mt-4 text-2xl">Horário garantido!</h2>
            <p className="mt-2 text-muted-foreground">{service?.name} • {date && new Date(date + "T12:00").toLocaleDateString("pt-BR")} às {time}</p>
            <p className="mt-1 text-sm text-muted-foreground">Pago: {brl(amount)}</p>
            <Btn className="mt-6" variant="outline" onClick={reset}>Novo agendamento</Btn>
          </Card>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="space-y-10">
              <div>
                <h2 className="text-3xl">1. Escolha o serviço</h2>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {services.map((s) => (
                    <button key={s.id} onClick={() => setServiceId(s.id)}
                      className={cn("rounded-xl border bg-card p-4 text-left transition hover:border-primary/60", serviceId === s.id && "border-primary shadow-gold")}>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-lg">{s.name}</h3>
                        <span className="font-semibold text-primary">{brl(s.price)}</span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
                      <p className="mt-2 text-xs text-muted-foreground">⏱ {s.duration} min</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-3xl">2. Data e horário</h2>
                <div className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-2">
                  {days.map((d) => {
                    const key = toKey(d);
                    return (
                      <button key={key} disabled={closed(d)} onClick={() => { setDate(key); setTime(null); }}
                        className={cn("flex min-w-16 flex-col items-center rounded-lg border bg-card px-3 py-2 transition disabled:opacity-30",
                          date === key ? "border-primary bg-accent text-primary" : "hover:border-primary/50")}>
                        <span className="text-xs uppercase text-muted-foreground">{weekday(d)}</span>
                        <span className="font-display text-xl">{d.getDate()}</span>
                      </button>
                    );
                  })}
                </div>
                {date ? (
                  <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {timeSlots.map((t) => (
                      <button key={t} disabled={taken(t)} onClick={() => setTime(t)}
                        className={cn("rounded-md border py-2 text-sm transition disabled:cursor-not-allowed disabled:line-through disabled:opacity-30",
                          time === t ? "border-primary bg-gold text-primary-foreground" : "bg-card hover:border-primary/50")}>
                        {t}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-muted-foreground">Selecione um dia para ver os horários livres.</p>
                )}
              </div>
            </div>

            <aside className="lg:sticky lg:top-20 lg:self-start">
              <Card className="space-y-4">
                <h3 className="text-xl">{step === "checkout" ? "3. Pagamento" : "Resumo"}</h3>
                <dl className="space-y-2 text-sm">
                  <Row k="Serviço" v={service?.name ?? "—"} />
                  <Row k="Data" v={date ? new Date(date + "T12:00").toLocaleDateString("pt-BR") : "—"} />
                  <Row k="Horário" v={time ?? "—"} />
                  <Row k="Valor" v={service ? brl(service.price) : "—"} />
                </dl>
                {step === "select" ? (
                  <Btn className="w-full" disabled={!service || !date || !time} onClick={() => setStep("checkout")}>Continuar para pagamento</Btn>
                ) : (
                  <div className="space-y-3 border-t pt-4">
                    <div className="grid grid-cols-2 gap-2">
                      {(["sinal", "total"] as const).map((m) => (
                        <button key={m} onClick={() => setPayMode(m)}
                          className={cn("rounded-md border p-2 text-xs", payMode === m ? "border-primary bg-accent text-primary" : "bg-secondary")}>
                          {m === "sinal" ? "Sinal 30%" : "Valor total"}<br />
                          <strong className="text-sm">{service && brl(m === "sinal" ? service.price * 0.3 : service.price)}</strong>
                        </button>
                      ))}
                    </div>
                    <Field label="Seu nome" value={name} onChange={(e) => setName(e.target.value)} placeholder="João Silva" />
                    <Field label="Cartão" placeholder="0000 0000 0000 0000" />
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="Validade" placeholder="MM/AA" />
                      <Field label="CVV" placeholder="123" />
                    </div>
                    <Btn className="w-full" onClick={confirm}>Pagar {brl(amount)}</Btn>
                    <button className="w-full text-xs text-muted-foreground hover:text-foreground" onClick={() => setStep("select")}>Voltar</button>
                    <p className="text-center text-[11px] text-muted-foreground">Pagamento simulado • nenhuma cobrança real</p>
                  </div>
                )}
              </Card>
            </aside>
          </div>
        )}
      </section>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between"><dt className="text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>;
}
