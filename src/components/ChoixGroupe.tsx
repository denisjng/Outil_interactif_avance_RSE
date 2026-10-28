export type Option<T extends string> = { id: T; libelle: string; detail?: string };

// Choix exclusif rendu en boutons à bascule : plus lisible qu'une liste déroulante pour 3 à 6 options.
export function ChoixGroupe<T extends string>({
  legende, options, valeur, onChange, empile = false,
}: {
  legende: string;
  options: Option<T>[];
  valeur: T;
  onChange: (id: T) => void;
  empile?: boolean;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 font-semibold">{legende}</legend>
      <div className={empile ? "flex flex-col gap-2" : "flex flex-wrap gap-2"}>
        {options.map((o) => {
          const actif = o.id === valeur;
          return (
            <button
              key={o.id}
              type="button"
              aria-pressed={actif}
              onClick={() => onChange(o.id)}
              className={`min-h-11 rounded-lg border px-3.5 py-2 text-left text-sm ${empile ? "w-full" : ""} ${
                actif ? "border-encre bg-encre text-white" : "border-[#C9CEC7] bg-white text-encre hover:border-encre"
              }`}
            >
              <span className="block font-semibold">{o.libelle}</span>
              {o.detail && <span className="block text-[13px] opacity-80">{o.detail}</span>}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
