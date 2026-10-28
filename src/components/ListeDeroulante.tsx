export type GroupeOptions = { libelle: string; options: { id: string; libelle: string }[] };

// Liste native : compacte, lisible au lecteur d'écran et adaptée au mobile.
export function ListeDeroulante({ id, libelle, groupes, valeur, onChange }: {
  id: string;
  libelle: string;
  groupes: GroupeOptions[];
  valeur: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold">{libelle}</label>
      <select
        id={id}
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-11 w-full rounded-lg border border-[#C9CEC7] bg-white px-3 text-base text-encre hover:border-encre"
      >
        {groupes.map((g) => (
          <optgroup key={g.libelle} label={g.libelle}>
            {g.options.map((o) => <option key={o.id} value={o.id}>{o.libelle}</option>)}
          </optgroup>
        ))}
      </select>
    </div>
  );
}
