export interface Task {
  id: number;
  title: string;
  completed: boolean;
  createdAt: string;
  completedAt: string | null;
}

export interface Note {
  id: number;
  content: string;
  createdAt: string;
}

export interface Config {
  assistantName: string;
}
