import type { FieldPolicy, StoreValue } from "@apollo/client/core";
import type { PaginatedResultInfoFragment } from "../../generated";

interface CursorBasedPagination<T = StoreValue> {
  items: T[];
  pageInfo: PaginatedResultInfoFragment;
}

type SafeReadonly<T> = T extends object ? Readonly<T> : T;

export const cursorBasedPagination = <T extends CursorBasedPagination>(
  keyArgs: FieldPolicy["keyArgs"]
): FieldPolicy<T> => {
  return {
    keyArgs,

    merge(existing: Readonly<T> | undefined, incoming: SafeReadonly<T>, { args }) {
      if (!existing) {
        return incoming;
      }

      const existingItems = existing.items || [];
      const incomingItems = incoming.items || [];

      // Check if this is a fetchMore call (has cursor in args) or a new query
      const isFetchMore = args?.request?.cursor;
      
      return {
        ...incoming,
        items: isFetchMore ? existingItems?.concat(incomingItems) : incomingItems,
        pageInfo: incoming.pageInfo
      } as SafeReadonly<T>;
    },

    read(existing: SafeReadonly<T> | undefined) {
      if (!existing) {
        return existing;
      }
      const { items, pageInfo } = existing;

      return {
        ...existing,
        items,
        pageInfo: {
          ...pageInfo
        }
      } as SafeReadonly<T>;
    }
  };
};

export default cursorBasedPagination;
