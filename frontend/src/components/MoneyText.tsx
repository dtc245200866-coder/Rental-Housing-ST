import { formatMoney } from '../utils/format';

export default function MoneyText({
  value,
  className = '',
}: {
  value: number;
  className?: string;
}) {
  const negative = value < 0;
  return (
    <span className={`tabular-nums ${negative ? 'text-red-600 dark:text-red-400' : ''} ${className}`}>
      {formatMoney(value)}
    </span>
  );
}
