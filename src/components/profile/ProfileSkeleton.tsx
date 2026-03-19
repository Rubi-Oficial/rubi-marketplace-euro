import { Skeleton } from "@/components/ui/skeleton";

export function ProfileSkeleton() {
  return (
    <div className="container mx-auto px-4 py-6">
      <Skeleton className="h-4 w-32 mb-5" />
      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Skeleton className="aspect-[3/4] w-full rounded-xl" />
          <div className="mt-3 flex gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-16 rounded-lg flex-shrink-0" />
            ))}
          </div>
        </div>
        <div className="lg:col-span-2 space-y-5">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-24 mt-2" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-28 rounded-full" />
          </div>
          <Skeleton className="h-7 w-32" />
          <div>
            <Skeleton className="h-4 w-16 mb-2" />
            <div className="flex gap-1.5">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-7 w-24 rounded-full" />
              ))}
            </div>
          </div>
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-lg" />
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
