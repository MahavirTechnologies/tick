import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';

/**
 * Reads and parses a JSON file safely.
 * If the file does not exist and defaultContent is provided, creates the file with defaultContent.
 * If the file is corrupted, prints a clean error message and terminates gracefully.
 */
export function readJsonFile<T>(filePath: string, defaultContent?: T): T | null {
  if (!fs.existsSync(filePath)) {
    if (defaultContent !== undefined) {
      writeJsonFile(filePath, defaultContent);
      return defaultContent;
    }
    return null;
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error(
        chalk.red(`Error: Storage file "${filePath}" is corrupted or contains invalid JSON.\nPlease fix or remove the file to proceed.`)
      );
      process.exit(1);
    }
    throw error;
  }
}

/**
 * Writes data as formatted JSON to a file, ensuring parent directories exist.
 */
export function writeJsonFile<T>(filePath: string, data: T): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const formatted = JSON.stringify(data, null, 2) + '\n';
  fs.writeFileSync(filePath, formatted, 'utf-8');
}
