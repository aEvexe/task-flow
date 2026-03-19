export interface User {
  _id: string;
  name: string;
  email: string;
}

export interface Board {
  _id: string;
  title: string;
  description?: string;
  owner: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  position: number;
  dueDate?: string;
  board: string;
  createdAt: string;
  updatedAt: string;
}

export type TaskStatus = 'todo' | 'in-progress' | 'done';
