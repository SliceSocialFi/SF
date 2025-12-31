import { Localstorage } from "@slice/data/storage";

const clearLocalStorage = (): void => {
  const storesToClear = Object.values(Localstorage).filter(
    (store) => store !== Localstorage.SearchStore
  );

  for (const store of storesToClear) {
    localStorage.removeItem(store);
  }
  
  // KHÔNG xóa embedded-wallet-store vì nó không nằm trong Localstorage enum
  // Nó được xóa riêng bởi clearEmbeddedWallet() trong signOut
};

export default clearLocalStorage;
