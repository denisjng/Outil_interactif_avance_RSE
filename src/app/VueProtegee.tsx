import { Component, type ReactNode } from "react";

// Une erreur pendant le rendu d'une vue (donnée manquante après une mise à jour, par exemple)
// affiche un message au lieu de démonter toute l'application.
export class VueProtegee extends Component<{ children: ReactNode }, { erreur: Error | null }> {
  state = { erreur: null as Error | null };

  static getDerivedStateFromError(erreur: Error) {
    return { erreur };
  }

  render() {
    if (!this.state.erreur) return this.props.children;
    return (
      <div role="alert" className="mx-auto max-w-xl px-4 py-10">
        <p className="mb-2 font-semibold">Cette vue ne peut pas s'afficher avec les données actuelles.</p>
        <p className="text-secondaire">{this.state.erreur.message}</p>
      </div>
    );
  }
}
