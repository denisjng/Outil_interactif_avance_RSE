import type { ReactNode } from "react";

// Détail replié par défaut : la page reste courte, l'information reste à un clic (clavier compris).
export function Replier({ titre, children, className = "" }: { titre: ReactNode; children: ReactNode; className?: string }) {
  return (
    <details className={`group rounded-xl border border-filet bg-white ${className}`}>
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-5 py-3 font-semibold hover:bg-fond [&::-webkit-details-marker]:hidden">
        <span>{titre}</span>
        <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" className="flex-none transition-transform group-open:rotate-180 motion-reduce:transition-none">
          <path d="M5 7.5 10 12.5 15 7.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <div className="flex flex-col gap-4 border-t border-filet px-5 pb-5 pt-4">{children}</div>
    </details>
  );
}
