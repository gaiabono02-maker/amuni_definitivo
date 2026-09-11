import { certEmoji, certLabels, type CertKey } from "@/data/network";

export function CertificationBadges({ certs }: { certs: CertKey[] }) {
  if (!certs?.length) return null;
  return (
    <div className="mt-4 flex flex-wrap gap-1.5">
      {certs.map((c) => (
        <span
          key={c}
          className="inline-flex items-center gap-1 rounded-full border border-secondary/30 bg-secondary/10 px-2.5 py-1 text-[11px] font-semibold text-secondary"
        >
          <span aria-hidden>{certEmoji[c]}</span>
          {certLabels[c]}
        </span>
      ))}
    </div>
  );
}