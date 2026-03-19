import client from './client';
import type { User } from '../types';

interface RegisterResponse {
  message: string;
  email: string;
}

export async function login(email: string, password: string): Promise<void> {
  await client.post('/auth/login', { email, password });
}

export async function register(name: string, email: string, password: string): Promise<RegisterResponse> {
  const response = await client.post<RegisterResponse>('/auth/register', { name, email, password });
  return response.data;
}

export async function verifyEmail(email: string, code: string): Promise<void> {
  await client.post('/auth/verify-email', { email, code });
}

export async function resendCode(email: string): Promise<void> {
  await client.post('/auth/resend-code', { email });
}

export async function getMe(): Promise<User | null> {
  try {
    const response = await client.get<{ user: User | null }>('/auth/me');
    return response.data.user;
  } catch {
    return null;
  }
}

export async function refreshToken(): Promise<boolean> {
  try {
    await client.post('/auth/refresh');
    return true;
  } catch {
    return false;
  }
}

export async function logout(): Promise<void> {
  await client.post('/auth/logout');
}
