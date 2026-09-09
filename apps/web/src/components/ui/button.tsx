import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-md border border-transparent bg-clip-padding text-sm font-bold whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Reference .button — solid brand, darkens to --brand-dark on hover.
        default: "bg-primary text-primary-foreground hover:bg-brand-hover",
        // Reference .button.secondary — white with a hairline border.
        outline:
          "border-border bg-card text-secondary-foreground hover:bg-secondary hover:border-border-strong aria-expanded:bg-secondary dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "border-border bg-card text-secondary-foreground hover:bg-secondary hover:border-border-strong aria-expanded:bg-secondary dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        // Reference .button.soft — tinted brand.
        soft: "bg-brand-subtle text-brand hover:bg-brand-border/60 aria-expanded:bg-brand-border/60",
        ghost:
          "text-muted-foreground hover:bg-secondary hover:text-foreground aria-expanded:bg-secondary aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-9 gap-1.5 px-3.5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 gap-2 px-5 text-[0.9375rem] has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  // `<Button render={<Link href="…">…</Link>}>` is a navigation link that only *looks* like a
  // button. Base UI's Button would force button semantics on it (`role="button"`, Space handler,
  // and a dev-only warning about a non-<button> element). Instead, style the passed element
  // directly so it keeps its native <a> link semantics.
  if (React.isValidElement<{ className?: string; children?: React.ReactNode }>(props.render)) {
    const el = props.render
    return React.cloneElement(
      el,
      {
        "data-slot": "button",
        className: cn(buttonVariants({ variant, size }), el.props.className, className),
      } as React.HTMLAttributes<HTMLElement>,
      // `<Button render={<Link href="…" />}>Label</Button>` puts the label on the Button.
      el.props.children ?? props.children,
    )
  }

  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
