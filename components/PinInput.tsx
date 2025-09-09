import React from 'react';

type Props = {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
};

export default function PinInput({ label = 'Mã PIN', value, onChange, placeholder = 'Nhập PIN 4-12 số', autoFocus }: Props) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        className="input"
        type="password"
        inputMode="numeric"
        pattern="[0-9]*"
        minLength={4}
        maxLength={12}
        placeholder={placeholder}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value.replace(/\D/g, ''))}
        autoFocus={autoFocus}
      />
    </div>
  );
}
