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
      appSessionId:"efe71114-05b8-49a0-8ed8-141819343ae4",
      token:"eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJkZXBheS13YWxsZXQiLCJhdWQiOiJzbGljZS1zb2NpYWxmaSIsInN1YiI6ImhpZXV0bS5zaXRlQGdtYWlsLmNvbSIsImFwcF9pZCI6InNsaWNlLXNvY2lhbGZpIiwic2NvcGVzIjpbInBheW1lbnQiLCJwcm9maWxlIiwiYmFsYW5jZSJdLCJqdGkiOiJqdGlfMjM5NzI0MGVmMWM5NDM1NjliYmM5NGFkNDQ3MThkODMiLCJub25jZSI6Im5vbmNlX2IwY2QwNjhhOTg1YTRhM2ZhYzVkYzVkZGQxMGE2NzM0IiwiaWF0IjoxNzY0ODE4NTA1LCJleHAiOjE3NjQ4MjIxMDV9.A1PfyT-QOoW8DA_yZyzp-BE7FIslwDEifep44D58TPCSo-BXHWy7LTsKqIFNHYFN_B2RgAz3oKEJJoOUTpe7Juun0b8JCK8wZ8yWSedxJUcpOLr9jmyaeUsCFZBQ9UOGz3aOuF7-hJOi_15AeCK9wtoruoS5khAbem2dpxaSMuYu2QXDYB5u5_C5HVFKki00RoOUltW4sVoD97whSFlBxyFnsZepmORE89_GzN5nuTmtDjB-si6BzHxTN84FAy8ETk0lkmdiCygJQ6Q0511iZSJ-BBRP7d5uJeROtSv1ykv09aETtTMuUNYsZvb8-yHIRlcOmfMqZ_CHRAXjYEXTfQ",
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