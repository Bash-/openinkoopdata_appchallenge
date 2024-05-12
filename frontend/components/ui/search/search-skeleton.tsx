import { Card } from "../card";

const shimmer =
  'before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent';

export function TenderSkeleton() {
  return (
    <Card className={`${shimmer} mt-2 flex w-full flex-col gap-2`} style={{ height: 200 }}>
      <h3></h3>
      <p>

      </p>
    </Card>
  );
}

export function TendersSkeleton() {
  return (
    <div
      className={`${shimmer} relative flex w-full flex-col overflow-hidden md:col-span-4`}
    >
      <div className="mb-4 h-8 w-36 rounded-md bg-gray-100" />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <TenderSkeleton />
        <TenderSkeleton />
        <TenderSkeleton />
        <TenderSkeleton />
        <TenderSkeleton />

      </div>
    </div>
  );
}
