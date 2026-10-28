import { formater } from "./format";

const f = (v: number, u: "Wh" | "gCO2e" | "mL") => formater(v, u).replace(/\u202f|\u00a0/g, " ");

describe("formater", () => {
  it("énergie : paliers Wh, kWh, TWh", () => {
    expect(f(0.24, "Wh")).toBe("0,24 Wh");
    expect(f(1530, "Wh")).toBe("1,5 kWh");
    expect(f(2.3e12, "Wh")).toBe("2,3 TWh");
  });

  it("carbone : paliers g à Mt", () => {
    expect(f(0.03, "gCO2e")).toBe("0,03 gCO2e");
    expect(f(4.2e12, "gCO2e")).toBe("4,2 MtCO2e");
  });

  it("eau : paliers mL à millions de m³", () => {
    expect(f(0.26, "mL")).toBe("0,26 mL");
    expect(f(45000, "mL")).toBe("45 L");
    expect(f(3.1e12, "mL")).toBe("3,1 millions de m³");
  });

  it("n'affiche jamais 0 pour une valeur positive", () => {
    expect(f(0.0004, "Wh")).toBe("0,0004 Wh");
    expect(f(0, "Wh")).toBe("0 Wh");
  });

  it("refuse NaN et les valeurs négatives", () => {
    expect(() => formater(NaN, "Wh")).toThrow("Valeur invalide");
    expect(() => formater(-1, "Wh")).toThrow("Valeur invalide");
  });
});
