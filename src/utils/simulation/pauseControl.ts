let paused = false;
let resolvePause: (() => void) | null = null;

export function pauseSimulation() {
  paused = true;
}

export function resumeSimulation() {
  paused = false;
  if (resolvePause) {
    resolvePause();
    resolvePause = null;
  }
}

export function isPaused() {
  return paused;
}

export function waitWhilePaused(): Promise<void> {
  return new Promise(resolve => {
    if (!paused) return resolve();
    resolvePause = resolve;
  });
}
