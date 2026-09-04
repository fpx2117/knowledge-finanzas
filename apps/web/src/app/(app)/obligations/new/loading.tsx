import { Skeleton } from "@/components/ui/skeleton";

export default function NewDebtLoading() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <Skeleton className="h-4 w-44" />
      <Skeleton className="h-9 w-80" />
      <Skeleton className="h-[30rem] rounded-xl" />
    </div>
  );
}
