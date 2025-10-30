import { useCallback, useEffect, useState } from "react";

interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export const useQuery = <T>(queryFn: () => Promise<T>) => {
  const [state, setState] = useState<QueryState<T>>({
    data: null,
    loading: true,
    error: null
  });

  const memoizedQueryFn = useCallback(queryFn, []);

  useEffect(() => {
    const fetchData = async () => {
      setState({ data: null, loading: true, error: null });
      try {
        const data = await memoizedQueryFn();
        setState({ data, loading: false, error: null });
      } catch (err: any) {
        setState({ data: null, loading: false, error: err.message });
      }
    };

    fetchData();
  }, [memoizedQueryFn]);

  return state;
};
