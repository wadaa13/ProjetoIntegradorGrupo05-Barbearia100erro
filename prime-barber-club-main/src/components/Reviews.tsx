import { ExternalLink, Quote, Star } from "lucide-react";
import { MAPS_URL, useStore, type Review } from "@/lib/store";

function Stars({ value, className = "h-4 w-4" }: { value: number; className?: string }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${value.toFixed(1)} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${className} ${value >= i - 0.5 ? "fill-primary text-primary" : "text-muted-foreground/40"}`}
        />
      ))}
    </span>
  );
}

export function Reviews() {
  const s = useStore();
  const list: Review[] = [...s.reviews].sort((a, b) => b.date.localeCompare(a.date));
  const avg = list.length ? list.reduce((a, r) => a + r.rating, 0) / list.length : 0;

  return (
    <section className="mx-auto max-w-6xl px-4 pb-16">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl">Avaliações</h2>
          {list.length > 0 && (
            <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Stars value={avg} /> {avg.toFixed(1)} · {list.length} {list.length === 1 ? "avaliação" : "avaliações"}
            </p>
          )}
        </div>
        <a
          href={MAPS_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-primary/50 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10"
        >
          <ExternalLink className="h-4 w-4" /> Ver e avaliar no Google
        </a>
      </div>

      {list.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-border bg-card p-6">
          <p className="font-display text-xl">Ainda não há avaliações publicadas aqui</p>
          <p className="mt-2 max-w-lg text-sm text-muted-foreground">
            Você pode ler e deixar sua avaliação direto no perfil do Google da barbearia — leva poucos segundos.
          </p>
          <a
            href={MAPS_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            <ExternalLink className="h-4 w-4" /> Abrir no Google
          </a>
        </div>
      ) : (
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {list.map((r) => (
            <figure key={r.id} className="rounded-2xl border border-border bg-card p-5">
              <Quote className="h-5 w-5 text-primary" />
              <blockquote className="mt-3 text-sm text-foreground">{r.text}</blockquote>
              <figcaption className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3">
                <span className="text-sm font-semibold">{r.author}</span>
                <Stars value={r.rating} />
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        Avaliações publicadas pela própria barbearia. Para que elas apareçam sozinhas a partir do Google, é preciso
        conectar a conta do Google desta barbearia ao site.
      </p>
    </section>
  );
}
