import { Skeleton } from "@/components/ui/skeleton";

export default function NewTransferLoading() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-8 w-72" />
      <Skeleton className="h-80 rounded-xl" />
    </div>
  );
}
