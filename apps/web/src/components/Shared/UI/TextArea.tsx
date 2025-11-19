import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { forwardRef, memo, useId } from "react";
import cn from "@/helpers/cn";
import { FieldError } from "./Form";

const textAreaVariants = cva(
  [
    "w-full rounded-xl border bg-white px-4 py-2 shadow-xs",
    "focus:border-gray-500 focus:ring-0",
    "disabled:bg-gray-500/20 disabled:opacity-60",
    "dark:bg-[#121212]"
  ],
  {
    defaultVariants: { error: false },
    variants: {
      error: {
        false: "border-gray-300 dark:border-gray-700",
        true: "border-red-500 placeholder:text-red-500"
      }
    }
  }
);

interface TextAreaProps
  extends ComponentProps<"textarea">,
    VariantProps<typeof textAreaVariants> {
  label?: string;
}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, error, label, ...props }, ref) => {
    const id = useId();

    return (
      <label className="w-full" htmlFor={id}>
        {label ? <div className="label">{label}</div> : null}
        <div
          className={cn(
            "input-wrap",
            "border",
            error ? "!border-red-500" : "border-gray-300 dark:border-gray-700",
            "rounded-xl bg-white dark:bg-[#121212]",
            { "!bg-gray-500/20 opacity-60": props.disabled }
          )}
        >
          <textarea
            className={cn(
              "relative z-10 w-full border-none bg-transparent px-4 py-2 shadow-xs",
              "focus:ring-0 outline-hidden",
              "disabled:opacity-60",
              error && "placeholder:text-red-500",
              className
            )}
            id={id}
            ref={ref}
            {...props}
          />
        </div>
        {props.name ? <FieldError name={props.name} /> : null}
      </label>
    );
  }
);

export default memo(TextArea);
