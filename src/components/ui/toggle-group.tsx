"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

const toggleGroupItemVariants = cva(
  "inline-flex items-center justify-center gap-1 whitespace-nowrap border text-sm font-medium transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground",
  {
    variants: {
      variant: {
        default: "border-transparent bg-muted text-foreground hover:bg-muted/80",
        outline: "border-border bg-background text-foreground hover:bg-muted",
      },
      size: {
        sm: "h-8 rounded-full px-3 text-xs",
        default: "h-9 rounded-full px-3.5",
        lg: "h-10 rounded-full px-4",
      },
    },
    defaultVariants: {
      variant: "outline",
      size: "sm",
    },
  },
)

function ToggleGroup({
  className,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root>) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      className={cn("flex flex-wrap gap-2", className)}
      {...props}
    />
  )
}

function ToggleGroupItem({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item> &
  VariantProps<typeof toggleGroupItemVariants>) {
  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      className={cn(toggleGroupItemVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { ToggleGroup, ToggleGroupItem }
