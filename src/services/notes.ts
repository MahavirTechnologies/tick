import { getNotesPath } from '../utils/paths.js';
import { readJsonFile, writeJsonFile } from '../storage/json-store.js';
import { Note } from '../types.js';

/**
 * Loads all notes from local JSON storage.
 * Automatically creates an empty list if notes.json does not exist.
 */
export function getNotes(): Note[] {
  const notes = readJsonFile<Note[]>(getNotesPath(), []);
  return notes ?? [];
}

/**
 * Saves the notes list to local JSON storage.
 */
export function saveNotes(notes: Note[]): void {
  writeJsonFile(getNotesPath(), notes);
}

/**
 * Adds a new plain text note with a stable auto-incrementing ID and creation timestamp.
 */
export function addNote(content: string): Note {
  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error('Note content cannot be empty.');
  }

  const notes = getNotes();
  const nextId = notes.length > 0 ? Math.max(...notes.map((n) => n.id)) + 1 : 1;

  const newNote: Note = {
    id: nextId,
    content: trimmed,
    createdAt: new Date().toISOString(),
  };

  notes.push(newNote);
  saveNotes(notes);

  return newNote;
}
