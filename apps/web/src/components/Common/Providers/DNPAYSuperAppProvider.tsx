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
        console.log('Đã nhận API Key từ Super App:', { app_session_id, token: newToken });
        setAppSessionId(app_session_id);
        setToken(newToken);
        setIsReady(true);
      }
    };

    // Đăng ký lắng nghe
    window.addEventListener('message', handleMessage);

    const iframe = document.getElementById('depay-iframe') as HTMLIFrameElement | null;
    if (!iframe || !iframe.contentWindow) {
      console.warn('Không tìm thấy iframe DePay để gửi yêu cầu lấy Key.');
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
      appSessionId,
      token,
      isReady,
      currentOrder,
      setCurrentOrder,
      isLoading,
      setIsLoading
    }}>
      {children}
    </DNPAYSuperAppContext.Provider>
  );
};

export const useDNPAYSuperApp = () => useContext(DNPAYSuperAppContext);