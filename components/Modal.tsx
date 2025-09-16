import React from 'react';

export default function Modal({ open, title, children, onClose, onConfirm, confirmText = 'Confirm', danger }: {
  open: boolean;
  title: string;
  children?: React.ReactNode;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  danger?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-lg border border-gray-800 bg-gray-950 p-5 shadow-xl">
        <div className="text-lg font-semibold mb-2 text-gray-100">{title}</div>
        <div className="text-sm text-gray-300 mb-4">{children}</div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 rounded bg-gray-800 text-gray-100 hover:bg-gray-700">Cancel</button>
          {onConfirm && (
            <button onClick={onConfirm} className={`px-3 py-2 rounded text-white ${danger ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'}`}>{confirmText}</button>
          )}
        </div>
      </div>
    </div>
  );
}
