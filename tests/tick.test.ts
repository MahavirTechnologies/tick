import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';

import { getDataDir, getConfigPath, getTasksPath, getNotesPath } from '../src/utils/paths.js';
import { readJsonFile, writeJsonFile } from '../src/storage/json-store.js';
import { validateAssistantName, getConfig, saveConfig, hasConfig } from '../src/services/config.js';
import { addTask, getTasks, markDone } from '../src/services/tasks.js';
import { addNote, getNotes } from '../src/services/notes.js';
import { formatDateTime } from '../src/commands/notes.js';

function createTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'tick-test-'));
}

test('Paths utility', async (t) => {
  await t.test('respects TICK_DATA_DIR override', () => {
    const tempDir = createTempDir();
    process.env.TICK_DATA_DIR = tempDir;
    try {
      assert.strictEqual(getDataDir(), path.resolve(tempDir));
      assert.strictEqual(getConfigPath(), path.join(path.resolve(tempDir), 'config.json'));
      assert.strictEqual(getTasksPath(), path.join(path.resolve(tempDir), 'tasks.json'));
      assert.strictEqual(getNotesPath(), path.join(path.resolve(tempDir), 'notes.json'));
    } finally {
      delete process.env.TICK_DATA_DIR;
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

test('Assistant Name Validation', async (t) => {
  await t.test('accepts valid assistant names', () => {
    assert.strictEqual(validateAssistantName('Tick').valid, true);
    assert.strictEqual(validateAssistantName('friday').valid, true);
    assert.strictEqual(validateAssistantName('jarvis_v2').valid, true);
    assert.strictEqual(validateAssistantName('my-assistant').valid, true);
  });

  await t.test('rejects empty or whitespace-only names', () => {
    assert.strictEqual(validateAssistantName('').valid, false);
    assert.strictEqual(validateAssistantName('   ').valid, false);
  });

  await t.test('rejects names with invalid characters or starting with non-letter', () => {
    assert.strictEqual(validateAssistantName('123tick').valid, false);
    assert.strictEqual(validateAssistantName('tick!').valid, false);
    assert.strictEqual(validateAssistantName('tick bot').valid, false);
    assert.strictEqual(validateAssistantName('tick/cli').valid, false);
  });
});

test('Storage and Configuration', async (t) => {
  const tempDir = createTempDir();
  process.env.TICK_DATA_DIR = tempDir;

  try {
    await t.test('detects absence of configuration', () => {
      assert.strictEqual(hasConfig(), false);
      assert.strictEqual(getConfig(), null);
    });

    await t.test('saves and reads configuration', () => {
      saveConfig({ assistantName: 'Friday' });
      assert.strictEqual(hasConfig(), true);
      const conf = getConfig();
      assert.deepStrictEqual(conf, { assistantName: 'Friday' });
    });

    await t.test('creates default content when reading missing file', () => {
      const dummyPath = path.join(tempDir, 'dummy.json');
      const data = readJsonFile<string[]>(dummyPath, ['default-item']);
      assert.deepStrictEqual(data, ['default-item']);
      assert.strictEqual(fs.existsSync(dummyPath), true);
    });
  } finally {
    delete process.env.TICK_DATA_DIR;
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('Task Management Service', async (t) => {
  const tempDir = createTempDir();
  process.env.TICK_DATA_DIR = tempDir;

  try {
    await t.test('initializes with empty task list', () => {
      const tasks = getTasks();
      assert.deepStrictEqual(tasks, []);
    });

    await t.test('adds tasks with sequential, stable IDs', () => {
      const t1 = addTask('Fix invoice bug');
      assert.strictEqual(t1.id, 1);
      assert.strictEqual(t1.title, 'Fix invoice bug');
      assert.strictEqual(t1.completed, false);
      assert.strictEqual(t1.completedAt, null);
      assert.ok(typeof t1.createdAt === 'string');

      const t2 = addTask('Review pull request');
      assert.strictEqual(t2.id, 2);
      assert.strictEqual(t2.title, 'Review pull request');

      const t3 = addTask('Update documentation');
      assert.strictEqual(t3.id, 3);
      assert.strictEqual(t3.title, 'Update documentation');

      const tasks = getTasks();
      assert.strictEqual(tasks.length, 3);
    });

    await t.test('marks task as completed', () => {
      const result = markDone(3);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.alreadyDone, false);
      assert.ok(result.task);
      assert.strictEqual(result.task.completed, true);
      assert.ok(typeof result.task.completedAt === 'string');

      // Check persisted state
      const tasks = getTasks();
      const updatedT3 = tasks.find((t) => t.id === 3);
      assert.ok(updatedT3);
      assert.strictEqual(updatedT3.completed, true);
    });

    await t.test('returns alreadyDone if task is already completed', () => {
      const result = markDone(3);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.alreadyDone, true);
    });

    await t.test('fails gracefully when task ID does not exist', () => {
      const result = markDone(999);
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.task, undefined);
    });

    await t.test('rejects empty task title', () => {
      assert.throws(() => addTask('   '), /Task title cannot be empty\./);
    });
  } finally {
    delete process.env.TICK_DATA_DIR;
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('Notes Management Service', async (t) => {
  const tempDir = createTempDir();
  process.env.TICK_DATA_DIR = tempDir;

  try {
    await t.test('initializes with empty notes list', () => {
      const notes = getNotes();
      assert.deepStrictEqual(notes, []);
    });

    await t.test('adds notes with sequential stable IDs and timestamps', () => {
      const n1 = addNote('Database password rotated');
      assert.strictEqual(n1.id, 1);
      assert.strictEqual(n1.content, 'Database password rotated');
      assert.ok(typeof n1.createdAt === 'string');

      const n2 = addNote('Meeting with DevOps at 3pm');
      assert.strictEqual(n2.id, 2);
      assert.strictEqual(n2.content, 'Meeting with DevOps at 3pm');

      const notes = getNotes();
      assert.strictEqual(notes.length, 2);
      assert.strictEqual(notes[0].id, 1);
      assert.strictEqual(notes[1].id, 2);
    });

    await t.test('rejects empty note content', () => {
      assert.throws(() => addNote('   '), /Note content cannot be empty\./);
    });
  } finally {
    delete process.env.TICK_DATA_DIR;
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('Date Formatting Helper', async (t) => {
  await t.test('formats recent timestamp as Just now', () => {
    const formatted = formatDateTime(new Date().toISOString());
    assert.match(formatted, /Just now/);
  });

  await t.test('formats timestamp from 15 minutes ago with relative minutes', () => {
    const past = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const formatted = formatDateTime(past);
    assert.match(formatted, /Today at/);
    assert.match(formatted, /15m ago/);
  });

  await t.test('formats timestamp from earlier today with relative hours', () => {
    const past = new Date(Date.now() - 2 * 3600 * 1000).toISOString();
    const formatted = formatDateTime(past);
    assert.match(formatted, /Today at/);
    assert.match(formatted, /2h ago/);
  });

  await t.test('handles invalid date strings gracefully', () => {
    assert.strictEqual(formatDateTime('invalid-date'), 'invalid-date');
  });
});

test('End-to-End CLI Execution', async (t) => {
  const tempDir = createTempDir();
  const cliPath = path.resolve('dist/cli.js');

  try {
    // 1. Initial config setup
    fs.writeFileSync(
      path.join(tempDir, 'config.json'),
      JSON.stringify({ assistantName: 'Tick' }, null, 2),
      'utf-8'
    );

    // 2. Add tasks via CLI
    const addOutput = execSync(`node "${cliPath}" add "Fix invoice bug"`, {
      env: { ...process.env, TICK_DATA_DIR: tempDir },
      encoding: 'utf-8',
    });
    assert.match(addOutput, /✓ Task #1 added/);

    execSync(`node "${cliPath}" add "Review pull request"`, {
      env: { ...process.env, TICK_DATA_DIR: tempDir },
      encoding: 'utf-8',
    });
    execSync(`node "${cliPath}" add "Update documentation"`, {
      env: { ...process.env, TICK_DATA_DIR: tempDir },
      encoding: 'utf-8',
    });

    // 3. Mark task 3 done
    const doneOutput = execSync(`node "${cliPath}" done 3`, {
      env: { ...process.env, TICK_DATA_DIR: tempDir },
      encoding: 'utf-8',
    });
    assert.match(doneOutput, /✓ Task #3 completed/);

    // 4. List tasks and verify tabular format with STATUS column
    const listOutput = execSync(`node "${cliPath}" list`, {
      env: { ...process.env, TICK_DATA_DIR: tempDir },
      encoding: 'utf-8',
    });
    assert.match(listOutput, /Tick — Tasks/);
    assert.match(listOutput, /ID\s+STATUS\s+TITLE/);
    assert.match(listOutput, /1\s+○\s+Pending\s+Fix invoice bug/);
    assert.match(listOutput, /2\s+○\s+Pending\s+Review pull request/);
    assert.match(listOutput, /3\s+✓\s+Done\s+Update documentation/);
    assert.match(listOutput, /2 remaining · 1 completed/);

    // 5. Done 999 produces error message
    let errorOutput = '';
    try {
      execSync(`node "${cliPath}" done 999`, {
        env: { ...process.env, TICK_DATA_DIR: tempDir },
        encoding: 'utf-8',
      });
    } catch (err: any) {
      errorOutput = (err.stdout || '') + (err.stderr || '');
    }
    assert.match(errorOutput, /Task #999 not found\./);

    // 6. Add empty produces validation error
    let emptyOutput = '';
    try {
      execSync(`node "${cliPath}" add ""`, {
        env: { ...process.env, TICK_DATA_DIR: tempDir },
        encoding: 'utf-8',
      });
    } catch (err: any) {
      emptyOutput = (err.stdout || '') + (err.stderr || '');
    }
    assert.match(emptyOutput, /Task title cannot be empty\./);

    // 7. Add notes via CLI "remember"
    const rememberOutput = execSync(`node "${cliPath}" remember "Rotated API keys"`, {
      env: { ...process.env, TICK_DATA_DIR: tempDir },
      encoding: 'utf-8',
    });
    assert.match(rememberOutput, /✓ Note #1 remembered/);

    execSync(`node "${cliPath}" remember "Meeting notes with frontend team"`, {
      env: { ...process.env, TICK_DATA_DIR: tempDir },
      encoding: 'utf-8',
    });

    // 8. List notes via CLI "notes"
    const notesOutput = execSync(`node "${cliPath}" notes`, {
      env: { ...process.env, TICK_DATA_DIR: tempDir },
      encoding: 'utf-8',
    });
    assert.match(notesOutput, /Tick — Notes/);
    assert.match(notesOutput, /ID\s+CREATED\s+NOTE/);
    assert.match(notesOutput, /1\s+.*Rotated API keys/);
    assert.match(notesOutput, /2\s+.*Meeting notes with frontend team/);
    assert.match(notesOutput, /2 notes/);

    // 9. Remember empty produces validation error
    let emptyNoteOutput = '';
    try {
      execSync(`node "${cliPath}" remember ""`, {
        env: { ...process.env, TICK_DATA_DIR: tempDir },
        encoding: 'utf-8',
      });
    } catch (err: any) {
      emptyNoteOutput = (err.stdout || '') + (err.stderr || '');
    }
    assert.match(emptyNoteOutput, /Note content cannot be empty\./);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
