export type Option<T extends string> = { id: T; libelle: string; detail?: string };

// Choix exclusif en boutons à bascule. « segment » : boutons accolés dans une même pastille, pour 2 à 4 choix courts.
export function ChoixGroupe<T extends string>({
  legende, options, valeur, onChange, variante = "boutons",
}: {
  legende: string;
  options: Option<T>[];
  valeur: T;
  onChange: (id: T) => void;
  variante?: "boutons" | "segment";
}) {
  const segment = variante === "segment";
  return (
    <fieldset className="flex min-w-0 flex-col gap-1.5">
      <legend className="mb-1.5 text-sm font-semibold">{legende}</legend>
      <div className={segment
        ? `grid gap-1 rounded-lg border border-[#C9CEC7] bg-fond p-1 ${options.length > 3 ? "grid-cols-2 sm:grid-flow-col sm:auto-cols-fr sm:grid-cols-none" : "auto-cols-fr grid-flow-col"}`
        : "flex flex-wrap gap-2"}>
        {options.map((o) => {
          const actif = o.id === valeur;
          const style = segment
            ? actif ? "bg-encre text-white shadow-sm" : "text-encre hover:bg-white"
            : actif ? "border border-encre bg-encre text-white" : "border border-[#C9CEC7] bg-white text-encre hover:border-encre";
          return (
            <button
              key={o.id}
              type="button"
              aria-pressed={actif}
              onClick={() => onChange(o.id)}
              className={`min-h-11 rounded-md px-3 py-1.5 text-sm leading-tight ${segment ? "text-center" : "text-left"} ${style}`}
            >
              <span className="block font-semibold">{o.libelle}</span>
              {o.detail && <span className="block text-xs opacity-80">{o.detail}</span>}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
