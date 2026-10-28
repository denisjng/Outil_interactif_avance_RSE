import { useId, useState, type ReactNode } from "react";

// Petit « ? » à côté d'un terme : la définition s'ouvre au clic, au survol ou au focus clavier.
export function Infobulle({ terme, children }: { terme: string; children: ReactNode }) {
  const [ouvert, setOuvert] = useState(false);
  const id = useId();
  return (
    <span className="relative inline-flex align-middle" onMouseLeave={() => setOuvert(false)}>
      <button
        type="button"
        aria-label={`Qu'est-ce que ${terme} ?`}
        aria-expanded={ouvert}
        aria-describedby={ouvert ? id : undefined}
        onClick={() => setOuvert((o) => !o)}
        onMouseEnter={() => setOuvert(true)}
        onBlur={() => setOuvert(false)}
        onKeyDown={(e) => e.key === "Escape" && setOuvert(false)}
        className="relative inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#9AA39E] text-[11px] font-bold text-secondaire after:absolute after:-inset-3 hover:border-encre hover:text-encre"
      >
        ?
      </button>
      {ouvert && (
        <span
          id={id}
          role="tooltip"
          className="absolute left-1/2 top-7 z-20 w-60 -translate-x-1/2 rounded-lg bg-encre px-3 py-2 text-left text-[13px] font-normal normal-case leading-snug tracking-normal text-white shadow-lg"
        >
          {children}
        </span>
      )}
    </span>
  );
}
