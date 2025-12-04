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
      appSessionId:"369144bb-c145-4d47-a6f2-e9b608dd2782",
      token:"eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJkZXBheS13YWxsZXQiLCJhdWQiOiJzbGljZS1zb2NpYWxmaSIsInN1YiI6ImhpZXV0bS5zaXRlQGdtYWlsLmNvbSIsImFwcF9pZCI6InNsaWNlLXNvY2lhbGZpIiwic2NvcGVzIjpbInBheW1lbnQiLCJwcm9maWxlIiwiYmFsYW5jZSJdLCJqdGkiOiJqdGlfNjk0YTQ3YWNlZjg3NGIwMTgzZDU4NWU2ODlhODc2MWEiLCJub25jZSI6Im5vbmNlXzY2YTEyZjVlOTVmOTQyMmI5MWRlMmY2NTRjMjNmNjNjIiwiaWF0IjoxNzY0ODM0MTY3LCJleHAiOjE3NjQ4Mzc3Njd9.TbSeduxZGTa4vHSpDJ5IQ57sNJcpoAh2pHQr2R0iVEuHIyJYGaWGCwYC_MVyumrhC0FaSu61TiPlJPmVRrUr2mQw2Ia48jQtx2hL48YX7FXriV14q_0I6qss44tftxk2a7fOJx6M0g_z1k-h4GG_Q2Ez7b4K8PS5sSSEyUfUq9pnctrHXLg5KldVR2EVyZnwgwKSKFD-_FawQlonSRjEID-4MxgioyPBIMy_BdEm1Qn31l0Cj5MLMrie0u2Bk4q4LvbikP2ODl0Bq_6Greg4B0bS4BwQcYxQSMfnwekHfPjbWb7X00VAILfGSusTTw2WunzL5cs5XupxqmgXYCtn_Q",
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