import { useEffect, useRef, useState } from "react";
import { Quote } from "lucide-react";
import { testimonianze } from "@/data/network";

export function Testimonials() {
  const [index, setIndex] = useState(0);
  const paused = useRef(false);

  useEffect(() => {
    const id = setInterval(() => {
      if (!paused.current) setIndex((i) => (i + 1) % testimonianze.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const t = testimonianze[index];

  return (
    <section
      id="recensioni"
      className="scroll-mt-16 bg-cream py-20 lg:py-28"
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
    >
      <div className="mx-auto max-w-4xl px-5 text-center lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">Testimonianze</p>
        <h2 className="mt-2 font-serif text-3xl font-bold sm:text-4xl">Lo dicono di noi</h2>
        <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-primary" />

        <div className="relative mt-12 min-h-[260px]">
          <Quote className="mx-auto h-12 w-12 text-primary/30" />
          <blockquote key={index} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <p className="mx-auto mt-6 max-w-2xl font-serif text-2xl italic leading-snug text-brown sm:text-3xl">
              "{t.testo}"
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/15 text-2xl" aria-hidden>
                {t.emoji}
              </span>
              <div className="text-left">
                <p className="font-semibold text-foreground">{t.nome}</p>
                <p className="text-sm text-muted-foreground">{t.citta}</p>
              </div>
            </div>
          </blockquote>
        </div>

        <div className="mt-8 flex justify-center gap-2">
          {testimonianze.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Vai alla recensione ${i + 1}`}
              className={`h-2.5 rounded-full transition-all ${i === index ? "w-8 bg-primary" : "w-2.5 bg-primary/30"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}