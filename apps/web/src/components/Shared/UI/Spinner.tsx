import { cva, type VariantProps } from "class-variance-authority";
import { memo } from "react";
import cn from "@/helpers/cn";

const spinnerVariants = cva("", {
  defaultVariants: { size: "md" },
  variants: { size: { md: "size-7", sm: "size-5", xs: "size-4" } }
});

interface SpinnerProps extends VariantProps<typeof spinnerVariants> {
  className?: string;
}

const Spinner = ({ className, size }: SpinnerProps) => {
  return (
    <img
      alt="Loading"
      className={cn(spinnerVariants({ size }), "animate-spin", className)}
      src="/favicon.png"
    />
  );
};

export default memo(Spinner);
