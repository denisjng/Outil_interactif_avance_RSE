import { useEffect, useState } from "react";

export type Route = "simulateur" | "discours" | "leviers" | "methodologie";
export const ROUTES: Route[] = ["simulateur", "discours", "leviers", "methodologie"];

function lireRoute(): Route {
  const nom = window.location.hash.replace(/^#\/?/, "");
  return (ROUTES as string[]).includes(nom) ? (nom as Route) : "simulateur";
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
