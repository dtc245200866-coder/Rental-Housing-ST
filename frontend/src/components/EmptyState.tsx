export default function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-gray-400">
      <div className="text-4xl">🗂️</div>
      <p className="text-sm">{message}</p>
    </div>
  );
}
