import { render, screen } from "@testing-library/react";
import App from "./App";

it("affiche le titre de l'outil", () => {
  render(<App />);
  expect(screen.getByText("Le vrai coût d'un prompt")).toBeInTheDocument();
});
