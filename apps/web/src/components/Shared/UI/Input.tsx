import type { ComponentProps, ReactNode } from "react";
import { forwardRef, memo, useId } from "react";
import cn from "@/helpers/cn";
import { FieldError } from "./Form";
import HelpTooltip from "./HelpTooltip";

interface InputProps extends Omit<ComponentProps<"input">, "prefix"> {
  className?: string;
  error?: boolean;
  helper?: ReactNode;
  hideError?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  label?: ReactNode;
  prefix?: ReactNode | string;
  skipWrapper?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className = "",
      error,
      helper,
      hideError = false,
      iconLeft,
      iconRight,
      label,
      prefix,
      skipWrapper = false,
      type = "text",
      ...props
    },
    ref
  ) => {
    const id = useId();

    const iconStyles = [
      "text-zinc-500 [&>*]:peer-focus:text-gray-500 [&>*]:h-5",
      { "!text-red-500 [&>*]:peer-focus:!text-red-500": error }
    ];

    return (
      <label className="w-full" htmlFor={id}>
        {label ? (
          <div className="mb-1 flex items-center space-x-1.5">
            <div className="font-medium text-gray-800 dark:text-gray-200">
              {label}
            </div>
            <HelpTooltip>{helper}</HelpTooltip>
          </div>
        ) : null}
        <div className="flex gap-1">
          {prefix ? (
            <div className="input-wrap flex items-center border border-gray-300 bg-white dark:border-gray-700 dark:bg-[#121212] rounded-xl px-3 shrink-0 ">
              <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {prefix}
              </span>
            </div>
          ) : null}
          {skipWrapper ? (
            <div className="relative z-10 flex w-full items-center">
              <input
                className={cn(
                  { "placeholder:text-red-500": error },
                  "peer w-full border-none bg-transparent outline-hidden focus:ring-0",
                  className
                )}
                id={id}
                ref={ref}
                type={type}
                {...props}
              />
              <span
                className={cn({ "order-first pl-3": iconLeft }, iconStyles)}
                tabIndex={-1}
              >
                {iconLeft}
              </span>
              <span
                className={cn({ "order-last pr-3": iconRight }, iconStyles)}
                tabIndex={-1}
              >
                {iconRight}
              </span>
            </div>
          ) : (
            <div
              className={cn(
                { "!bg-gray-500/20 opacity-50": props.disabled },
                { "!border-red-500": error },
                prefix ? "rounded-r-xl" : "rounded-xl",
                "input-wrap flex w-full items-center border border-gray-300 bg-white focus-within:border-gray-500 dark:border-gray-700 dark:bg-[#121212]"
              )}
            >
              <div className="relative z-10 flex w-full items-center">
                <input
                  className={cn(
                    { "placeholder:text-red-500": error },
                    prefix ? "rounded-r-xl" : "rounded-xl",
                    "peer w-full border-none bg-transparent outline-hidden focus:ring-0",
                    className
                  )}
                  id={id}
                  ref={ref}
                  type={type}
                  {...props}
                />
                <span
                  className={cn({ "order-first pl-3": iconLeft }, iconStyles)}
                  tabIndex={-1}
                >
                  {iconLeft}
                </span>
                <span
                  className={cn({ "order-last pr-3": iconRight }, iconStyles)}
                  tabIndex={-1}
                >
                  {iconRight}
                </span>
              </div>
            </div>
          )}
        </div>
        {!hideError && props.name ? <FieldError name={props.name} /> : null}
      </label>
    );
  }
);

export default memo(Input);
