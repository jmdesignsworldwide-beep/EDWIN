import { Skeleton, ObraCardSkeleton } from "@/components/primitives";

/**
 * loading.tsx — skeleton mientras se cargan las obras desde Supabase.
 */
export default function ObrasLoading() {
  return (
    <>
      <div className="mb-6 flex items-end justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-11 w-36 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <ObraCardSkeleton key={i} />
        ))}
      </div>
    </>
  );
}
