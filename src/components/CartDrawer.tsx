import { X, Plus, Minus, Trash2, ShoppingBag, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart, formatPrice } from "@/components/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function CartDrawer() {
  const { items, isOpen, close, increment, decrement, remove, total, clear } =
    useCart();
  const [checkout, setCheckout] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setCheckout(false);
    setNome("");
    setEmail("");
  };

  const handleClose = () => {
    reset();
    close();
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from("acquirenti").insert({
        nome,
        email,
        totale: total,
        articoli: items.map((i) => ({
          nome: i.nome,
          qty: i.qty,
          prezzo: i.prezzo,
        })),
      });
      if (error) throw error;
      toast.success("Registrazione completata! Ti contatteremo per l'ordine.");
      clear();
      reset();
      close();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Errore. Riprova.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-[60] bg-brown/50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={close}
        aria-hidden
      />
      <aside
        className={`fixed inset-y-0 right-0 z-[70] flex w-full max-w-md flex-col bg-cream shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Carrello"
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <h2 className="flex items-center gap-2 font-serif text-xl font-bold text-brown">
            <ShoppingBag className="h-5 w-5 text-primary" />{" "}
            {checkout ? "Completa l'ordine" : "Il tuo carrello"}
          </h2>
          <button aria-label="Chiudi carrello" onClick={handleClose} className="text-brown hover:text-primary">
            <X className="h-6 w-6" />
          </button>
        </div>

        {checkout ? (
          <form onSubmit={handleCheckout} className="flex flex-1 flex-col">
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              <button
                type="button"
                onClick={() => setCheckout(false)}
                className="flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <ArrowLeft className="h-4 w-4" /> Torna al carrello
              </button>
              <p className="text-sm text-muted-foreground">
                Lascia i tuoi dati: ti contatteremo per finalizzare l'ordine.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="checkout-nome">Nome e cognome</Label>
                <Input
                  id="checkout-nome"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Mario Rossi"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="checkout-email">Email</Label>
                <Input
                  id="checkout-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mario@esempio.it"
                />
              </div>
              <div className="rounded-lg border border-border bg-card p-3 text-sm">
                {items.map((i) => (
                  <div key={i.id} className="flex justify-between py-0.5">
                    <span className="text-muted-foreground">
                      {i.nome} ×{i.qty}
                    </span>
                    <span>{formatPrice(i.prezzo * i.qty)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t border-border px-6 py-5">
              <div className="mb-4 flex items-center justify-between text-lg font-bold text-brown">
                <span>Totale</span>
                <span className="text-primary">{formatPrice(total)}</span>
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? "Invio in corso..." : "Conferma registrazione"}
              </Button>
            </div>
          </form>
        ) : items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center text-muted-foreground">
            <ShoppingBag className="h-12 w-12 opacity-40" />
            <p>Il tuo carrello è vuoto.</p>
          </div>
        ) : (
          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
            {items.map((i) => (
              <div key={i.id} className="flex gap-3 rounded-xl border border-border bg-card p-3">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 font-serif text-lg font-bold text-primary">
                  {i.nome.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold leading-tight">{i.nome}</p>
                  <p className="text-xs text-muted-foreground">{i.azienda}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button aria-label="Diminuisci" onClick={() => decrement(i.id)} className="flex h-6 w-6 items-center justify-center rounded-full border border-border hover:bg-muted">
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-5 text-center text-sm font-semibold">{i.qty}</span>
                      <button aria-label="Aumenta" onClick={() => increment(i.id)} className="flex h-6 w-6 items-center justify-center rounded-full border border-border hover:bg-muted">
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <span className="text-sm font-bold text-primary">{formatPrice(i.prezzo * i.qty)}</span>
                  </div>
                </div>
                <button aria-label="Rimuovi" onClick={() => remove(i.id)} className="self-start text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {items.length > 0 && !checkout && (
          <div className="border-t border-border px-6 py-5">
            <div className="mb-4 flex items-center justify-between text-lg font-bold text-brown">
              <span>Totale</span>
              <span className="text-primary">{formatPrice(total)}</span>
            </div>
            <Button
              size="lg"
              className="w-full"
              onClick={() => setCheckout(true)}
            >
              Procedi al checkout
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Lascia i tuoi dati per essere ricontattato.
            </p>
          </div>
        )}
      </aside>
    </>
  );
}