export type Service = { id: string; name: string; description: string; price: number; duration: number };
export type Promo = { id: string; title: string; description: string; discount: number; days: string };
export type Appointment = { id: string; client: string; serviceId: string; date: string; time: string; status: "confirmado" | "pendente" | "walk-in" };

export const services: Service[] = [
  { id: "corte", name: "Corte Clássico", description: "Tesoura e máquina, acabamento na navalha e lavagem.", price: 50, duration: 40 },
  { id: "barba", name: "Barba Completa", description: "Toalha quente, óleo pré-barba e navalha.", price: 40, duration: 30 },
  { id: "combo", name: "Corte + Barba", description: "O ritual completo da casa.", price: 80, duration: 70 },
  { id: "degrade", name: "Degradê Navalhado", description: "Fade preciso com transição suave.", price: 60, duration: 45 },
];

export const promos: Promo[] = [
  { id: "p1", title: "Terça do Combo", description: "Corte + Barba com desconto nas terças e quartas.", discount: 20, days: "Ter • Qua" },
  { id: "p2", title: "Pacote Mensal", description: "4 cortes por mês com preço fechado.", discount: 15, days: "Todos os dias" },
];

export const hours = [
  { day: "Seg", time: "Fechado" },
  { day: "Ter – Sex", time: "09h – 20h" },
  { day: "Sáb", time: "08h – 18h" },
  { day: "Dom", time: "Fechado" },
];

export const timeSlots = ["09:00","09:45","10:30","11:15","13:00","13:45","14:30","15:15","16:00","16:45","17:30","18:15","19:00"];

export const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const toKey = (d: Date) => d.toISOString().slice(0, 10);

const today = new Date();
const k = (offset: number) => { const d = new Date(today); d.setDate(d.getDate() + offset); return toKey(d); };

export const initialAppointments: Appointment[] = [
  { id: "a1", client: "Rafael Souza", serviceId: "combo", date: k(0), time: "09:45", status: "confirmado" },
  { id: "a2", client: "Lucas Pereira", serviceId: "corte", date: k(0), time: "11:15", status: "confirmado" },
  { id: "a3", client: "Bruno Lima", serviceId: "barba", date: k(0), time: "14:30", status: "pendente" },
  { id: "a4", client: "Diego Alves", serviceId: "degrade", date: k(1), time: "10:30", status: "confirmado" },
  { id: "a5", client: "Thiago Rocha", serviceId: "corte", date: k(1), time: "16:00", status: "confirmado" },
];
