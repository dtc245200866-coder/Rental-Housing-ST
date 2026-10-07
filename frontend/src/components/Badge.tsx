import { STATUS_COLOR } from '../utils/constants';

export default function Badge({ value, label }: { value: string; label?: string }) {
  const color = STATUS_COLOR[value] ?? 'bg-gray-200 text-gray-600';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}
    >
      {label ?? value}
    </span>
  );
}
