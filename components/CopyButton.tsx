import React from 'react';

export default function CopyButton({ text, size = 'sm', label = 'Copy' }: { text: string; size?: 'sm'|'md'; label?: string }) {
  const [copied, setCopied] = React.useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };
  const cls = size === 'md' ? 'px-3 py-2 text-sm' : 'px-2 py-1 text-xs';
  return (
    <button onClick={onCopy} className={`rounded bg-gray-800 hover:bg-gray-700 text-gray-100 ${cls}`} title={text}>
      {copied ? 'Copied' : label}
    </button>
  );
}
