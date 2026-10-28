import { createContext, useContext, useState, type ReactNode } from "react";
import { initialAppointments, promos as initialPromos, services as initialServices, type Appointment, type Promo, type Service } from "./data";

type Store = {
  services: Service[];
  setServices: (s: Service[]) => void;
  promos: Promo[];
  setPromos: (p: Promo[]) => void;
  appointments: Appointment[];
  addAppointment: (a: Omit<Appointment, "id">) => void;
  updateAppointment: (id: string, patch: Partial<Appointment>) => void;
  removeAppointment: (id: string) => void;
  blocked: string[]; // "date|time"
  toggleBlock: (date: string, time: string) => void;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [services, setServices] = useState(initialServices);
  const [promos, setPromos] = useState(initialPromos);
  const [appointments, setAppointments] = useState(initialAppointments);
  const [blocked, setBlocked] = useState<string[]>([]);
  return (
    <Ctx.Provider
      value={{
        services, setServices, promos, setPromos, appointments, blocked,
        addAppointment: (a) => setAppointments((p) => [...p, { ...a, id: crypto.randomUUID() }]),
        updateAppointment: (id, patch) => setAppointments((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x))),
        removeAppointment: (id) => setAppointments((p) => p.filter((x) => x.id !== id)),
        toggleBlock: (date, time) => {
          const key = `${date}|${time}`;
          setBlocked((b) => (b.includes(key) ? b.filter((x) => x !== key) : [...b, key]));
        },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore outside provider");
  return s;
}
