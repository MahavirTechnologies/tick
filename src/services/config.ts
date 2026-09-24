import inquirer from 'inquirer';
import chalk from 'chalk';
import { getConfigPath } from '../utils/paths.js';
import { readJsonFile, writeJsonFile } from '../storage/json-store.js';
import { Config } from '../types.js';
import { setupLauncher } from './launcher.js';

/**
 * Checks whether a valid configuration file exists.
 */
export function hasConfig(): boolean {
  const config = readJsonFile<Config>(getConfigPath());
  return config !== null && typeof config.assistantName === 'string' && config.assistantName.trim().length > 0;
}

/**
 * Retrieves the stored configuration, or null if not yet configured.
 */
export function getConfig(): Config | null {
  return readJsonFile<Config>(getConfigPath());
}

/**
 * Writes the configuration to local storage.
 */
export function saveConfig(config: Config): void {
  writeJsonFile(getConfigPath(), config);
}

/**
 * Validates the assistant name for CLI command suitability.
 */
export function validateAssistantName(input: string): { valid: boolean; error?: string } {
  const trimmed = input.trim();
  if (!trimmed) {
    return { valid: false, error: 'Assistant name cannot be empty.' };
  }
  if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(trimmed)) {
    return {
      valid: false,
      error: 'Assistant name must start with a letter and contain only letters, numbers, hyphens, and underscores.',
    };
  }
  return { valid: true };
}

/**
 * Prompts the user to configure their assistant name on first run.
 */
export async function promptSetup(): Promise<Config> {
  console.log('\nWelcome to Tick!\n');

  const answers = await inquirer.prompt<{ assistantName: string }>([
    {
      type: 'input',
      name: 'assistantName',
      message: 'What would you like to call your assistant?',
      default: 'Tick',
      validate: (input: string) => {
        const result = validateAssistantName(input);
        return result.valid ? true : (result.error || 'Invalid assistant name.');
      },
    },
  ]);

  const assistantName = answers.assistantName.trim();
  const config: Config = { assistantName };
  saveConfig(config);

  console.log(`\nGreat. I'm ${assistantName}.`);
  console.log(chalk.green(`✓ Your assistant is now ${assistantName}.\n`));

  const launcherResult = setupLauncher(assistantName);
  if (launcherResult.notes.length > 0) {
    for (const note of launcherResult.notes) {
      console.log(chalk.dim(`  ℹ ${note}`));
    }
    console.log();
  }

  console.log('Try:\n');
  console.log(`  ${assistantName} add "My first task"`);
  console.log(`  ${assistantName} list\n`);

  return config;
}
