import { useEffect, useState } from "react";

export type Route = "simuler" | "comparer" | "reduire" | "methode";
export const ROUTES: Route[] = ["simuler", "comparer", "reduire", "methode"];

// Adresses de la première version du site, déjà partagées.
const ANCIENNES: Record<string, Route> = {
  simulateur: "simuler", discours: "comparer", leviers: "reduire", methodologie: "methode",
};

function lireRoute(): Route {
  const nom = window.location.hash.replace(/^#\/?/, "");
  if ((ROUTES as string[]).includes(nom)) return nom as Route;
  return ANCIENNES[nom] ?? "simuler";
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(lireRoute);
  useEffect(() => {
    const suivre = () => {
      setRoute(lireRoute());
      window.scrollTo?.(0, 0);
    };
    window.addEventListener("hashchange", suivre);
    return () => window.removeEventListener("hashchange", suivre);
  }, []);
  return route;
}
