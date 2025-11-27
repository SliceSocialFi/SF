import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { SUPER_APP_ORIGIN, APP_URL } from '@slice/data/constants';

interface SuperAppContextType {
  apiKey: string | null;
  isReady: boolean; // Để biết khi nào đã nhận được key
}

const SuperAppContext = createContext<SuperAppContextType>({
  apiKey: null,
  isReady: false,
});

export const SuperAppProvider = ({ children }: { children: ReactNode }) => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== APP_URL) {
        console.warn('Nhận message từ nguồn không xác định:', event.origin);
        return;
      }

      if (event.data?.type === 'IFRAME_RESPONSE') {
        const apiKey = event.data;
        console.log('Đã nhận API Key từ Super App:', apiKey);
        setApiKey(event.data.apiKey);
        setIsReady(true);
      }
    };

    // Đăng ký lắng nghe
    window.addEventListener('message', handleMessage);

    // Gửi tín hiệu "Handshake" lên Super App để xin Key
    // Vì ta là Mini App (trong iframe) nên gửi lên window.parent
    // if (window.parent) {
    //    console.log('Gửi yêu cầu lấy Key lên Super App...');
    //    window.parent.postMessage(
    //      { type: 'IFRAME_RESPONSE' },
    //      SUPER_APP_ORIGIN
    //    );
    // }

    const iframe = document.getElementById('depay-iframe') as HTMLIFrameElement | null;
    if (!iframe || !iframe.contentWindow) {
      console.warn('Không tìm thấy iframe DePay để gửi yêu cầu lấy Key.');
      return;
    }

    iframe.contentWindow.postMessage(
      { type: 'IFRAME_RESPONSE' },
      SUPER_APP_ORIGIN
    );

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  return (
    <SuperAppContext.Provider value={{ apiKey, isReady }}>
      {children}
    </SuperAppContext.Provider>
  );
};

// Custom hook để dùng trong các component con
export const useSuperApp = () => useContext(SuperAppContext);