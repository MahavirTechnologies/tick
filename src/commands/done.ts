import chalk from 'chalk';
import { markDone } from '../services/tasks.js';

export function doneCommand(idStr?: string): void {
  if (!idStr || !idStr.trim()) {
    console.error(chalk.red('Error: Please provide a valid numeric task ID.'));
    console.error(chalk.dim('Usage: tick done <id>'));
    process.exit(1);
  }

  const id = parseInt(idStr.trim(), 10);
  if (isNaN(id) || id <= 0) {
    console.error(chalk.red('Error: Please provide a valid numeric task ID.'));
    process.exit(1);
  }

  const result = markDone(id);

  if (!result.success) {
    console.log(chalk.red(`Task #${id} not found.`));
    process.exit(1);
  }

  if (result.alreadyDone) {
    console.log(chalk.dim(`Task #${id} is already completed.`));
    return;
  }

  console.log(chalk.green(`✓ Task #${id} completed`));
}
