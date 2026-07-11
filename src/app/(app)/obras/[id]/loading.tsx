import { Skeleton } from "@/components/primitives";

/** Skeleton mientras carga el cronograma desde Supabase. */
export default function CronogramaLoading() {
  return (
    <>
      <div className="mb-6 space-y-3">
        <Skeleton className="h-4 w-16" />
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-11 w-36 rounded-xl" />
        </div>
      </div>
      <Skeleton className="mb-6 h-24 w-full rounded-2xl" />
      <Skeleton className="mb-4 h-9 w-40 rounded-xl" />
      <Skeleton className="h-64 w-full rounded-2xl" />
    </>
  );
}
