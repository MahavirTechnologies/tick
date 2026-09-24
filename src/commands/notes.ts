import chalk from 'chalk';
import { getNotes } from '../services/notes.js';
import { getConfig } from '../services/config.js';

/**
 * Formats an ISO date into a human-friendly date string with relative context.
 */
export function formatDateTime(isoString: string): string {
  const d = new Date(isoString);
  if (isNaN(d.getTime())) {
    return isoString;
  }

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  const timeStr = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  if (diffSec >= 0 && diffSec < 60) {
    return `Just now (${timeStr})`;
  }

  if (isToday) {
    if (diffSec < 3600) {
      const mins = Math.floor(diffSec / 60);
      return `Today at ${timeStr} (${mins}m ago)`;
    }
    const hours = Math.floor(diffSec / 3600);
    return `Today at ${timeStr} (${hours}h ago)`;
  }

  if (isYesterday) {
    return `Yesterday at ${timeStr}`;
  }

  const month = d.toLocaleString('en-US', { month: 'short' });
  const day = d.getDate();
  const isSameYear = d.getFullYear() === now.getFullYear();

  if (isSameYear) {
    return `${month} ${day} at ${timeStr}`;
  }

  return `${month} ${day}, ${d.getFullYear()} at ${timeStr}`;
}

export function notesCommand(): void {
  const config = getConfig();
  const assistantName = config?.assistantName || 'Tick';
  const notes = getNotes();

  console.log(`\n${chalk.bold(`${assistantName} — Notes`)}\n`);

  if (notes.length === 0) {
    console.log(chalk.dim('No notes yet.'));
    console.log(chalk.dim(`Try: ${assistantName.toLowerCase()} remember "My first note"\n`));
    return;
  }

  const formattedNotes = notes.map((note) => ({
    ...note,
    formattedDate: formatDateTime(note.createdAt),
  }));

  const maxIdLen = Math.max(2, ...formattedNotes.map((n) => String(n.id).length));
  const maxDateLen = Math.max(7, ...formattedNotes.map((n) => n.formattedDate.length));
  const maxContentLen = Math.max(4, ...formattedNotes.map((n) => n.content.length));

  const idHeader = 'ID'.padEnd(maxIdLen);
  const createdHeader = 'CREATED'.padEnd(maxDateLen);
  const noteHeader = 'NOTE';

  // Table header
  console.log(`  ${chalk.dim(idHeader)}  ${chalk.dim(createdHeader)}  ${chalk.dim(noteHeader)}`);
  console.log(
    `  ${chalk.dim('─'.repeat(maxIdLen))}  ${chalk.dim('─'.repeat(maxDateLen))}  ${chalk.dim(
      '─'.repeat(Math.min(maxContentLen, 40))
    )}`
  );

  // Table rows
  for (const note of formattedNotes) {
    const idStr = String(note.id).padStart(maxIdLen, ' ');
    const dateStr = note.formattedDate.padEnd(maxDateLen, ' ');
    console.log(`  ${chalk.dim(idStr)}  ${chalk.dim(dateStr)}  ${note.content}`);
  }

  const countStr = notes.length === 1 ? '1 note' : `${notes.length} notes`;
  console.log(`\n${chalk.dim(countStr)}\n`);
}
