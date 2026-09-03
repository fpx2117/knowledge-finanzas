import { Skeleton } from "@/components/ui/skeleton";

export default function NewAccountLoading() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-80 rounded-xl" />
    </div>
  );
}
