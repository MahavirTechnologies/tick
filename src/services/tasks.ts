import { getTasksPath } from '../utils/paths.js';
import { readJsonFile, writeJsonFile } from '../storage/json-store.js';
import { Task } from '../types.js';

/**
 * Loads all tasks from local JSON storage.
 * Automatically creates an empty list if tasks.json does not exist.
 */
export function getTasks(): Task[] {
  const tasks = readJsonFile<Task[]>(getTasksPath(), []);
  return tasks ?? [];
}

/**
 * Saves the tasks list to local JSON storage.
 */
export function saveTasks(tasks: Task[]): void {
  writeJsonFile(getTasksPath(), tasks);
}

/**
 * Adds a new task with a stable auto-incrementing ID.
 */
export function addTask(title: string): Task {
  const trimmedTitle = title.trim();
  if (!trimmedTitle) {
    throw new Error('Task title cannot be empty.');
  }

  const tasks = getTasks();
  const nextId = tasks.length > 0 ? Math.max(...tasks.map((t) => t.id)) + 1 : 1;

  const newTask: Task = {
    id: nextId,
    title: trimmedTitle,
    completed: false,
    createdAt: new Date().toISOString(),
    completedAt: null,
  };

  tasks.push(newTask);
  saveTasks(tasks);

  return newTask;
}

export interface MarkDoneResult {
  success: boolean;
  task?: Task;
  alreadyDone?: boolean;
}

/**
 * Marks a task as completed by its ID.
 */
export function markDone(id: number): MarkDoneResult {
  const tasks = getTasks();
  const task = tasks.find((t) => t.id === id);

  if (!task) {
    return { success: false };
  }

  if (task.completed) {
    return { success: true, task, alreadyDone: true };
  }

  task.completed = true;
  task.completedAt = new Date().toISOString();
  saveTasks(tasks);

  return { success: true, task, alreadyDone: false };
}
