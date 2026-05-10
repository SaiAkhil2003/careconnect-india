type VerifiedBadgeProps = {
  isVerified: boolean | null;
};

export function VerifiedBadge({ isVerified }: VerifiedBadgeProps) {
  if (!isVerified) {
    return null;
  }

  return (
    <span className="inline-flex items-center rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary-dark">
      Verified
    </span>
  );
}
