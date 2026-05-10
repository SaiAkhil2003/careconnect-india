type LoadingStateProps = {
  message?: string;
};

export function LoadingState({
  message = "Loading...",
}: LoadingStateProps) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center text-sm font-medium text-neutral-700">
      {message}
    </div>
  );
}
