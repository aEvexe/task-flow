import client from './client';
import type { Board } from '../types';

export async function getBoards(): Promise<Board[]> {
  const response = await client.get<Board[]>('/boards');
  return response.data;
}

export async function createBoard(data: { title: string; description?: string }): Promise<Board> {
  const response = await client.post<Board>('/boards', data);
  return response.data;
}

export async function getBoard(id: string): Promise<Board> {
  const response = await client.get<Board>(`/boards/${id}`);
  return response.data;
}

export async function updateBoard(id: string, data: { title?: string; description?: string }): Promise<Board> {
  const response = await client.patch<Board>(`/boards/${id}`, data);
  return response.data;
}

export async function deleteBoard(id: string): Promise<void> {
  await client.delete(`/boards/${id}`);
}
