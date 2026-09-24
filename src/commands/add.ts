import chalk from 'chalk';
import { addTask } from '../services/tasks.js';

export function addCommand(title?: string): void {
  if (!title || !title.trim()) {
    console.error(chalk.red('Error: Task title cannot be empty.'));
    console.error(chalk.dim('Usage: tick add "Fix invoice bug"'));
    process.exit(1);
  }

  try {
    const task = addTask(title);
    console.log(chalk.green(`✓ Task #${task.id} added`));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(chalk.red(`Error: ${message}`));
    process.exit(1);
  }
}
