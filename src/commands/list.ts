import chalk from 'chalk';
import { getTasks } from '../services/tasks.js';
import { getConfig } from '../services/config.js';

export function listCommand(): void {
  const config = getConfig();
  const assistantName = config?.assistantName || 'Tick';
  const tasks = getTasks();

  console.log(`\n${chalk.bold(`${assistantName} — Tasks`)}\n`);

  if (tasks.length === 0) {
    console.log(chalk.dim('No tasks yet.'));
    console.log(chalk.dim(`Try: ${assistantName.toLowerCase()} add "My first task"\n`));
    return;
  }

  const maxIdLen = Math.max(2, ...tasks.map((t) => String(t.id).length));
  const maxTitleLen = Math.max(5, ...tasks.map((t) => t.title.length));
  const statusColWidth = 9; // visible width for "○ Pending" and "✓ Done   "

  const idHeader = 'ID'.padEnd(maxIdLen);
  const statusHeader = 'STATUS'.padEnd(statusColWidth);
  const titleHeader = 'TITLE';

  // Table header
  console.log(`  ${chalk.dim(idHeader)}  ${chalk.dim(statusHeader)}  ${chalk.dim(titleHeader)}`);
  console.log(
    `  ${chalk.dim('─'.repeat(maxIdLen))}  ${chalk.dim('─'.repeat(statusColWidth))}  ${chalk.dim(
      '─'.repeat(Math.min(maxTitleLen, 40))
    )}`
  );

  // Table rows
  for (const task of tasks) {
    const idStr = String(task.id).padStart(maxIdLen, ' ');
    if (task.completed) {
      const statusStr = `${chalk.green('✓')} ${chalk.dim('Done   ')}`;
      console.log(`  ${chalk.dim(idStr)}  ${statusStr}  ${chalk.dim(task.title)}`);
    } else {
      const statusStr = `${chalk.cyan('○')} ${chalk.dim('Pending')}`;
      console.log(`  ${chalk.dim(idStr)}  ${statusStr}  ${task.title}`);
    }
  }

  const remaining = tasks.filter((t) => !t.completed).length;
  const completed = tasks.filter((t) => t.completed).length;

  console.log(`\n${chalk.dim(`${remaining} remaining · ${completed} completed`)}\n`);
}
