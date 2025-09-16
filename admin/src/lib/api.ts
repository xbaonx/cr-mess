"use client";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

export async function apiGet(path: string, token?: string) {
  const resp = await fetch(`${API_BASE}${path}`, {
    headers: token ? { 'x-admin-token': token } : undefined,
    cache: 'no-store',
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(data?.message || 'Request failed');
  return data;
}

export async function apiPost(path: string, body?: any, token?: string) {
  const resp = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'x-admin-token': token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(data?.message || 'Request failed');
  return data;
}

export async function apiDelete(path: string, token?: string) {
  const resp = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    headers: token ? { 'x-admin-token': token } : undefined,
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(data?.message || 'Request failed');
  return data;
}
