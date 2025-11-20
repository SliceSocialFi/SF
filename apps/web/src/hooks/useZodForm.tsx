import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";

export function useZodForm<T extends z.ZodType<any, any>>(
  opts: {
    schema: T;
    defaultValues?: z.infer<T>;
  } & Omit<Parameters<typeof useForm<z.infer<T>>>[0], "resolver">
): UseFormReturn<z.infer<T>> {
  return useForm<z.infer<T>>({
    resolver: zodResolver(opts.schema),
    defaultValues: opts.defaultValues,
    ...(opts as any),
  });
}
