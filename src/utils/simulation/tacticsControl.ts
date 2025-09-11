let currentTactics = {
  ritmo: "medio",
  foco: "perimetro",
  defesa: "homem",
};

export function setTactics(newTactics: Partial<typeof currentTactics>) {
  currentTactics = { ...currentTactics, ...newTactics };
}

export function getTactics() {
  return currentTactics;
}
