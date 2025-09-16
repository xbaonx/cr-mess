import React from 'react';

type Props = {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
};

export default function Toggle({ checked, onChange, label, description, disabled }: Props) {
  return (
    <label className={`flex items-start gap-3 cursor-pointer select-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <span className="relative inline-flex h-6 w-11 flex-shrink-0 items-center">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
        />
        <span className={`h-6 w-11 rounded-full transition-colors ${checked ? 'bg-amber-500' : 'bg-gray-700'}`}></span>
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : ''}`}
        ></span>
      </span>
      {(label || description) && (
        <span className="flex flex-col">
          {label && <span className="text-sm font-medium text-gray-200">{label}</span>}
          {description && <span className="text-xs text-gray-400">{description}</span>}
        </span>
      )}
    </label>
  );
}
