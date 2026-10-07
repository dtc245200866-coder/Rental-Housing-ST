import type { ReactNode } from 'react';

interface Props {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}

export default function FormField({ label, required, error, children }: Props) {
  return (
    <div>
      <label className="label">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
