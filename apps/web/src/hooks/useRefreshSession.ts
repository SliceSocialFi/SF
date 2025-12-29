import { useCallback } from 'react';
import { useApolloClient } from '@apollo/client';

/**
 * Hook để refresh session sau khi login thành công
 * Trigger refetch của useMeQuery mà không cần reload page
 */
export const useRefreshSession = () => {
  const client = useApolloClient();

  const refreshSession = useCallback(async () => {
    console.log("🔄 Refreshing session without page reload...");
    
    // Refetch tất cả active queries, đặc biệt là MeQuery
    await client.refetchQueries({
      include: "active"
    });
    
    console.log("✅ Session refreshed successfully");
  }, [client]);

  return refreshSession;
};
