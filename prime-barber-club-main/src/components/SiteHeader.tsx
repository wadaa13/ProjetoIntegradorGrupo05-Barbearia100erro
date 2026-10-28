import { Link } from "@tanstack/react-router";
import logo from "@/assets/logo.jpg.asset.json";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex min-w-0 items-center gap-3">
          <img src={logo.url} alt="Barbearia 100 Erro" className="h-11 w-11 shrink-0 rounded-md object-cover" />
          <span className="truncate font-display text-xl">100 Erro</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link to="/" activeOptions={{ exact: true }} activeProps={{ className: "text-primary" }} className="rounded-md px-3 py-2 hover:text-primary">Agendar</Link>
          <Link to="/cliente" activeProps={{ className: "text-primary" }} className="rounded-md px-3 py-2 hover:text-primary">Minha área</Link>
        </nav>
      </div>
    </header>
  );
}
