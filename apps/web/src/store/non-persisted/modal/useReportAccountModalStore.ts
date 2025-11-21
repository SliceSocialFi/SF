import type { AccountFragment } from "@slice/indexer";
import { createTrackedStore } from "@/store/createTrackedStore";

interface State {
  showReportAccountModal: boolean;
  reportingAccount?: AccountFragment;
  setShowReportAccountModal: (
    showReportAccountModal: boolean,
    reportingAccount?: AccountFragment
  ) => void;
}

const { useStore: useReportAccountModalStore } = createTrackedStore<State>(
  (set) => ({
    reportingAccount: undefined,
    setShowReportAccountModal: (showReportAccountModal, reportingAccount) =>
      set(() => ({ reportingAccount, showReportAccountModal })),
    showReportAccountModal: false
  })
);

export { useReportAccountModalStore };
