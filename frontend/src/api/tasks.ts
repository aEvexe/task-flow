import client from './client';
import type { Task, TaskStatus } from '../types';

export async function getTasks(boardId: string): Promise<Task[]> {
  const response = await client.get<Task[]>(`/boards/${boardId}/tasks`);
  return response.data;
}

export async function createTask(
  boardId: string,
  data: { title: string; description?: string; status?: TaskStatus },
): Promise<Task> {
  const response = await client.post<Task>(`/boards/${boardId}/tasks`, data);
  return response.data;
}

export async function updateTask(
  boardId: string,
  taskId: string,
  data: { title?: string; description?: string; status?: TaskStatus; position?: number },
): Promise<Task> {
  const response = await client.patch<Task>(`/boards/${boardId}/tasks/${taskId}`, data);
  return response.data;
}

export async function deleteTask(boardId: string, taskId: string): Promise<void> {
  await client.delete(`/boards/${boardId}/tasks/${taskId}`);
}
