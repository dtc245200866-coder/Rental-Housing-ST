interface Props {
  type?: 'error' | 'success' | 'info';
  message: string;
  onClose?: () => void;
}

export default function Alert({ type = 'error', message, onClose }: Props) {
  const styles = {
    error: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
    success:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
    info: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  }[type];

  return (
    <div className={`flex items-start justify-between gap-2 rounded-lg border px-4 py-3 text-sm ${styles}`}>
      <span>{message}</span>
      {onClose && (
        <button onClick={onClose} className="font-bold opacity-60 hover:opacity-100" aria-label="Đóng">
          ✕
        </button>
      )}
    </div>
  );
}
