import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

/**
 * Returns the directory where Tick configuration and data files are stored.
 * Checks for TICK_DATA_DIR environment variable first, then existing ~/.Tick or ~/.tick,
 * defaulting to ~/.Tick.
 */
export function getDataDir(): string {
  if (process.env.TICK_DATA_DIR) {
    return path.resolve(process.env.TICK_DATA_DIR);
  }

  const home = os.homedir();
  const tickUpper = path.join(home, '.Tick');
  const tickLower = path.join(home, '.tick');

  if (fs.existsSync(tickUpper)) {
    return tickUpper;
  }
  if (fs.existsSync(tickLower)) {
    return tickLower;
  }

  return tickUpper;
}

export function getConfigPath(): string {
  return path.join(getDataDir(), 'config.json');
}

export function getTasksPath(): string {
  return path.join(getDataDir(), 'tasks.json');
}

export function getNotesPath(): string {
  return path.join(getDataDir(), 'notes.json');
}

export function getBinDir(): string {
  return path.join(getDataDir(), 'bin');
}

export function ensureDataDir(): void {
  const dir = getDataDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}
