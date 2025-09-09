import React from 'react';

type Props = {
  type?: 'success' | 'error' | 'info' | 'warning';
  message: string;
};

const colorMap: Record<NonNullable<Props['type']>, string> = {
  success: 'bg-green-50 text-green-800 border-green-200',
  error: 'bg-red-50 text-red-800 border-red-200',
  info: 'bg-blue-50 text-blue-800 border-blue-200',
  warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
};

export default function Notification({ type = 'info', message }: Props) {
  return (
    <div className={`rounded-md border px-3 py-2 text-sm ${colorMap[type]}`}>{message}</div>
  );
}
