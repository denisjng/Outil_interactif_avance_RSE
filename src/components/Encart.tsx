import type { ReactNode } from "react";

const TONS = {
  sombre: "bg-encre text-white",
  clair: "border border-filet bg-white",
  alerte: "border border-[#F3D9B8] bg-[#FFF7ED]",
};

export function Encart({ ton, titre, children, className = "" }: {
  ton: keyof typeof TONS;
  titre?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`flex flex-col gap-3 rounded-xl p-6 ${TONS[ton]} ${className}`}>
      {titre && <h2 className="font-titre text-xl font-bold">{titre}</h2>}
      {children}
    </section>
  );
}
