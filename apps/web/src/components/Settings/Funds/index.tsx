import { useState, useEffect } from "react";
import BackButton from "@/components/Shared/BackButton";
import NotLoggedIn from "@/components/Shared/NotLoggedIn";
import PageLayout from "@/components/Shared/PageLayout";
import { Card, CardHeader } from "@/components/Shared/UI";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import { usePaymentReturn, PaymentReturnState } from "@/hooks/usePaymentReturn";
import Balances from "./Balances";
import ImportTokenModal from "./ImportTokenModal";
import PaymentSuccessModal from "./PaymentSuccessModal";

const FundsSettings = () => {
  const { currentAccount } = useAccountStore();
  const [showImportModal, setShowImportModal] = useState(false);
  
  const {
    state,
    // order,
    errorMessage,
    hasPaymentParams,
    clearPaymentParams
  } = usePaymentReturn();

  useEffect(() => {
    if (!currentAccount) return;

    if (!hasPaymentParams) {
      const hasSeenModal = localStorage.getItem("hasSeenImportTokenModal");
      if (!hasSeenModal) {
        setShowImportModal(true);
      }
    }
  }, [currentAccount, hasPaymentParams]);

  const handleClosePaymentModal = () => {
    clearPaymentParams();
  };

  if (!currentAccount) {
    return <NotLoggedIn />;
  }

  console.log("hasPaymentParams:", hasPaymentParams);
  console.log("Rendering FundsSettings with payment state:", state);

  return (
    <PageLayout title="Funds settings">
      <Card className="mx-2 sm:mx-0">
        <CardHeader
          icon={<BackButton path="/settings" />}
          title="Manage account balances"
        />
        <Balances />
      </Card>
      
      <PaymentSuccessModal
        show={hasPaymentParams || state !== PaymentReturnState.IDLE}
        state={state}
        // order={order}
        errorMessage={errorMessage}
        onClose={handleClosePaymentModal}
      />
      
      <ImportTokenModal 
        show={showImportModal && !hasPaymentParams} 
        onClose={() => setShowImportModal(false)} 
      />
    </PageLayout>
  );
};

export default FundsSettings;