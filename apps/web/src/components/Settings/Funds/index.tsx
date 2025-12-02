import { useState, useEffect } from "react";
import BackButton from "@/components/Shared/BackButton";
import NotLoggedIn from "@/components/Shared/NotLoggedIn";
import PageLayout from "@/components/Shared/PageLayout";
import { Card, CardHeader } from "@/components/Shared/UI";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import Balances from "./Balances";
import ImportTokenModal from "./ImportTokenModal";

const FundsSettings = () => {
  const { currentAccount } = useAccountStore();
  const [showImportModal, setShowImportModal] = useState(false);

  useEffect(() => {
    if (currentAccount) {
      const hasSeenModal = localStorage.getItem("hasSeenImportTokenModal");
      if (!hasSeenModal) {
        setShowImportModal(true);
      }
    }
  }, [currentAccount]);

  if (!currentAccount) {
    return <NotLoggedIn />;
  }

  return (
    <PageLayout title="Funds settings">
      <Card className="mx-2 sm:mx-0">
        <CardHeader
          icon={<BackButton path="/settings" />}
          title="Manage account balances"
        />
        <Balances />
      </Card>
      <ImportTokenModal 
        show={showImportModal} 
        onClose={() => setShowImportModal(false)} 
      />
    </PageLayout>
  );
};

export default FundsSettings;