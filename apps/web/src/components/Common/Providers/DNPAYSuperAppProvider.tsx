import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { SUPER_APP_ORIGIN } from '@slice/data/constants';
import { OrderData, PaymentData } from "@/types/payment-api";

type CurrentOrderData = {
  order: OrderData;
  payment: PaymentData;
}

interface DNPAYSuperAppContextType {
  appSessionId: string | null;
  token: string | null;
  isReady: boolean; // Để biết khi nào đã nhận được key
  currentOrder: CurrentOrderData | null;
  isLoading: boolean;
  setCurrentOrder: (order: CurrentOrderData | null) => void;
  setIsLoading: (loading: boolean) => void;
}

const DNPAYSuperAppContext = createContext<DNPAYSuperAppContextType>({
  appSessionId: null,
  token: null,
  isReady: false,
  currentOrder: null,
  isLoading: false,
  setCurrentOrder: () => {},
  setIsLoading: () => {},
});

export const DNPAYSuperAppProvider = ({ children }: { children: ReactNode }) => {
  const [appSessionId, setAppSessionId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== SUPER_APP_ORIGIN) {
        return;
      }

      if (event.data?.type === 'START_EVENT') {
        const { app_session_id, token: newToken } = event.data.data;
        console.log('Received API Key from Super App:', { app_session_id, token: newToken });
        setAppSessionId(app_session_id);
        setToken(newToken);
        setIsReady(true);
      }
    };

    // Register listener
    window.addEventListener('message', handleMessage);

    const iframe = document.getElementById('depay-iframe') as HTMLIFrameElement | null;
    if (!iframe || !iframe.contentWindow) {
      console.warn('DePay iframe not found to request API Key.');
      return;
    }

    iframe.contentWindow.postMessage(
      { type: 'START_EVENT' },
      SUPER_APP_ORIGIN
    );

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const [currentOrder, setCurrentOrder] = useState<CurrentOrderData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <DNPAYSuperAppContext.Provider value={{
      appSessionId:"0d4663af-1955-45af-a7d6-8ac4ff1f9cc0",
      token:"eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJkZXBheS13YWxsZXQiLCJhdWQiOiJzbGljZS1zb2NpYWxmaSIsInN1YiI6ImhpZXV0bS5zaXRlQGdtYWlsLmNvbSIsImFwcF9pZCI6InNsaWNlLXNvY2lhbGZpIiwic2NvcGVzIjpbInBheW1lbnQiLCJwcm9maWxlIiwiYmFsYW5jZSJdLCJqdGkiOiJqdGlfOTVjNzQ0YmM4MjcwNGRjOGI4ZTczOTkyYzE0ZWZkM2EiLCJub25jZSI6Im5vbmNlXzFiNWNjZWRmNDcxYjQwNzFiMTZkMTRjNWU1ZjE0Yjc2IiwiaWF0IjoxNzY0ODEwNjExLCJleHAiOjE3NjQ4MTQyMTF9.cHCNntOB0U-KokBERcVI6JQ-I9S4zdvIBxK9_5gRw7AfyBpZZuYsrG-vOZ-Yj_nyi8Q73kV9YHEPHio8NlWENJH-ZKSROUY6HT7QWsRt1MAmVnh-_clerqupp63g84u63Iy3KsNZUuNIUKqzIYZ7DC6LU_Fj8p4LxflChcODRnYNR1MUBph9ovJtLhj8sOPgg067uboRkStSuBGFkvJjeNgmvgvnortOO34H4Y4EpGjUwSNbu6BWPTwokkaC9DqjEs9DRK-yLBapjf9zGUIpW60VnWT0hNAd66q4o8W2JGpSLfm_6Hc0u_zoEQU2ETWpjnipcVd8LChQy99UG2cvDQ",
      isReady:true,
      currentOrder,
      isLoading,
      setCurrentOrder,
      setIsLoading
    }}>
      {children}
    </DNPAYSuperAppContext.Provider>
  );
};

export const useDNPAYSuperApp = () => useContext(DNPAYSuperAppContext);