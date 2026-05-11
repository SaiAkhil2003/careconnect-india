type EmptyStateProps = {
  title?: string;
  message: string;
};

export function EmptyState({
  title = "Nothing to show yet",
  message,
}: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-6 text-center sm:p-8">
      <h2 className="text-lg font-semibold text-neutral-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-neutral-700">{message}</p>
    </div>
  );
}
