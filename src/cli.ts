#!/usr/bin/env node

import { Command } from 'commander';
import { hasConfig, getConfig, promptSetup, saveConfig } from './services/config.js';
import { setupLauncher } from './services/launcher.js';
import { addCommand } from './commands/add.js';
import { listCommand } from './commands/list.js';
import { doneCommand } from './commands/done.js';
import { rememberCommand } from './commands/remember.js';
import { notesCommand } from './commands/notes.js';

async function main(): Promise<void> {
  const userArgs = process.argv.slice(2);

  // First-run detection
  if (!hasConfig()) {
    if (!process.stdin.isTTY) {
      // Non-interactive fallback (e.g. CI or automated tests)
      const assistantName = process.env.TICK_ASSISTANT_NAME || 'Tick';
      saveConfig({ assistantName });
      setupLauncher(assistantName);
    } else {
      await promptSetup();
      // If user invoked without arguments, setup was completed and instructions were shown
      if (userArgs.length === 0) {
        return;
      }
    }
  }

  const config = getConfig();
  const assistantName = config?.assistantName || 'Tick';
  const commandName = assistantName.toLowerCase();

  const program = new Command();

  program
    .name(commandName)
    .description('Minimal Developer Task CLI')
    .version('1.0.0');

  program
    .command('add <title>')
    .description('Create a task')
    .action((title: string) => {
      addCommand(title);
    });

  program
    .command('list')
    .description('Display all tasks')
    .action(() => {
      listCommand();
    });

  program
    .command('done <id>')
    .description('Mark a task as completed')
    .action((id: string) => {
      doneCommand(id);
    });

  program
    .command('remember <content>')
    .description('Add a plain text note')
    .action((content: string) => {
      rememberCommand(content);
    });

  program
    .command('notes')
    .description('Display all notes')
    .action(() => {
      notesCommand();
    });

  // If no arguments provided, show help
  if (userArgs.length === 0) {
    program.outputHelp();
    return;
  }

  await program.parseAsync(process.argv);
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
