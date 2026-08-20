import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer shadow-xs active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[#243A5E] text-white hover:bg-[#1C2E4A] shadow-sm",
        destructive:
          "bg-rose-600 text-white hover:bg-rose-700 shadow-sm",
        outline:
          "border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900 text-slate-700",
        secondary:
          "bg-[#EDF4FA] text-[#243A5E] hover:bg-[#CFE3F1]/80 border border-[#8FB8D6]/40",
        ghost:
          "hover:bg-slate-100 hover:text-slate-900 text-slate-600 shadow-none",
        link:
          "text-[#243A5E] underline-offset-4 hover:underline shadow-none p-0 h-auto font-medium",
        hero:
          "bg-[#243A5E] text-white hover:bg-[#1C2E4A] shadow-md hover:shadow-lg transition-all",
        heroSecondary:
          "bg-white/90 text-[#243A5E] hover:bg-white border border-[#CFE3F1] shadow-sm hover:shadow",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-9 w-9 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
