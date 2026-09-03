import { forwardRef } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type AuthFieldProps = React.ComponentProps<typeof Input> & {
  label: string;
  error?: string;
};

export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(function AuthField(
  { label, error, id, className, ...props },
  ref,
) {
  const fieldId = id ?? props.name;
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={fieldId} className="text-small font-medium text-foreground">
        {label}
      </Label>
      <Input
        ref={ref}
        id={fieldId}
        className={cn("h-11", className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        {...props}
      />
      {error ? (
        <p id={`${fieldId}-error`} className="text-caption text-[var(--negative)]">
          {error}
        </p>
      ) : null}
    </div>
  );
});
