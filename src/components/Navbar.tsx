import { fetchShowcaseCompanies } from "@/lib/showcase";
import { useState, useEffect, useRef } from "react";
import { Menu, X, Leaf, ShoppingCart, ChevronDown } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useCart } from "@/components/CartContext";
import { type DbAzienda } from "@/lib/catalog";

const links = [
  { href: "/#progetto", label: "Il Progetto" },
  { href: "/#territorio", label: "Il Territorio" },
  { href: "/#bottega", label: "Bottega" },
  { href: "/#blog", label: "Blog" },
  { href: "/#sostenitori", label: "Sostieni" },
  { href: "/#aderire", label: "Aderire" },
  { href: "/#contatti", label: "Contatti" },
  { href: "/profilo", label: "Profilo" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [aziende, setAziende] = useState<DbAzienda[]>([]);
  const [mobileAzOpen, setMobileAzOpen] = useState(false);
  const [azOpen, setAzOpen] = useState(false);
  const azRef = useRef<HTMLLIElement>(null);
  const { count, open: openCart } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    fetchShowcaseCompanies().then(setAziende).catch(() => setAziende([]));
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (azRef.current && !azRef.current.contains(e.target as Node)) setAzOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled || open ? "bg-cream/95 shadow-sm backdrop-blur" : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 lg:px-8">
        <a href="/#hero" className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Leaf className="h-5 w-5" />
          </span>
          <span
            className={`font-serif text-xl font-bold leading-none transition-colors ${
              scrolled || open ? "text-brown" : "text-cream"
            }`}
          >
            A.M.U.N.Ì.
          </span>
        </a>

        <ul className="hidden items-center gap-5 lg:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  scrolled ? "text-brown" : "text-cream"
                }`}
              >
                {l.label}
              </a>
            </li>
          ))}
          <li ref={azRef} className="relative" onKeyDown={(e) => { if (e.key === "Escape") { setAzOpen(false); azRef.current?.querySelector("button")?.focus(); } }}>
            <button
              aria-expanded={azOpen}
              aria-controls="imprese-desktop"
              onKeyDown={(e) => { if (e.key === "Escape") setAzOpen(false); }}
              onClick={() => setAzOpen((o) => !o)}
              className={`inline-flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary ${
                scrolled ? "text-brown" : "text-cream"
              }`}
            >
              Le Imprese
              <ChevronDown className={`h-4 w-4 transition-transform ${azOpen ? "rotate-180" : ""}`} />
            </button>
            {azOpen && (
              <ul id="imprese-desktop" className="absolute right-0 top-full mt-2 max-h-80 w-60 overflow-auto rounded-xl border border-border bg-card p-2 shadow-lg">
                <li>
                  <a
                    href="/#imprese"
                    onClick={() => setAzOpen(false)}
                    className="block rounded-md px-3 py-2 text-sm font-semibold text-brown hover:bg-muted"
                  >
                    Tutte le imprese
                  </a>
                </li>
                {aziende.length > 0 && <li className="my-1 border-t border-border" />}
                {aziende.map((a) => (
                  <li key={a.id}>
                    <Link
                      to="/aziende/$slug"
                      params={{ slug: a.slug }}
                      onClick={() => setAzOpen(false)}
                      className="block rounded-md px-3 py-2 text-sm text-brown hover:bg-muted"
                    >
                      {a.nome}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        </ul>

        <div className="flex items-center gap-3">
          <button
            aria-label="Apri carrello"
            onClick={openCart}
            className={`relative transition-colors hover:text-primary ${
              scrolled || open ? "text-brown" : "text-cream"
            }`}
          >
            <ShoppingCart className="h-6 w-6" />
            {count > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {count}
              </span>
            )}
          </button>
          <button
            aria-label={open ? "Chiudi menu" : "Apri menu"}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className={`lg:hidden ${scrolled || open ? "text-brown" : "text-cream"}`}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {open && (
        <ul className="max-h-[calc(100dvh-64px)] overflow-y-auto flex flex-col gap-1 border-t border-border bg-cream px-5 pb-4 pt-2 lg:hidden">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                onClick={() => setOpen(false)}
                className="block rounded-md px-3 py-2.5 text-sm font-medium text-brown hover:bg-muted"
              >
                {l.label}
              </a>
            </li>
          ))}
          <li className="mt-1 border-t border-border pt-2">
            <button aria-expanded={mobileAzOpen} aria-controls="imprese-mobile" onClick={() => setMobileAzOpen(o => !o)} className="flex w-full items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium text-brown">
              Le Imprese <ChevronDown className={`h-4 w-4 transition-transform ${mobileAzOpen ? "rotate-180" : ""}`} />
            </button>
            {mobileAzOpen && <div id="imprese-mobile" className="pl-3">
            <a
              href="/#imprese"
              onClick={() => setOpen(false)}
              className="block rounded-md px-3 py-2.5 text-sm font-medium text-brown hover:bg-muted"
            >
              Tutte le imprese
            </a>
            {aziende.map((a) => (
                <Link
                  key={a.id}
                  to="/aziende/$slug"
                  params={{ slug: a.slug }}
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-3 py-2.5 text-sm font-medium text-brown hover:bg-muted"
                >
                  {a.nome}
                </Link>
            ))}
            </div>}
          </li>
        </ul>
      )}
    </header>
  );
}