import React from 'react';

type Props = {
  type?: 'success' | 'error' | 'info' | 'warning';
  message: string;
};

const colorMap: Record<NonNullable<Props['type']>, string> = {
  success: 'bg-green-900/30 text-green-300 border-green-800',
  error: 'bg-red-900/30 text-red-300 border-red-800',
  info: 'bg-blue-900/30 text-blue-300 border-blue-800',
  warning: 'bg-yellow-900/30 text-yellow-300 border-yellow-800',
};

export default function Notification({ type = 'info', message }: Props) {
  return (
    <div className={`rounded-md border px-3 py-2 text-sm ${colorMap[type]}`}>{message}</div>
  );
}
