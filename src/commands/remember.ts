import chalk from 'chalk';
import { addNote } from '../services/notes.js';

export function rememberCommand(content?: string): void {
  if (!content || !content.trim()) {
    console.error(chalk.red('Error: Note content cannot be empty.'));
    console.error(chalk.dim('Usage: tick remember "Deploy completed to staging"'));
    process.exit(1);
  }

  try {
    const note = addNote(content);
    console.log(chalk.green(`✓ Note #${note.id} remembered`));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(chalk.red(`Error: ${message}`));
    process.exit(1);
  }
}
