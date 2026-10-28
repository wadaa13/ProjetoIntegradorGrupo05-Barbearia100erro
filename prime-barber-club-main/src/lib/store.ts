import { useSyncExternalStore } from "react";

export type Service = { id: string; name: string; price: number; duration: number; description: string };
export type Plan = { id: string; name: string; price: number; description: string };
export type Client = { id: string; name: string; phone: string; email: string; birthday: string; planId?: string | undefined };
export type Booking = {
  id: string;
  clientId?: string | undefined;
  clientName: string;
  phone: string;
  serviceId: string;
  date: string; // yyyy-mm-dd
  time: string; // HH:mm
  paid: boolean;
  walkIn?: boolean | undefined;
  status: "agendado" | "concluido" | "cancelado";
};
export type Promo = {
  id: string;
  title: string;
  text: string;
  active: boolean;
  serviceId?: string | undefined; // só vale para este serviço
  weekday?: number | undefined; // 0=Dom ... 6=Sáb
  price?: number | undefined; // preço promocional
};
export type Review = {
  id: string;
  author: string;
  text: string;
  rating: number; // 1 a 5
  date: string; // yyyy-mm-dd
};

export type State = {
  schema: number;
  services: Service[];
  plans: Plan[];
  clients: Client[];
  bookings: Booking[];
  blocked: string[]; // "yyyy-mm-dd HH:mm"
  promos: Promo[];
  reviews: Review[];
  currentClientId?: string | undefined;
};

export const HOURS = { open: "10:00", close: "18:30", label: "Seg a Sáb · 10h às 18h30" };
// Horários de 40 em 40 minutos, das 10:00 até o último que termina às 18:30.
export const SLOTS = (() => {
  const out: string[] = [];
  const start = 10 * 60, end = 18 * 60 + 30, step = 40;
  for (let m = start; m + step <= end; m += step) {
    out.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  }
  return out;
})();
export const DEPOSIT_RATE = 0.3;
export const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
export const MAPS_URL = "https://maps.app.goo.gl/6kzqDmy3GBdxwZf67";
export const MAP = { lat: -23.9935101, lng: -46.2800968, z: 17, street: "Rua Luiz Felipe Machado", area: "Vila Santa Rosa · Guarujá · SP", zip: "11431-130" };

const SCHEMA = 3;

const initial: State = {
  schema: SCHEMA,
  services: [
    { id: "corte", name: "Corte", price: 50, duration: 40, description: "Corte masculino com acabamento na navalha." },
    { id: "corte-barba", name: "Corte e barba", price: 70, duration: 60, description: "Combo completo: corte e barba alinhada." },
    { id: "barba", name: "Barba", price: 25, duration: 30, description: "Barba modelada com toalha quente." },
    { id: "sobrancelha", name: "Sobrancelha", price: 10, duration: 10, description: "Limpeza e alinhamento da sobrancelha." },
    { id: "pezinho", name: "Pezinho", price: 20, duration: 15, description: "Acabamento do contorno entre cortes." },
  ],
  plans: [
    { id: "prata", name: "Plano Prata", price: 160, description: "O plano só inclui corte, um serviço por vez na semana." },
    { id: "ouro", name: "Plano Ouro", price: 200, description: "O plano inclui corte e barba, um serviço por vez na semana." },
    { id: "prime", name: "Plano Prime", price: 230, description: "O plano é ilimitado, podendo realizar corte e barba por tempo e vezes ilimitadas." },
  ],
  clients: [],
  bookings: [],
  blocked: [],
  promos: [
    {
      id: "terca-corte",
      title: "Terça-feira · Corte por R$ 35",
      text: "Todas as terças-feiras os cortes saem por R$ 35. Escolha uma terça no calendário e o valor já vem certo.",
      active: true,
      serviceId: "corte",
      weekday: 2,
      price: 35,
    },
  ],
  reviews: [],
};

const KEY = "barbearia100erro:v1";
let state: State = initial;
let loaded = false;
const listeners = new Set<() => void>();

// Dados antigos guardados no aparelho ganham os planos, as promoções e as avaliações novas.
function migrate(parsed: Partial<State>): State {
  const v = typeof parsed.schema === "number" ? parsed.schema : 1;
  if (v >= SCHEMA) return { ...initial, ...parsed } as State;
  return {
    ...initial,
    ...parsed,
    schema: SCHEMA,
    plans: initial.plans,
    promos: initial.promos,
    reviews: initial.reviews,
  };
}

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = migrate(JSON.parse(raw) as Partial<State>);
  } catch {}
}

export function setState(fn: (s: State) => State) {
  load();
  state = fn(state);
  localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
}

export function useStore(): State {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      if (!loaded) { load(); l(); }
      return () => listeners.delete(l);
    },
    () => state,
    () => initial,
  );
}

export const uid = () => Math.random().toString(36).slice(2, 10);
export const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const toISO = (d: Date) => {
  const z = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
};

export function weekdayOf(dateISO: string) {
  const [y, m, d] = dateISO.split("-").map(Number);
  if (!y || !m || !d) return -1;
  return new Date(y, m - 1, d).getDay();
}

export function isSlotTaken(s: State, date: string, time: string) {
  return s.blocked.includes(`${date} ${time}`) || s.bookings.some((b) => b.date === date && b.time === time && b.status !== "cancelado");
}

export function activePromo(s: State, serviceId: string, dateISO: string) {
  const wd = weekdayOf(dateISO);
  return s.promos.find(
    (p) => p.active && p.serviceId === serviceId && p.weekday === wd && typeof p.price === "number",
  );
}

// Preço de verdade daquele serviço naquele dia (com a promoção da terça, se houver).
export function priceFor(s: State, serviceId: string, dateISO: string) {
  const base = s.services.find((x) => x.id === serviceId)?.price ?? 0;
  const p = activePromo(s, serviceId, dateISO);
  return p ? Math.min(p.price as number, base) : base;
}
