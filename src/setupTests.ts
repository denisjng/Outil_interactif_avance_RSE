import "@testing-library/jest-dom/vitest";

// jsdom ne fournit pas le défilement de la fenêtre.
window.scrollTo = () => {};
