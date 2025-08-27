export function randomChance(probability: number): boolean {
  return Math.random() < probability;
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
