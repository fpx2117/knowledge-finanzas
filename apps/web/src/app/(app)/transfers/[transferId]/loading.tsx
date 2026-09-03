import { Skeleton } from "@/components/ui/skeleton";

export default function TransferDetailLoading() {
  return (
    <div className="flex flex-col gap-8" aria-busy="true">
      <Skeleton className="h-4 w-40" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}
